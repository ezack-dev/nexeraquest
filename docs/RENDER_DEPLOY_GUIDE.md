# NexeraQuest — Step-by-Step Render Deployment & Telegram Setup Guide

This guide walks you through every preparation step to host **NexeraQuest** on **Render** with a managed PostgreSQL database, connect a real Telegram bot from **@BotFather**, and enable **Hybrid Authentication** (real Telegram Mini App login + real browser Telegram Login Widget + sandbox demo preview).

---

## Phase 1: Prepare Your Telegram Bot in `@BotFather`

1. Open Telegram and search for **`@BotFather`** (verified account with blue checkmark).
2. Send `/newbot`.
3. Choose a display name (for example: `NexeraQuest`).
4. Choose a bot username ending in `bot` (for example: `NexeraQuest_Bot` or `NexeraQuestAppBot`).
5. `@BotFather` will reply with your **HTTP API Token** (looks like `7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
   - **Save this token** — you will paste it into Render as `TELEGRAM_BOT_TOKEN`.
   - Keep it secret; never commit it to GitHub.

---

## Phase 2: Push Your Code to GitHub

Render deploys directly from a GitHub repository. Notice `.gitignore` is already configured so `.env`, `dev.db`, `node_modules/`, and `dist/` will not be uploaded.

1. Create a new repository on [github.com/new](https://github.com/new) (e.g. `nexeraquest`). Leave it completely empty (do not add a README or `.gitignore` on GitHub).
2. In your project folder (`d:\Anitgravity Dapp`), initialize/check git and push:
   ```bash
   git add PRD.md README.md .gitignore package.json package-lock.json render.yaml docs/ packages/
   git commit -m "NexeraQuest MVP ready for Render deployment"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/nexeraquest.git
   git push -u origin main
   ```

---

## Phase 3: Deploy on Render (Web Service + Free PostgreSQL)

The repo includes [render.yaml](file:///d:/Anitgravity%20Dapp/render.yaml), which automatically sets up both your Node server and your PostgreSQL database in one click.

1. Log in or sign up at [dashboard.render.com](https://dashboard.render.com/) using your GitHub account.
2. Click **New +** -> **Blueprint**.
3. Connect and select your **`nexeraquest`** GitHub repository.
4. Render detects `render.yaml` (`nexeraquest` web service + `nexeraquest-db` PostgreSQL database).
5. When Render prompts you for the unsynced environment variables:
   - **`TELEGRAM_BOT_TOKEN`**: Paste the token from `@BotFather` in Phase 1.
   - **`TELEGRAM_BOT_USERNAME`**: Enter your bot username **without** `@` (e.g. `NexeraQuestAppBot`).
   - **`WEB_APP_URL`**: Leave blank for the first deploy (or enter `https://nexeraquest.onrender.com` if you know your app URL; the server automatically falls back to Render's `RENDER_EXTERNAL_URL`!).
6. Click **Apply** and wait ~3–5 minutes for the build and database setup to finish.
   - During `start:render`, Prisma pushes the PostgreSQL schema (`schema.postgres.prisma`), and on first boot `ensureInitialSeed()` seeds the starter Web3 projects and pre-funded campaigns automatically.
7. Once Render shows **Live**, copy your public HTTPS URL from the top of the Render service page (for example: `https://nexeraquest.onrender.com`).
8. **Update `WEB_APP_URL` in Render**: Go to your Render service -> **Environment** -> set `WEB_APP_URL` to your exact `https://nexeraquest.onrender.com` URL and click **Save Changes** (this restarts the service with the exact public URL for your bot buttons).

---

## Phase 4: Wire Your Live Render URL Back into `@BotFather`

Now tell Telegram where your hosted Mini App and Login Widget live:

1. **Set the Mini App Menu Button** (gives users a permanent "Launch App" button next to the chat box):
   - In `@BotFather`, send `/setmenubutton`.
   - Select your bot.
   - Send your Render HTTPS URL: `https://nexeraquest.onrender.com`
   - Send the button title: `Open NexeraQuest`

2. **Register Mini App Short Name (Optional Direct Link `t.me/YourBot/app`)**:
   - In `@BotFather`, send `/newapp`.
   - Select your bot, enter title `NexeraQuest`, short description, upload a 640×360 icon/image, and paste your Render URL `https://nexeraquest.onrender.com`.
   - Choose a short name like `app`. Now `https://t.me/<YourBot>/app` launches your Mini App directly.

3. **Enable Browser "Sign in with Telegram" Login Widget**:
   - In `@BotFather`, send `/setdomain`.
   - Select your bot.
   - Send your Render URL domain: `https://nexeraquest.onrender.com`

---

## Phase 5: Verify Everything Live

1. **Test Inside Telegram:**
   - Open your bot in Telegram and tap **Start** (`/start`) or tap the **Open NexeraQuest** menu button.
   - Verify your **real Telegram username** automatically logs in (`Mini App` badge inside the account dropdown) with a fresh `$0.00` balance and `50/100` Trust Score.
   - Complete the *Join TonVerse Official Telegram Channel* quest and watch your live balance update!
2. **Test in a Normal Web Browser:**
   - Open `https://nexeraquest.onrender.com` in Chrome or Safari.
   - Click the top-right account menu -> **Sign in with Telegram** -> approve the Telegram login prompt -> verify your real Telegram session persists across reloads!
   - Or stay in **Hybrid Demo** mode to toggle between `@alex_web3`, `Project Portal`, and `Admin Ops` quickly.

> **Important Note About Render Free Tier:**
> Render's free web services sleep after ~15 minutes of inactivity and take ~30–50 seconds to wake up on the next request. Your PostgreSQL database data remains intact while the web service sleeps (note Render's free PostgreSQL tier expires after 30 days unless upgraded to Starter).
