# NexeraQuest — QUEST. CONTRIBUTE. EARN.

Telegram-native Web3 campaign marketplace. Projects pre-fund campaigns,
contributors complete verifiable tasks, rewards settle via an auditable
double-entry ledger.

**Invariant:** verified work → verified reward → auditable settlement.

## Surfaces

| Path | Experience |
|---|---|
| `/` | Contributor Mini App (Telegram WebView) |
| `/project` | Project portal (campaigns, funding, telemetry) |
| `/admin` | Operations console (approvals, fraud, ledger) |

## Quickstart

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, BOT_TOKEN, secrets
npm run db:push
npm run db:seed
npm run dev            # web app on :3000
npm run bot            # Telegram bot daemon (separate terminal)
```

## Docs

- [Telegram testing](docs/telegram-testing.md) — BotFather + Mini App live test
- [Vercel deploy](docs/vercel-deploy.md) — GitHub → Vercel hosting
- [Architecture](docs/architecture.md) · [Ledger](docs/ledger.md) ·
  [Security](docs/security.md) · [Deployment](docs/deployment.md)

## Stack

Next.js 14 · TypeScript · Prisma (Neon Postgres) · Tailwind ·
Telegram Bot API · Vitest (19 tests)
