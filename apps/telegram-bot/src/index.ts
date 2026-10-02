import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '@nexeraquest/database';
import { APP_CONFIG } from '@nexeraquest/config';

const token = process.env.TELEGRAM_BOT_TOKEN;

async function startBot() {
  if (!token || token.trim().length < 10) {
    console.warn('⚠️ [TelegramBot] TELEGRAM_BOT_TOKEN is not configured. Telegram Bot running in simulated offline mode.');
    console.log(`ℹ️ [TelegramBot] Mini App URL configured as: ${APP_CONFIG.telegramMiniAppUrl}`);
    return;
  }

  console.log('🤖 [TelegramBot] Starting Telegram Bot with polling...');
  const bot = new TelegramBot(token, { polling: true });

  const getWebAppButton = (text: string, route = '') => {
    const url = route ? `${APP_CONFIG.telegramMiniAppUrl}?startapp=${encodeURIComponent(route)}` : APP_CONFIG.telegramMiniAppUrl;
    return [
      [
        {
          text,
          web_app: { url },
        },
      ],
    ];
  };

  // /start command with optional referral parameter
  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = String(msg.from?.id);
    const username = msg.from?.username || `user_${telegramId.slice(-4)}`;
    const firstName = msg.from?.first_name || 'Contributor';
    const lastName = msg.from?.last_name || '';
    const referralCode = match ? match[1]?.trim() : undefined;

    try {
      // Find or create contributor in DB
      let user = await prisma.user.findUnique({ where: { telegramId } });
      if (!user) {
        let referredById: string | undefined;
        if (referralCode) {
          const referrer = await prisma.user.findFirst({ where: { referralCode } });
          if (referrer && referrer.telegramId !== telegramId) {
            referredById = referrer.id;
          }
        }

        user = await prisma.user.create({
          data: {
            telegramId,
            telegramUsername: username,
            firstName,
            lastName,
            role: 'CONTRIBUTOR',
            status: 'ACTIVE',
            trustScore: 50,
            referralCode: `NQ_${telegramId.slice(-5)}`,
            referredById,
          },
        });

        // Create balance account
        await prisma.balanceAccount.create({
          data: {
            userId: user.id,
            accountType: 'CONTRIBUTOR',
            currency: 'USDT',
          },
        });
      }

      const welcomeText =
        `⚡ *Welcome to NexeraQuest, ${firstName}!* ⚡\n\n` +
        `_QUEST. CONTRIBUTE. EARN._\n\n` +
        `The Telegram-native marketplace connecting top Web3 projects with verified contributors.\n\n` +
        `🎯 *Discover Campaigns:* Join communities, test products, create content.\n` +
        `💎 *Guaranteed Rewards:* 100% pre-funded escrow settlement in USDT.\n` +
        `🛡️ *Trust Score:* Level up your on-platform reputation.\n\n` +
        `Click below to launch your Mini App dashboard!`;

      await bot.sendMessage(chatId, welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: getWebAppButton('🚀 Launch NexeraQuest', ''),
        },
      });
    } catch (err: any) {
      console.error('Error in /start handler:', err);
      await bot.sendMessage(chatId, 'Welcome to NexeraQuest! Launch the Mini App below.', {
        reply_markup: { inline_keyboard: getWebAppButton('🚀 Open App', '') },
      });
    }
  });

  // /quests command
  bot.onText(/\/quests/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      `🔥 *Active Verified Web3 Quests Available*\n\nExplore high-reward campaigns and earn instant rewards:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: getWebAppButton('🔍 Browse All Quests', 'explore'),
        },
      }
    );
  });

  // /wallet command
  bot.onText(/\/wallet/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      `💼 *Your NexeraQuest Internal Wallet*\n\nTrack your available USDT, completed rewards, and request withdrawals:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: getWebAppButton('💳 Open Wallet & Withdraw', 'wallet'),
        },
      }
    );
  });

  // /profile command
  bot.onText(/\/profile/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      `👤 *Contributor Reputation & Profile*\n\nView your Trust Score, completed quests, and account statistics:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: getWebAppButton('⭐ View Reputation', 'profile'),
        },
      }
    );
  });

  // /referrals command
  bot.onText(/\/referrals/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      `🎁 *NexeraQuest Referral Program*\n\nInvite other Web3 enthusiasts and earn qualified bounty bonuses for every task they complete!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: getWebAppButton('👥 Manage Referrals', 'profile'),
        },
      }
    );
  });

  // /help command
  bot.onText(/\/help/, async (msg) => {
    const helpMsg =
      `ℹ️ *NexeraQuest Commands Help*\n\n` +
      `/start - Launch or re-initialize NexeraQuest\n` +
      `/quests - Explore open campaigns\n` +
      `/wallet - Check available balance & cashout\n` +
      `/profile - View your Trust Score & badges\n` +
      `/referrals - Get your unique invite link\n` +
      `/help - View this help menu\n\n` +
      `Need support? Visit our official community channel or open the Help center inside the Mini App.`;

    await bot.sendMessage(msg.chat.id, helpMsg, { parse_mode: 'Markdown' });
  });

  console.log('✅ [TelegramBot] Telegram Bot is active and listening.');
}

startBot().catch(console.error);
