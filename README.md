# NexeraQuest

**QUEST. CONTRIBUTE. EARN.**

A Telegram-native campaign marketplace for Web3 projects and contributors, featuring 100% pre-funded reward escrows, verified task outcomes, anti-fraud controls, and an immutable double-entry accounting ledger.

---

## 🌟 Architecture Overview

NexeraQuest is architected across three core marketplace surfaces:

```
                              ┌───────────────────────────────────────────────┐
                              │                 TELEGRAM ECOSYSTEM            │
                              │  - Telegram Bot API (commands & notifications)│
                              │  - Telegram Mini App (TMA WebApp viewport)    │
                              │  - Telegram Channel / Group Membership checks │
                              └───────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       │                                                             │
                       ▼                                                             ▼
         ┌───────────────────────────┐                                 ┌───────────────────────────┐
         │ Contributor Mini App      │                                 │ Project & Admin Portal    │
         │ - React 18 + Vite         │                                 │ - Campaign Creator        │
         │ - Tailwind CSS UI         │                                 │ - Real-time Telemetry     │
         │ - Telegram WebApp SDK     │                                 │ - Participant CSV Export  │
         │ - Mobile-First Haptics    │                                 │ - Admin Approval & Fraud  │
         └─────────────┬─────────────┘                                 └─────────────┬─────────────┘
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │ HTTPS / REST API
                                                      ▼
                       ┌─────────────────────────────────────────────────────────────┐
                       │               NEXERAQUEST BACKEND CORE API                  │
                       │  - Auth Service (Telegram HMAC-SHA256 & Session Tokens)     │
                       │  - Campaign Engine (State machine & escrow locks)           │
                       │  - Task & Proof Verification Engine                         │
                       │  - Double-Entry Financial Ledger Service                    │
                       │  - Anti-Fraud & Contributor Trust Engine                    │
                       │  - Telegram Bot Service (grammY dispatcher)                 │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │
                                                      ▼
                       ┌─────────────────────────────────────────────────────────────┐
                       │                       DATA PERSISTENCE                      │
                       │  - Relational Database (Prisma ORM / SQLite / PostgreSQL)   │
                       │  - Immutable Double-Entry Ledger                            │
                       └─────────────────────────────────────────────────────────────┘
```

1. **Contributor Mini App (`/` or `/app`):**
   - Zero-friction onboarding via Telegram `initData` (HMAC-SHA256 authenticated).
   - Campaign discovery with category filters (`Community`, `Social`, `Growth`, `Testing`, `Creative`).
   - Task execution modal with automatic Telegram channel verification or link/text proof submissions.
   - Non-custodial cash-out to TON or EVM wallets (deferred wallet setup until cash-out).
   - Dynamic Contributor Trust Score (0–100) and referral system.

2. **Web3 Project Portal (`/portal`):**
   - Self-serve campaign builder with automated 20% platform fee calculation (`Total Deposit = Reward Pool × 1.20`).
   - 100% pre-funded reward escrow locking before public launch.
   - Live telemetry: slots filled, budget spent, remaining escrow.
   - One-click verified participant CSV / JSON export.
   - Campaign closure with automatic refund of unclaimed reward slots.

3. **Operations & Admin Console (`/admin`):**
   - Proof review queue (approve rewards or reject with reason).
   - Withdrawal batch authorization queue (payout approval with on-chain tx hash).
   - Fraud heuristics and anti-bot queue (velocity limits, duplicate proof signatures, account freezing).
   - Live platform solvency audit reconciling deposits, escrow liability, earned rewards, and revenue.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database & Seed Initial Campaigns
```bash
# Push Prisma schema and seed projects, campaigns, and contributors
npm --prefix packages/backend run prisma:push
npm run seed
```

### 4. Run End-to-End Economic Verification Test
```bash
npx tsx packages/backend/src/test_flow.ts
```

### 5. Launch Development Servers
```bash
# Terminal 1: Backend API (Port 4000)
npm run dev:backend

# Terminal 2: Web Client & Mini App (Port 5173)
npm run dev:client
```

Open `http://localhost:5173` in your browser. Use the top navigation bar to toggle between:
- **Mini App**: Contributor experience inside the Telegram viewport.
- **Project Portal**: Web3 sponsor dashboard to launch campaigns and export participant data.
- **Admin Ops**: Platform admin console to authorize payouts, review proofs, and audit the financial ledger.

---

## 📊 Economic & Ledger Model

NexeraQuest enforces strict double-entry accounting invariants:

- **Escrow Invariant:** `Total Deposit = Reward Pool + (Reward Pool × 0.20)`
- **Task Settlement:** Exactly one reward credit per task instance. Duplicate credits are cryptographically and idempotently blocked.
- **Withdrawal Movement:** `Available Balance -> Pending Balance -> Withdrawn / Settled`.
- **Closure Refund:** When a project closes a campaign with uncompleted slots:
  `Refund = (Target Slots - Completed Slots) × Reward Per Action`
- **Zero-Sum Solvency:** `Total Deposits == Escrow Liability + Earned Rewards + Settled Payouts + Unclaimed Refunds`.

---

## 📁 Repository Structure

```
d:/Anitgravity Dapp/
├── PRD.md                             # Canonical Product Requirements Document
├── docs/
│   └── ARCHITECTURE.md                # System Architecture & Technical Specifications
├── packages/
│   ├── backend/                       # Express + Prisma API & Services
│   │   ├── prisma/
│   │   │   └── schema.prisma          # Database schema (PostgreSQL / SQLite)
│   │   ├── src/
│   │   │   ├── index.ts               # Express entrypoint
│   │   │   ├── prisma.ts              # Database client singleton
│   │   │   ├── seed.ts                # Realistic Web3 project and campaign seed
│   │   │   ├── test_flow.ts           # 12-step E2E economic test suite
│   │   │   ├── routes/                # Auth, Campaigns, Tasks, Users, Admin
│   │   │   └── services/
│   │   │       ├── ledgerService.ts   # Double-entry financial accounting
│   │   │       ├── trustService.ts    # Trust scoring & anti-bot velocity engine
│   │   │       ├── verificationService.ts # Automatic & manual proof validation
│   │   │       └── telegramBot.ts     # grammY Telegram Bot dispatcher
│   │   └── package.json
│   └── client/                        # React 18 + Vite + Tailwind CSS Frontend
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── api.ts                 # Full API client
│       │   ├── types.ts               # Shared TypeScript interfaces
│       │   ├── context/AuthContext.tsx# Telegram WebApp SDK & Demo Auth
│       │   └── components/
│       │       ├── Navbar.tsx         # Surface switcher & contributor bar
│       │       ├── MiniApp/           # Contributor Telegram Mini App
│       │       ├── ProjectPortal/     # Web3 Sponsor Portal & Telemetry
│       │       └── AdminConsole/      # Operations & Ledger Solvency
│       └── package.json
└── package.json
```
