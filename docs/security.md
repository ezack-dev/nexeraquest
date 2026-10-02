# NexeraQuest Security & Authorization Specification

## 1. Authentication Security
- **Telegram Mini App Server-Side Validation:**
  - Clients provide `window.Telegram.WebApp.initData`.
  - The server verifies the HMAC-SHA256 signature using `HMAC_SHA256("WebAppData", botToken)` as the cryptographic key.
  - Replay attacks are mitigated by validating that `auth_date` is strictly within 86,400 seconds (24 hours).
  - Unverified client headers or spoofed IDs are rejected with `401 Unauthorized`.
- **Operator Authentication:**
  - Secure email/password with Argon2/Bcrypt and JWT tokens.
  - Sessions are strictly scoped and validated on every sensitive route.

## 2. Granular Role-Based Access Control (RBAC)
Roles are strictly segregated:
- `CONTRIBUTOR`: Can only read their own wallet, task instances, profile, and submit proofs.
- `PROJECT_OPERATOR`: Can view and draft campaigns for their specific project.
- `PROJECT_OWNER`: Can fund campaigns, view participant lists, export participant CSVs, and request refunds.
- `FINANCE_ADMIN`: Can authorize payouts, review the ledger, and execute reconciliation.
- `RISK_ADMIN`: Can inspect fraud cases, freeze/unfreeze accounts, and resolve disputes.
- `SUPER_ADMIN`: Full administrative control across system settings, pricing rules, and feature flags.

## 3. Financial & Operational Invariants
- **No Client-Calculated Balances:** All calculations run in transactional backend blocks.
- **Idempotency Keys:** Mandatory on all financial endpoints (`idempotencyKey`).
- **No Seed Phrase / Private Key Collection:** Contributors only provide public payout addresses.
- **Zero Raw Secrets in Frontend:** All API keys and bot tokens remain server-side.
- **Full Audit Logging:** All mutations record `actorId`, `actorRole`, `action`, `previousState`, and `newState`.
