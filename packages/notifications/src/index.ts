import { prisma } from '@nexeraquest/database';
import { APP_CONFIG } from '@nexeraquest/config';

export interface SendNotificationParams {
  userId: string;
  templateKey: string;
  title: string;
  messageBody: string;
  deepLinkRoute?: string;
  channel?: 'TELEGRAM' | 'IN_APP' | 'EMAIL';
}

export class NotificationDispatcher {
  /**
   * Generates Telegram deep link to direct the user right into the corresponding Mini App screen
   */
  static buildDeepLink(route?: string): string {
    const base = APP_CONFIG.telegramMiniAppUrl;
    if (!route) return base;
    const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
    return `${base}?startapp=${encodeURIComponent(cleanRoute)}`;
  }

  /**
   * Dispatches a notification to internal database and attempts Telegram Bot delivery if available
   */
  static async dispatch(params: SendNotificationParams) {
    const { userId, templateKey, title, messageBody, deepLinkRoute, channel = 'TELEGRAM' } = params;
    const deepLink = this.buildDeepLink(deepLinkRoute);

    // 1. Create DB notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        channel,
        templateKey,
        title,
        messageBody,
        deepLink,
        status: 'QUEUED',
      },
    });

    // 2. If Telegram channel, attempt to push via Telegram Bot API
    if (channel === 'TELEGRAM') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (botToken && user?.telegramId) {
        try {
          const text = `🔔 *${title}*\n\n${messageBody}`;
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.telegramId,
              text,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🚀 Open NexeraQuest',
                      url: deepLink,
                    },
                  ],
                ],
              },
            }),
          });

          const data = await res.json();
          if (data.ok) {
            await prisma.notification.update({
              where: { id: notification.id },
              data: { status: 'SENT' },
            });
            return { success: true, notificationId: notification.id, delivered: true };
          } else {
            console.warn(`Telegram push failed for user ${userId}:`, data.description);
          }
        } catch (err: any) {
          console.warn(`Error sending Telegram push: ${err.message}`);
        }
      }
    }

    return { success: true, notificationId: notification.id, delivered: false };
  }

  /**
   * Fan-out the same template to many users (e.g. campaign paused/closed).
   * Sequential dispatch keeps ordering predictable; failures are isolated per user.
   */
  static async broadcast(
    userIds: string[],
    template: { templateKey: string; title: string; messageBody: string; deepLinkRoute?: string; channel?: 'TELEGRAM' | 'IN_APP' | 'EMAIL' }
  ) {
    const results = [];
    for (const userId of userIds) {
      try {
        results.push(await this.dispatch({ userId, ...template }));
      } catch (err: any) {
        results.push({ success: false, userId, error: err.message });
      }
    }
    return results;
  }
}
