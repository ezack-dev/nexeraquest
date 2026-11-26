import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { TrustService } from '../services/trustService.js';
import { TelegramBotService } from '../services/telegramBot.js';

export const authRouter = Router();

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'nexeraquest_dev_session_secret';
}

function signSessionToken(userId: string, authMode: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      uid: userId,
      mode: authMode,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })
  ).toString('base64url');

  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');

  return `${payload}.${sig}`;
}

function verifySessionToken(token: string): { uid: string; mode: string } | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;

    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(payload)
      .digest('base64url');

    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.uid || !decoded.exp || decoded.exp < Date.now()) return null;

    return { uid: decoded.uid, mode: decoded.mode || 'telegram_widget' };
  } catch {
    return null;
  }
}

/**
 * Validates Telegram Mini App initData hash using WebAppData HMAC-SHA256
 */
function verifyTelegramWebAppData(initData: string, botToken: string): boolean {
  if (!initData || !botToken || botToken.startsWith('mock_')) {
    return true;
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const authDate = Number(urlParams.get('auth_date') || '0');
    if (!hash) return false;

    // Reject expired initData older than 24 hours
    if (authDate > 0 && Math.floor(Date.now() / 1000) - authDate > 86400) {
      return false;
    }

    urlParams.delete('hash');
    const dataCheckArr: string[] = [];
    urlParams.sort();
    urlParams.forEach((val, key) => dataCheckArr.push(`${key}=${val}`));
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculateHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    return calculateHash === hash;
  } catch {
    return false;
  }
}

/**
 * Validates Telegram Login Widget payload using SHA256(botToken) HMAC-SHA256
 */
function verifyTelegramLoginWidget(payload: Record<string, any>, botToken: string): boolean {
  if (!botToken || botToken.startsWith('mock_')) {
    return false;
  }

  try {
    const { hash, auth_date, id } = payload;
    if (!hash || !id || !auth_date) return false;

    if (Math.floor(Date.now() / 1000) - Number(auth_date) > 86400) {
      return false;
    }

    const allowedFields = ['auth_date', 'first_name', 'id', 'last_name', 'photo_url', 'username'];
    const dataCheckArr = allowedFields
      .filter((k) => payload[k] !== undefined && payload[k] !== null && payload[k] !== '')
      .sort()
      .map((k) => `${k}=${payload[k]}`);

    const dataCheckString = dataCheckArr.join('\n');
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    return calculatedHash === hash;
  } catch {
    return false;
  }
}

async function upsertTelegramUser(params: {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  referralCode?: string;
}) {
  let user = await prisma.user.findUnique({
    where: { telegramId: params.telegramId },
    include: { balanceAccount: true },
  });

  if (!user) {
    const genRefCode = `NQ${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    let referredById: string | undefined = undefined;
    if (params.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: params.referralCode },
      });
      if (referrer) referredById = referrer.id;
    }

    user = await prisma.user.create({
      data: {
        telegramId: params.telegramId,
        username: params.username || `tg_${params.telegramId}`,
        firstName: params.firstName || 'Telegram',
        lastName: params.lastName || '',
        referralCode: genRefCode,
        referredById,
        balanceAccount: {
          create: {
            available: 0,
            pending: 0,
            withdrawn: 0,
          },
        },
      },
      include: { balanceAccount: true },
    });
  } else if (params.username && user.username !== params.username) {
    // Keep handle updated if real user changed it on Telegram
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: params.username,
        firstName: params.firstName ?? user.firstName,
        lastName: params.lastName ?? user.lastName,
      },
      include: { balanceAccount: true },
    });
  }

  return user;
}

function formatUserResponse(user: any) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    trustScore: user.trustScore,
    status: user.status,
    referralCode: user.referralCode,
    balance: user.balanceAccount,
  };
}

/**
 * GET /api/auth/config
 * Public auth configuration for client (Telegram bot handle & Hybrid demo availability)
 */
authRouter.get('/config', (_req: Request, res: Response): void => {
  res.json({
    botUsername: TelegramBotService.getBotUsername(),
    telegramAuthConfigured: TelegramBotService.isLive(),
    demoModeEnabled: process.env.ENABLE_DEMO_AUTH !== 'false',
  });
});

/**
 * POST /api/auth/telegram
 * Authenticates user from Telegram Mini App or Hybrid Browser Demo
 */
authRouter.post('/telegram', async (req: Request, res: Response): Promise<void> => {
  try {
    const { initData, mockUser, referralCode } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN || 'mock_token';
    const demoEnabled = process.env.ENABLE_DEMO_AUTH !== 'false';

    let telegramId = '';
    let username = 'guest';
    let firstName = 'Web3';
    let lastName = 'Contributor';
    let authMode: 'telegram_miniapp' | 'demo' = 'demo';

    if (initData) {
      const isValid = verifyTelegramWebAppData(initData, botToken);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid Telegram WebApp authentication hash' });
        return;
      }

      const params = new URLSearchParams(initData);
      const userParam = params.get('user');
      if (userParam) {
        const parsed = JSON.parse(userParam);
        telegramId = parsed.id?.toString();
        username = parsed.username || `tg_${telegramId}`;
        firstName = parsed.first_name || '';
        lastName = parsed.last_name || '';
        authMode = 'telegram_miniapp';
      }
    } else if (demoEnabled) {
      if (mockUser) {
        telegramId = mockUser.telegramId || `demo_${Date.now()}`;
        username = mockUser.username || `demouser_${telegramId.slice(-4)}`;
        firstName = mockUser.firstName || 'Demo';
        lastName = mockUser.lastName || 'Tester';
      } else {
        telegramId = 'demo_user_101';
        username = 'alex_web3';
        firstName = 'Alex';
        lastName = 'Rivers';
      }
    } else {
      res.status(401).json({ error: 'Telegram authentication is required in strict mode.' });
      return;
    }

    if (!telegramId) {
      res.status(400).json({ error: 'Missing Telegram identity' });
      return;
    }

    const user = await upsertTelegramUser({
      telegramId,
      username,
      firstName,
      lastName,
      referralCode,
    });

    res.json({
      user: formatUserResponse(user),
      authMode,
      sessionToken: authMode === 'telegram_miniapp' ? signSessionToken(user.id, authMode) : undefined,
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message || 'Authentication failed' });
  }
});

/**
 * POST /api/auth/telegram-widget
 * Authenticates real Telegram user signing in via Telegram Login Widget in web browser
 */
authRouter.post('/telegram-widget', async (req: Request, res: Response): Promise<void> => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!botToken || botToken.startsWith('mock_')) {
      res.status(400).json({ error: 'Live TELEGRAM_BOT_TOKEN is not configured on the server.' });
      return;
    }

    const { widgetData, referralCode } = req.body;
    if (!widgetData || !verifyTelegramLoginWidget(widgetData, botToken)) {
      res.status(401).json({ error: 'Invalid or expired Telegram Login Widget signature.' });
      return;
    }

    const telegramId = String(widgetData.id);
    const user = await upsertTelegramUser({
      telegramId,
      username: widgetData.username || `tg_${telegramId}`,
      firstName: widgetData.first_name || 'Telegram',
      lastName: widgetData.last_name || '',
      referralCode,
    });

    res.json({
      user: formatUserResponse(user),
      authMode: 'telegram_widget',
      sessionToken: signSessionToken(user.id, 'telegram_widget'),
    });
  } catch (error: any) {
    console.error('Telegram Widget Auth error:', error);
    res.status(500).json({ error: error.message || 'Telegram widget authentication failed' });
  }
});

/**
 * POST /api/auth/session
 * Restores an authenticated Telegram session token
 */
authRouter.post('/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) {
      res.status(401).json({ error: 'Missing session token' });
      return;
    }

    const decoded = verifySessionToken(String(sessionToken));
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired session token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.uid },
      include: { balanceAccount: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Session user not found' });
      return;
    }

    res.json({
      user: formatUserResponse(user),
      authMode: decoded.mode,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/referral/bind
 * Attaches a referrer code with cyclic/self-referral protection
 */
authRouter.post('/referral/bind', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, referralCode } = req.body;
    if (!userId || !referralCode) {
      res.status(400).json({ error: 'Missing userId or referralCode' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.referredById) {
      res.status(400).json({ error: 'User already has an attributed referrer' });
      return;
    }

    const referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (!referrer) {
      res.status(404).json({ error: 'Invalid referral code' });
      return;
    }

    const hasCycle = await TrustService.checkReferralCycle(userId, referrer.id);
    if (hasCycle) {
      res.status(400).json({ error: 'Cyclic or self-referral rejected by anti-fraud policy' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { referredById: referrer.id },
    });

    res.json({ success: true, referredById: updated.referredById });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
