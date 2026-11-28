# NexeraQuest — Step-by-Step Auto-Ping & Uptime Monitoring Guide

This guide walks you through every preparation check and click-by-click setup step to monitor **NexeraQuest** on **Render** and keep your Telegram Mini App responsive by pinging a Health Check URI every **5 minutes**.

---

## Before You Start: How Auto-Ping Works (Quick Context)

When hosting on **Render's Free Plan** ([render.yaml](file:///d:/Anitgravity%20Dapp/render.yaml)):
1. Render puts your web service to sleep after **15 minutes without external HTTP traffic**.
2. Once asleep, the next user who opens your Telegram Mini App waits **30–50+ seconds** for a "cold start".
3. **Why an internal timer on the server won't keep it awake:** A `setInterval()` inside Node.js gets suspended when the container sleeps and does not count as incoming external traffic at Render's router.
4. **Why there are two monitoring options in NexeraQuest:**
   - **Built-in Monitor Page (`/monitor` and `Admin Ops -> Monitor`):** Automatically pings `/api/health` every **5 minutes** *while your browser tab stays open* and shows live latency, database health, and uptime.
   - **External Uptime Monitor (UptimeRobot or cron-job.org):** Sends a real external HTTP request to your `/health` (or `/api/health`) URI every **5 minutes 24/7**, even when your computer and browser are closed.

> [!IMPORTANT]
> **Render Free Tier 750-Hour Monthly Pool:**
> Render grants **750 free instance hours per month** per workspace. One month is ~720–744 hours, so keeping **1** free web service awake 24/7 fits inside the 750-hour allowance. If you run **multiple** free web services in the same Render account, keeping all of them awake 24/7 will exhaust the 750-hour pool before month-end—either monitor only your primary production app or limit pings to active daytime hours (Option C below). Also note Render's free PostgreSQL tier expires after **30 days** unless upgraded to Starter.

---

## Phase 1: Preparation & Pre-Flight Checks

Complete these checks before creating an account on an external monitoring platform:

### 1. Find Your Exact Live Render URL
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Open your **`nexeraquest`** web service.
3. Verify the latest deploy status says **Live**.
4. Copy the public **`https://...onrender.com`** URL shown near the top-left of the service header (for example: `https://nexeraquest.onrender.com`).

> [!WARNING]
> - Always use **`https://`** (never `http://` or `http://localhost:5173`).
> - **Never** monitor `/robots.txt` on Render—Render serves/intercepts `robots.txt` at its edge router when a service is sleeping, so it will **not** wake up your Node server. Always use `/health`, `/healthz`, or `/api/health`.

### 2. Choose `/health` vs. `/api/health`
Both endpoints run the exact same database check (`SELECT 1`), support both **`GET`** and **`HEAD`** HTTP methods, and return `Cache-Control: no-store, no-cache, must-revalidate` so proxies never serve stale cached responses:

| Health Check URI | Behavior & Logging | Best Use Case |
| :--- | :--- | :--- |
| **`https://<your-app>.onrender.com/health`** | Checks DB, returns JSON (`GET`) or empty `200` (`HEAD`). Does **not** print request lines to Render logs every 5 min. | **Recommended for UptimeRobot / 24/7 pings** (keeps Render logs clean while keeping the app awake). |
| **`https://<your-app>.onrender.com/api/health`** | Exact same DB health check **plus** logs `[GET] /api/health - 200 (Xms)` to Render's stdout logs (`NODE_ENV !== 'test'`). | Great for **cron-job.org / debugging** when you want to see every ping inside Render **Logs**. |
| **`https://<your-app>.onrender.com/healthz`** | Same behavior as `/health`. | Alternative Kubernetes-style probe path. |

### 3. Test Your Health Check URI in a Browser First
Before configuring any external tool, wake the server once yourself:
1. Open Chrome/Safari and visit:
   `https://<your-app>.onrender.com/health`
2. If the free server was sleeping, wait ~30–50 seconds for the initial wake-up.
3. Confirm your browser renders JSON similar to:
   ```json
   {
     "status": "ok",
     "service": "nexeraquest",
     "database": "connected",
     "dbLatencyMs": 2,
     "uptimeSeconds": 145,
     "telegramBot": "live",
     "timestamp": "2026-11-28T11:30:00.000Z"
   }
   ```
   - Make sure `"status"` is `"ok"` and `"database"` is `"connected"` (and `"telegramBot"` is `"live"` on Render if you set `TELEGRAM_BOT_TOKEN`).
   - If you get **`404`** or HTML instead of JSON, make sure your latest commits with `/api/health` and `/monitor` are deployed on Render first.

---

## Phase 2: Option A — Built-In Browser Monitor (`/monitor`)

Use this when you want instant live health telemetry or want a quick temporary keep-alive while actively testing from your laptop.

1. Open either:
   - Standalone URL: `https://<your-app>.onrender.com/monitor`
   - Or inside the app: Top navigation bar -> **`Admin Ops`** (mobile: **`Admin`**) -> **`Monitor`** tab.
2. Inspect the 4 status tiles:
   - **Service:** Should display **`Online`** and **`HTTP 200 · XXms`**.
   - **Database:** Should display **`Connected`** and query latency in milliseconds.
   - **Process Uptime:** Shows how long the Node server process has been continuously awake (if this drops back to a few seconds, Render restarted or woke from sleep). Also shows `Bot: live` or `mock`.
   - **5-Min Loop:** Starts **`Active`** automatically with a live `05:00` countdown timer.
3. Click **`Ping Now`** anytime to run an immediate manual health check and verify a new `Manual | 200` row appears under **Recent Health Checks**.
4. Use the **`Active` / `Paused`** toggle pill on the **5-Min Loop** tile to pause or resume in-browser pings.
5. Under **Public Health Check URIs**, click **`Copy URI`** next to `/health` or `/api/health` to copy the exact URL for Phase 3 or Phase 4 below.
6. When finished on the standalone `/monitor` page, click **`Back to App`** (or any navbar tab) to return to the Mini App.

> [!NOTE]
> The built-in `/monitor` tab runs inside your browser session—if you close the browser tab or put your computer to sleep, its 5-minute pings stop. Use **Option B** or **Option C** below for 24/7 automated pinging.

---

## Phase 3: Option B — Set Up 24/7 Auto-Ping with UptimeRobot (Recommended)

**UptimeRobot** offers a free tier with **5-minute HTTP monitoring** and automatic downtime email alerts.

### Step 1: Create Your UptimeRobot Account
1. Open [uptimerobot.com](https://uptimerobot.com/) and click **Register for Free** (or **Log in** if you already have an account).
2. Confirm your email address and log in to your **UptimeRobot Dashboard**.

### Step 2: Open the New Monitor Form
1. On the top-left or center of your UptimeRobot Dashboard, click **"+ Add New Monitor"**.

### Step 3: Fill Out Every Field Exactly
Configure the monitor form as follows:
1. **Monitor Type:** Select **`HTTP(s)`** from the dropdown.
2. **Friendly Name:** Enter `NexeraQuest Health`.
3. **URL (or IP):** Paste your exact Render health URI copied from `/monitor`:
   ```text
   https://<your-app>.onrender.com/health
   ```
   *(Replace `<your-app>` with your actual Render subdomain.)*
4. **Monitoring Interval:** Set the slider or dropdown to **`5 minutes`** (the minimum free interval—this hits the server 3 times before Render's 15-minute sleep threshold).
5. **Alert Contacts to Notify:** Check the box next to your registered **email address** so UptimeRobot emails you immediately if your app or Postgres database goes down (`503`).
6. *(Optional)* **Advanced Settings / Keyword Monitoring:**
   - Leave HTTP method as default (`HEAD` or `GET`; our `/health` route handles both cleanly).
   - If you also want UptimeRobot to alert specifically when the database disconnects even if Node is running, switch to **`Monitor Type: Keyword`** on URL `https://<your-app>.onrender.com/health` (`GET`), set **Keyword** to `connected`, and **Alert When:** **`Keyword Does Not Exist`**.

### Step 4: Save & Verify First Check
1. Click **"Create Monitor"** at the bottom of the panel.
2. Wait ~1–2 minutes and refresh your UptimeRobot Dashboard:
   - Confirm the monitor status turns green (**`UP`**).
   - Click into `NexeraQuest Health` to inspect the **Response Time** chart and event logs.

---

## Phase 4: Option C — Set Up Auto-Ping with cron-job.org (Flexible Schedules)

Use **cron-job.org** if you want explicit cron schedules (such as **`*/5 * * * *`** 24/7, or pausing overnight to conserve Render's 750 free hours across multiple projects) or want full HTTP execution logs.

### Step 1: Sign Up & Open Console
1. Open [console.cron-job.org](https://console.cron-job.org/) and click **Sign up** (or **Log in**).
2. Verify your account email if prompted and enter the dashboard.

### Step 2: Create the Cronjob
1. In the left navigation menu, click **Cronjobs**.
2. Click **Create cronjob** (or **+ Create cronjob**).

### Step 3: Enter Target & Schedule Settings
1. **Title:** Enter `NexeraQuest 5m Ping`.
2. **URL:** Paste your Render health endpoint:
   ```text
   https://<your-app>.onrender.com/api/health
   ```
   *(Using `/api/health` causes Render Logs to print `[GET] /api/health - 200` on every ping; use `/health` if you prefer silent logs.)*
3. **Enable job:** Ensure the toggle is **ON**.
4. **Execution schedule:**
   - Select **Every 5 minutes** from the quick interval presets, **OR** choose **Custom** -> set **Minutes** to `*/5` (cron expression: `*/5 * * * *`).
   - *(Optional multi-app conservation)* To save Render instance hours, restrict **Hours** to e.g. `8-23` instead of `*` so your app only stays warm during daytime hours.
5. **Notifications:** Enable notification alerts when execution fails (e.g., if the backend returns `503` or times out).
6. **Advanced tab (Verify Request Settings):**
   - **Request method:** Select **`GET`** (or **`HEAD`**).
   - **Request timeout:** Keep at max allowed (30s).

### Step 4: Save & Run a Manual Test
1. Click **Create** at the bottom of the form.
2. In your **Cronjobs** list, find `NexeraQuest 5m Ping` and click **Test Run** (or edit -> **Test run**).
3. Wait a few seconds and check the result:
   - **Expected Result:** **`200 OK`** with fast response time (`<1000ms` once warm).
   - Check your Render **Logs** tab if using `/api/health` to verify `[GET] /api/health - 200` appeared.

---

## Phase 5: End-to-End Verification Checklist

Confirm everything is working smoothly with these 4 quick checks:

1. **Wait 20 Minutes & Check Uptime:**
   - Open `https://<your-app>.onrender.com/monitor`.
   - Look at the **Process Uptime** tile—it should read **`20m+`** (and keep rising over hours/days) rather than resetting to `10s`.
2. **Instant Telegram Mini App Load:**
   - Wait 20+ minutes without touching your bot, then open Telegram and tap **Open NexeraQuest**.
   - The app should load immediately in ~1–2 seconds with zero 30–50 second cold-start spinner.
3. **Monitor Dashboard Green:**
   - Your UptimeRobot or cron-job.org dashboard shows **`UP` / `200 OK`** across consecutive 5-minute intervals.

---

## Phase 6: Troubleshooting Common Issues

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| **Test Run on `cron-job.org` times out on first click (30s limit)** | Your Render free service was sleeping and took >30s to cold-boot Node + Prisma. | Open `https://<your-app>.onrender.com/health` in your browser once so Render finishes waking up, then click **Test Run** again. Once warm, 5-minute pings respond in milliseconds and won't time out. |
| **Endpoint returns `503 Unhealthy` (`database: disconnected`)** | PostgreSQL connection dropped, `DATABASE_URL` missing, or Render's 30-day free Postgres DB expired. | Open Render Dashboard -> inspect **`nexeraquest-db`** status & Logs. |
| **Render still sleeps after 15 minutes** | Pinging `localhost`, pinging `/robots.txt`, monitor was paused, or UptimeRobot URL has a typo. | Copy the exact URL from `/monitor` (`https://.../health`), confirm no trailing spaces, and ensure your monitor shows **Active / Running**. |
| **Render suspends services before month-end** | More than one free web service in your Render workspace was kept alive 24/7, exceeding **750 free hours/month**. | Keep 24/7 pings enabled on only **one** free Render web service per workspace, or pause external monitors on unused/test deployments. |
| **External monitor gets `404` JSON/HTML** | Your Render service is running an older commit prior to `/api/health` & `/monitor`. | Run `git add -A && git commit -m "..." && git push` and wait for Render deploy to finish **Live**. |

---

## Related Docs
- [RENDER_DEPLOY_GUIDE.md](file:///d:/Anitgravity%20Dapp/docs/RENDER_DEPLOY_GUIDE.md) — BotFather setup, Render Blueprint deployment, and `WEB_APP_URL` wiring.
- [ARCHITECTURE.md](file:///d:/Anitgravity%20Dapp/docs/ARCHITECTURE.md) — Core backend, ledger invariants, and Mini App architecture.
