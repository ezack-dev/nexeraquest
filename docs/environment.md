# NexeraQuest Environment Configuration Matrix

## 1. Required Variables

| Variable | Description | Default / Example | Required In |
|---|---|---|---|
| `DATABASE_URL` | Prisma database connection URL (PostgreSQL or SQLite) | `file:./dev.db` / `postgresql://...` | All Environments |
| `JWT_SECRET` | Cryptographic secret for signing session tokens | Secure 256-bit secret string | All Environments |
| `TELEGRAM_BOT_TOKEN` | API Token from Telegram `@BotFather` | `123456789:AAH...` | Production / Live Telegram |
| `TELEGRAM_BOT_USERNAME` | Telegram handle of the official bot | `NexeraQuestBot` | All Environments |
| `TELEGRAM_MINI_APP_URL` | Public URL for Telegram Mini App launch button | `https://t.me/NexeraQuestBot/app` | All Environments |
| `SANDBOX_MODE` | Enables local simulated Telegram check & instant sandbox cashouts | `true` | Dev / Staging |
| `NEXT_PUBLIC_APP_URL` | Public origin URL for CORS & deep linking | `http://localhost:3000` | All Environments |
| `NODE_ENV` | Runtime mode | `development` / `production` | All Environments |
| `STORAGE_PROVIDER` | Object storage driver (`local`, `s3`, `r2`) | `local` | Production |

## 2. Environment Segregation
- **Development:** Local SQLite file database, sandbox mode enabled, local Telegram mock verification fallback when no bot token is present.
- **Staging:** Hosted PostgreSQL instance, Telegram Bot API connected to test bot, simulated payment rail callbacks.
- **Production:** High-availability PostgreSQL cluster, Redis for queuing, live Telegram Bot API, hardened JWT rotation, AWS S3 / Cloudflare R2 bucket for encrypted proof storage.
