# Deploying NexeraQuest to Vercel (Mini App live in ~10 min)

## 1. Free Postgres (2 min)

Vercel has no disk — SQLite won't survive deploys. Create a free Postgres:

- [Neon](https://neon.tech) → New Project → copy the **pooled** connection string, or
- [Supabase](https://supabase.com) → New Project → Settings → Database → copy URI.

It looks like: `postgresql://user:pass@host/db?sslmode=require`

## 2. Deploy the web app (3 min)

```bash
cd "D:\Anitgravity Dapp\apps\web"
npx vercel
```

Accept defaults. When it asks for the project root, say **`apps/web`**.

You get: `https://nexeraquest-xxx.vercel.app`

## 3. Environment variables (Vercel dashboard → Settings → Environment Variables)

| Key | Value |
|---|---|
| `DATABASE_PROVIDER` | `postgresql` |
| `DATABASE_URL` | pooled Postgres URL from step 1 |
| `JWT_SECRET` | long random string (generate: `openssl rand -base64 32`) |
| `TELEGRAM_BOT_TOKEN` | token from [@BotFather](https://t.me/BotFather) `/newbot` |
| `TELEGRAM_BOT_USERNAME` | your bot username (no @) |
| `NEXT_PUBLIC_MINI_APP_URL` | `https://nexeraquest-xxx.vercel.app/` |
| `SANDBOX_MODE` | `true` (set `false` later for real membership checks) |
| `NEXT_PUBLIC_SANDBOX_MODE` | `true` (shows the sandbox banner in-app) |
| `STORAGE_PROVIDER` | `local` (proof uploads disabled on Vercel — see note) |

Then **redeploy** (Vercel → Deployments → Redeploy) so vars take effect.

## 4. Push schema + seed to Postgres (1 min, from your PC)

```bash
cd "D:\Anitgravity Dapp"
$env:DATABASE_PROVIDER="postgresql"
$env:DATABASE_URL="<paste pooled URL>"
npm run db:push
npm run db:seed
```

## 5. Register with BotFather (2 min)

1. `/newapp` → pick your bot → title `NexeraQuest` → paste `https://nexeraquest-xxx.vercel.app/`
2. `/setmenubutton` → same URL, label `Open NexeraQuest`
3. Open the bot in Telegram → `/start` → tap **Launch** → Mini App opens live. 🎉

## 6. Bot daemon (runs on your PC for now)

```bash
cd "D:\Anitgravity Dapp"
npm run bot
```

It uses the same `.env` — notifications and `/start` onboarding work against the Vercel-hosted app.

## Notes & limits

- **Proof uploads**: `STORAGE_PROVIDER=local` writes to disk, which Vercel discards. URL/text proofs work fine; file uploads need S3/R2 (wired as next infra step).
- **Workers** (settlement/fraud/reconciliation cron): run via `npx tsx workers/*.ts` on your PC or move to Vercel Cron later.
- **Never commit `.env`** — only `.env.example`. Secrets live in Vercel dashboard.
- Admin/project portals ride along on the same deployment (`/project`, `/admin`) — open them in a desktop browser, not Telegram.
