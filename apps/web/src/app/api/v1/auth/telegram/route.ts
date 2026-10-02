import { NextRequest } from 'next/server';
import { validateTelegramInitData, signSessionToken } from '@nexeraquest/auth';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError } from '@/lib/api-helper';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, simulatedTelegramId } = body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    let telegramUser: any = null;

    if (botToken && botToken.trim().length > 10) {
      if (!initData) {
        return jsonError('Missing initData parameter', 'AUTH_ERROR', 400);
      }
      const validation = validateTelegramInitData(initData, botToken);
      if (!validation.isValid || !validation.user) {
        return jsonError(validation.error || 'Invalid Telegram authentication signature', 'INVALID_SIGNATURE', 401);
      }
      telegramUser = validation.user;
    } else {
      // In sandbox/development when no bot token is present
      const targetId = String(simulatedTelegramId || '123456789');
      telegramUser = {
        id: Number(targetId),
        first_name: targetId === '123456789' ? 'David' : 'Elena',
        last_name: targetId === '123456789' ? 'Chen' : 'Rostova',
        username: targetId === '123456789' ? 'cryptodave' : 'elenazk',
      };
    }

    const telegramIdStr = String(telegramUser.id);

    // Upsert User
    let user = await prisma.user.findUnique({
      where: { telegramId: telegramIdStr },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: telegramIdStr,
          telegramUsername: telegramUser.username || `tg_${telegramIdStr.slice(-4)}`,
          firstName: telegramUser.first_name || 'Contributor',
          lastName: telegramUser.last_name || '',
          role: 'CONTRIBUTOR',
          status: 'ACTIVE',
          trustScore: 50,
          referralCode: `NQ_${telegramIdStr.slice(-5)}`,
        },
      });

      // Initialize Balance Account
      await prisma.balanceAccount.create({
        data: {
          userId: user.id,
          accountType: 'CONTRIBUTOR',
          currency: 'USDT',
        },
      });
    }

    const token = signSessionToken({
      userId: user.id,
      role: user.role as any,
      telegramId: user.telegramId,
      email: user.email,
    });

    return jsonSuccess({
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        trustScore: user.trustScore,
        referralCode: user.referralCode,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err: any) {
    return jsonError(err.message, 'SERVER_ERROR', 500);
  }
}
