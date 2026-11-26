# NexeraQuest Architecture & Technical Specification

## 1. System Overview

NexeraQuest is a Telegram-native campaign marketplace connecting Web3 projects with verified human contributors.
The platform provides guaranteed reward settlements via pre-funded campaign escrows and a transparent double-entry accounting ledger.

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
                       │  - Relational Database (Prisma ORM / PostgreSQL / SQLite)   │
                       │  - Immutable Double-Entry Ledger                            │
                       └─────────────────────────────────────────────────────────────┘
```

---

## 2. Double-Entry Accounting Model

Every currency movement in NexeraQuest is recorded as an immutable `LedgerEntry`. The system maintains a zero-sum balance sheet across platform accounts:

### Account Types
- `PROJECT_ESCROW_<campaign_id>`: Holds pre-funded reward pool for a specific campaign.
- `PLATFORM_REVENUE`: Holds platform verification fees (20% fee).
- `CONTRIBUTOR_AVAILABLE_<user_id>`: Contributor's liquid balance ready for withdrawal.
- `CONTRIBUTOR_PENDING_<user_id>`: Balance locked during an active withdrawal request.
- `PAYOUT_SETTLED_<user_id>`: Cumulative settled crypto payments to external wallets.

### Lifecycle Invariants

1. **Campaign Creation & Funding**:
   - `RewardPool = targetSlots * rewardPerAction`
   - `PlatformFee = RewardPool * 0.20` (Canonical 20% platform markup)
   - `TotalDeposit = RewardPool + PlatformFee`
   - Ledger:
     - `DEBIT` Project External Deposit -> `CREDIT` `PROJECT_ESCROW_<campaign_id>` (`RewardPool`)
     - `DEBIT` Project External Deposit -> `CREDIT` `PLATFORM_REVENUE` (`PlatformFee`)

2. **Task Verification & Reward Settlement**:
   - Contributor completes task; verification passes.
   - Exactly one reward credit occurs (idempotent key: `task_instance_<id>`).
   - Ledger:
     - `DEBIT` `PROJECT_ESCROW_<campaign_id>` (`rewardPerAction`)
     - `CREDIT` `CONTRIBUTOR_AVAILABLE_<user_id>` (`rewardPerAction`)
   - `Campaign.completedSlots` increments.

3. **Withdrawal Request**:
   - Contributor requests payout of `$X` to their TON/USDT wallet.
   - Ledger:
     - `DEBIT` `CONTRIBUTOR_AVAILABLE_<user_id>` (`$X`)
     - `CREDIT` `CONTRIBUTOR_PENDING_<user_id>` (`$X`)

4. **Withdrawal Approval & On-Chain Payout**:
   - Admin approves batch and submits crypto transaction.
   - Ledger:
     - `DEBIT` `CONTRIBUTOR_PENDING_<user_id>` (`$X`)
     - `CREDIT` `PAYOUT_SETTLED_<user_id>` (`$X`)
   - Recorded with on-chain transaction hash (`txHash`).

5. **Campaign Closure & Unclaimed Slot Refund**:
   - `UnclaimedSlots = targetSlots - completedSlots`
   - `RefundAmount = UnclaimedSlots * rewardPerAction`
   - Ledger:
     - `DEBIT` `PROJECT_ESCROW_<campaign_id>` (`RefundAmount`)
     - `CREDIT` Project Wallet / Refund Account (`RefundAmount`)

---

## 3. Trust Score & Anti-Fraud Engine

### Trust Score Formula
The Trust Score is normalized on a scale of `0` to `100`:
- **New Account Baseline**: `50`
- **Successful Quest Verification**: `+2` points (Max: 100)
- **Valid Referral Qualified**: `+3` points
- **Manual Proof Rejected (Incomplete / Low Quality)**: `-10` points
- **Fraudulent / Forged Proof Detected**: `-30` points
- **Account Freeze Trigger**: If Trust Score drops below `20` or active critical fraud flag exists.

### Anti-Bot Heuristics
1. **Telegram Account Age & Metadata**: Minimum account age signals; missing username flags.
2. **Velocity Checks**: Rate limit to max 5 quest starts in 10 minutes.
3. **Cyclic Referrals**: Graph traversal detects user A referring user B who refers user A.
4. **Duplicate Submission Signatures**: Hashing screenshot/text payloads to prevent identical proof re-use across multiple accounts.

---

## 4. API Endpoints

### Contributor Endpoints
- `POST /api/auth/telegram`: Authenticates Telegram WebApp `initData` using bot token HMAC-SHA256.
- `GET /api/campaigns`: Public list of active, funded campaigns (filterable by category, reward).
- `GET /api/campaigns/:id`: Campaign details, task requirements, remaining slots.
- `POST /api/campaigns/:id/start`: Initiates a `TaskInstance` for contributor.
- `POST /api/tasks/:id/verify`: Submits proof (automatic check or payload submission).
- `GET /api/user/profile`: Contributor profile, Trust Score, quest stats, referral link.
- `GET /api/user/balance`: Liquid, pending, and earned balances with ledger history.
- `POST /api/user/withdraw`: Submits withdrawal request with destination crypto address.

### Project Endpoints
- `POST /api/projects/register`: Onboards a Web3 project sponsor.
- `POST /api/projects/:id/campaigns`: Creates campaign and calculates escrow requirements.
- `POST /api/projects/campaigns/:id/fund`: Simulates/records escrow deposit and submits for review.
- `GET /api/projects/:id/campaigns`: Lists project campaigns with live telemetry.
- `GET /api/projects/campaigns/:id/telemetry`: Real-time stats (verified, spent, remaining).
- `GET /api/projects/campaigns/:id/export`: Exports verified participants (Telegram handles, timestamps, proofs).
- `POST /api/projects/campaigns/:id/close`: Closes campaign and calculates unclaimed refund.

### Admin Endpoints
- `GET /api/admin/campaigns/pending`: Review queue for unapproved campaigns.
- `POST /api/admin/campaigns/:id/decision`: Approve or reject campaign with reasoning.
- `GET /api/admin/proofs/pending`: Review queue for manual proofs.
- `POST /api/admin/proofs/:id/decision`: Approve or reject proof submission.
- `GET /api/admin/fraud/cases`: View flagged accounts and suspicious patterns.
- `POST /api/admin/fraud/resolve`: Ban, freeze, or clear flagged accounts.
- `GET /api/admin/ledger/audit`: Reconciles total deposits, escrow liability, earned rewards, and fees.
- `GET /api/admin/withdrawals/pending`: Pending withdrawal requests.
- `POST /api/admin/withdrawals/authorize`: Approves batch payouts and records tx hash.
