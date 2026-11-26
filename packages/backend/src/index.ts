import dotenv from 'dotenv';
import { createApp } from './app.js';
import { TelegramBotService } from './services/telegramBot.js';
import { ensureInitialSeed } from './seedCore.js';

dotenv.config();

async function bootstrap() {
  // Ensure fresh cloud databases (e.g. Render Postgres) have starter campaigns on first boot
  await ensureInitialSeed();

  const app = createApp();
  const PORT = process.env.PORT || 4000;
  const botToken = process.env.TELEGRAM_BOT_TOKEN || 'mock_token';
  const webAppUrl =
    process.env.WEB_APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    'http://localhost:5173';

  const server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 NexeraQuest Server running on port ${PORT}`);
    console.log(`🌐 Public/App URL: ${webAppUrl}`);
    console.log(`======================================================\n`);
  });

  await TelegramBotService.init(botToken, webAppUrl);

  const shutdown = async () => {
    console.log('Shutting down NexeraQuest gracefully...');
    await TelegramBotService.stop();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});
