# NexeraQuest REST API Specification (v1)

Base URL: `/api/v1`

## 1. Authentication Endpoints
- `POST /api/v1/auth/telegram`: Authenticates Telegram WebApp `initData`. Returns JWT session token and user profile.
- `POST /api/v1/auth/login`: Authenticates project owners and admins via email/password. Returns JWT session token.
- `GET /api/v1/auth/me`: Retrieves current user profile, role, balance, and permissions.

## 2. Campaign Endpoints
- `GET /api/v1/campaigns`: Public discovery feed with query parameters:
  - `category`: Filter by category (e.g., `Community`, `Testing`)
  - `search`: Keyword search in title/description
  - `minReward`: Minimum reward filter
  - `sort`: `highest_reward` | `newest` | `slots`
  - `status`: Filter by status (`LIVE`, `COMPLETED`, etc.)
- `GET /api/v1/campaigns/:id`: Detailed campaign view with task instructions, eligibility, and remaining budget.
- `POST /api/v1/campaigns`: Project creation of a new campaign.
- `POST /api/v1/campaigns/:id/fund`: Locks project escrow deposit and transitions campaign to `FUNDED`.
- `POST /api/v1/campaigns/:id/pause`: Pauses campaign (prevents new task instances).

## 3. Contributor & Task Endpoints
- `POST /api/v1/tasks/:id/start`: Contributor starts a quest task instance (sets status `IN_PROGRESS`).
- `POST /api/v1/tasks/:id/submit`: Submits proof (URL, text, or file upload) for task instance.
- `POST /api/v1/tasks/:id/verify`: Triggers verification adapter for task instance. If verified, executes transactional reward settlement.
- `GET /api/v1/tasks/my`: Retrieves all task instances for the authenticated contributor.

## 4. Wallet & Withdrawal Endpoints
- `GET /api/v1/wallet`: Retrieves available, pending, reserved, and paid balances.
- `GET /api/v1/wallet/transactions`: Retrieves double-entry ledger history for the authenticated user.
- `POST /api/v1/wallet/withdraw`: Requests withdrawal payout with destination address, network, amount, and idempotency key.

## 5. Admin & Operations Endpoints
- `GET /api/v1/admin/overview`: System-wide KPIs, alerts, and operational stats.
- `POST /api/v1/admin/campaigns/:id/review`: Approve, reject, or request changes on campaign with mandatory reason.
- `GET /api/v1/admin/fraud`: Fraud queue with risk scores, signals, and cases.
- `POST /api/v1/admin/fraud/:id/resolve`: Resolve fraud case (`CONFIRMED`, `DISMISSED`).
- `POST /api/v1/admin/withdrawals/:id/process`: Authorize and settle pending withdrawal.
- `POST /api/v1/admin/reconciliation/run`: Triggers full ledger reconciliation and returns discrepancy report.
- `GET /api/v1/admin/audit-logs`: Chronological audit logs of all operator actions.
- `GET /api/v1/admin/settings`: View and update pricing rules, feature flags, and system settings.
