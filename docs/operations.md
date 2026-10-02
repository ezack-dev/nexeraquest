# NexeraQuest Operations & Disaster Recovery Guide

## 1. Routine Operational Procedures

### A. Campaign Approval Workflow
1. Navigate to `/admin/campaigns`.
2. Inspect the project verification status, campaign task instructions, economics, and verification adapter.
3. If valid, click **Approve Campaign**. This updates status to `LIVE` (or `SCHEDULED` if future date set) and logs an audit record.
4. If invalid, specify reason and click **Reject** or **Request Changes**.

### B. Fraud Investigation & Dispute Resolution
1. Check `/admin/fraud` for flagged contributors.
2. Review signals (velocity spikes, proof collisions, referral loops).
3. Operators can click **Freeze Contributor** to suspend cashouts, or **Dismiss** for false positives.
4. On `/admin/disputes`, review original proof screenshot, automated verification log, and user claim. Resolve with **Upheld Rejection** or **Overturned & Approved**.

### C. Cashout Batch Authorizations
1. Navigate to `/admin/withdrawals`.
2. Review pending requests.
3. Click **Authorize Payout**. The ledger registers a `WITHDRAWAL_PAYOUT` event and updates balances.

### D. Financial Reconciliation Run
1. Navigate to `/admin/reconciliation`.
2. Click **Run Reconciliation**.
3. The engine verifies every balance account against double-entry journal logs and generates an immutable report.

## 2. Disaster Recovery Runbook
- **Database Failure:** Restore from daily automated WAL backup. Re-run `LedgerEngine.runReconciliation()` to confirm zero balance anomalies.
- **Telegram Outage:** The system marks verification checks as `UNAVAILABLE` with automatic retries; contributors can safely re-enter once Telegram services restore.
- **Worker Crash:** All workers are stateless and idempotent. Restarting workers safely picks up queued tasks without duplicate processing.
