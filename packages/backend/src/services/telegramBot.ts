import { Bot, InlineKeyboard } from 'grammy';
import { prisma } from '../prisma.js';

export class TelegramBotService {
  private static bot: Bot | null = null;
  private static botUsername: string | null = null;

  static getBotUsername(): string | null {
    return this.botUsername || process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, '') || null;
  }

  static isLive(): boolean {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    return Boolean(token && !token.startsWith('mock_'));
  }

  static async init(token: string, webAppUrl: string) {
    if (!token || token.startsWith('mock_')) {
      console.log('ℹ️ Telegram Bot running in mock mode (Set TELEGRAM_BOT_TOKEN for live Telegram connectivity).');
      return null;
    }

    try {
      this.bot = new Bot(token);

      this.bot.catch((err) => {
        console.warn('⚠️ Telegram Bot polling error:', err.message);
      });

      // Fetch bot info early so /api/auth/config immediately knows botUsername
      try {
        const me = await this.bot.api.getMe();
        this.botUsername = me.username ?? null;
      } catch (meErr: any) {
        console.warn('⚠️ Could not fetch bot getMe():', meErr?.message);
      }

      // Handle /start with optional referral payload: /start ref_USER123
      this.bot.command('start', async (ctx) => {
        const payload = ctx.match;
        const username = ctx.from?.username || ctx.from?.first_name || 'Contributor';

        let launchUrl = webAppUrl;
        if (payload && payload.startsWith('ref_')) {
          const refCode = payload.replace('ref_', '');
          const separator = webAppUrl.includes('?') ? '&' : '?';
          launchUrl = `${webAppUrl}${separator}ref=${encodeURIComponent(refCode)}`;
        }

        const keyboard = new InlineKeyboard()
          .webApp('🚀 Open NexeraQuest App', launchUrl)
          .row()
          .url('📢 Announcements', 'https://t.me/nexeraquest')
          .url('💬 Community Chat', 'https://t.me/nexeraquest_chat');

        await ctx.reply(
          `👋 Welcome to *NexeraQuest*, @${username}!\n\n` +
            `🎯 *QUEST. CONTRIBUTE. EARN.*\n\n` +
            `Complete verified Web3 tasks, build your on-chain Trust Score, and earn instant crypto payouts.\n\n` +
            `💰 *100% Pre-Funded Rewards in Escrow*\n` +
            `🛡️ *Non-Custodial Payouts to your Wallet*\n\n` +
            `Tap below to launch the Mini App and start earning:`,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          }
        );
      });

      // Handle /quests
      this.bot.command('quests', async (ctx) => {
        const activeCampaigns = await prisma.campaign.findMany({
          where: { status: 'ACTIVE' },
          take: 3,
        });

        let text = `🔥 *Trending NexeraQuest Campaigns:*\n\n`;
        activeCampaigns.forEach((c, idx) => {
          text += `${idx + 1}. *${c.title}*\n`;
          text += `   💰 Reward: *${c.rewardPerAction.toFixed(2)} USDT*\n`;
          text += `   👥 Slots: *${c.completedSlots}/${c.targetSlots} filled*\n\n`;
        });

        const keyboard = new InlineKeyboard().webApp('⚡ View All Quests', webAppUrl);

        await ctx.reply(text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      });

      // Handle /balance
      this.bot.command('balance', async (ctx) => {
        const telegramId = ctx.from?.id.toString();
        const user = telegramId
          ? await prisma.user.findUnique({
              where: { telegramId },
              include: { balanceAccount: true },
            })
          : null;

        const available = user?.balanceAccount?.available ?? 0;
        const pending = user?.balanceAccount?.pending ?? 0;
        const trust = user?.trustScore ?? 50;

        const keyboard = new InlineKeyboard().webApp('💳 Cash Out / Wallet', webAppUrl);

        await ctx.reply(
          `💳 *Your NexeraQuest Balance*\n\n` +
            `• Available: *${available.toFixed(2)} USDT*\n` +
            `• Pending Cash-out: *${pending.toFixed(2)} USDT*\n` +
            `• Trust Score: *${trust}/100*\n\n` +
            `Withdraw directly to your TON or EVM wallet inside the app.`,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          }
        );
      });

      this.bot.start({
        onStart: (botInfo) => {
          this.botUsername = botInfo.username ?? null;
          console.log(`🤖 Telegram Bot @${botInfo.username} started listening (WebApp: ${webAppUrl}).`);
        },
      });

      return this.bot;
    } catch (err) {
      console.warn('⚠️ Could not start Telegram bot with provided token:', err);
      return null;
    }
  }

  static async stop() {
    if (this.bot) {
      try {
        await this.bot.stop();
        console.log('🛑 Telegram Bot stopped cleanly.');
      } catch (err) {
        console.warn('⚠️ Error stopping Telegram Bot:', err);
      }
    }
  }

  static async sendNotification(telegramId: string, message: string) {
    if (!this.bot) return;
    try {
      await this.bot.api.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    } catch (e) {
      console.warn(`Failed to send Telegram notification to ${telegramId}:`, e);
    }
  }
}
