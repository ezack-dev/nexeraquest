# Testing NexeraQuest inside Telegram (Bot + Mini App)

## 1. What you need (5 min, one time)

1. **A bot token** — talk to [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token.
2. **A public HTTPS URL for the web app** — Telegram refuses `http://localhost`.
   Easiest: [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/):
   ```bash
   ngrok http 3000
   # → https://xxxx-xx-xx-xxx-xx.ngrok-free.app
   ```
3. **Fill `.env`** (copy from `.env.example`):
   ```
   TELEGRAM_BOT_TOKEN="<token from BotFather>"
   TELEGRAM_BOT_USERNAME="<your_bot_username>"
   NEXT_PUBLIC_MINI_APP_URL="https://<your-tunnel>/"
   SANDBOX_MODE="true"
   ```

## 2. Register the Mini App with BotFather

1. `/newapp` → pick your bot → title `NexeraQuest` → upload an icon (any 640×360 PNG).
2. When asked for the Web App URL, paste `https://<your-tunnel>/`.
3. Optional: `/setmenubutton` → pick your bot → paste the same URL + label `Open NexeraQuest`.
   (This puts a permanent button next to the message input.)

## 3. Run everything (3 terminals)

```bash
# terminal 1 — database + seed (first time only)
npm run db:push
npm run db:seed

# terminal 2 — web app (contributor Mini App + APIs)
npm run dev

# terminal 3 — Telegram bot daemon
npm run bot
```

## 4. Test the full loop in Telegram

1. Open your bot in Telegram → `/start` → tap **Launch NexeraQuest**.
   The Mini App opens full-screen (portal header auto-hides inside Telegram).
2. **Explore** → open the seeded campaign → **Start Quest** → do the action → **Verify & claim**.
   In `SANDBOX_MODE=true`, Telegram membership checks auto-pass so you can test end-to-end without a real group.
3. **Wallet** → balance updates → **Cashout** → enter any address → request withdrawal.
4. Open `/project` and `/admin` **in a desktop browser** (same tunnel URL) to approve the campaign, review proofs, and authorize the payout.

## 5. Real Telegram verification (optional)

1. Create a Telegram group/channel, add your bot as admin.
2. Note the chat ID (forward a message to [@userinfobot](https://t.me/userinfobot) or use `@getmyid_bot`).
3. When creating a campaign, set the verification config `chat_id` to that ID and set `SANDBOX_MODE="false"`.
4. Now Verify checks real `getChatMember` membership — join = pass, leave = fail.

## Troubleshooting

| Symptom | Cause → fix |
|---|---|
| Mini App button does nothing | URL isn't public HTTPS → check tunnel is running and `NEXT_PUBLIC_MINI_APP_URL` matches it |
| "Bot token not configured" in bot logs | `.env` missing `TELEGRAM_BOT_TOKEN` or bot terminal started before `.env` was saved → restart it |
| Verification always passes | `SANDBOX_MODE=true` → expected; set `false` + real `chat_id` for genuine checks |
| Blank screen in Mini App | API unreachable → confirm `npm run dev` is up and tunnel forwards port 3000 |
| Portal header covers the app in Telegram | Update to latest — header now auto-hides when `Telegram.WebApp.initData` is present |
