# NexeraQuest Financial Ledger Architecture

## 1. Principles of Financial Safety
NexeraQuest treats every satoshi and micro-USDT as an immutable liability or asset. The system adheres to strict double-entry principles:
1. **Never Calculate Balances on the Client:** The client displays balances retrieved from authenticated server queries.
2. **Transactional Consistency:** Every balance mutation executes within an atomic database transaction (`$transaction`). If any step fails, the entire transaction rolls back.
3. **Strict Idempotency:** Every financial operation requires an `idempotencyKey`. Replaying the same request produces the existing result with zero additional balance changes.
4. **Separation of Balances:**
   - **Contributor:** `availableBalance` (withdrawable), `pendingBalance` (in cashout processing), `paidBalance` (completed cashouts).
   - **Project Escrow:** `reservedBalance` (locked for campaign claims), `paidBalance` (distributed to contributors).
   - **Platform:** `availableBalance` (collected platform fee revenue).

## 2. Double-Entry Flow Examples

### A. Campaign Escrow Funding
```text
DEBIT:  Project Funding Source (External Payment / Deposit)
CREDIT: Project Escrow Account (reservedBalance += RewardPool)
CREDIT: Platform Fee Account   (availableBalance += FeeAmount)
LEDGER: Entry [Type: ESCROW_LOCK, Amount: RewardPool]
LEDGER: Entry [Type: FEE_COLLECTION, Amount: FeeAmount]
```

### B. Task Reward Settlement
```text
DEBIT:  Project Escrow Account (reservedBalance -= RewardAmount, paidBalance += RewardAmount)
CREDIT: Contributor Account    (availableBalance += RewardAmount)
UPDATE: Campaign (lockedBudget -= RewardAmount, earnedBudget += RewardAmount)
UPDATE: TaskInstance (rewardClaimed = true, status = APPROVED)
LEDGER: Entry [Type: REWARD_CREDIT, Source: Escrow, Dest: Contributor, Amount: RewardAmount]
```

### C. Contributor Cashout Request
```text
UPDATE: Contributor Account (availableBalance -= Amount, pendingBalance += Amount)
CREATE: Withdrawal [Status: PENDING_AUTHORIZATION / RISK_CHECK]
LEDGER: Entry [Type: WITHDRAWAL_REQUEST, Amount: Amount]
```

### D. Cashout Payout Authorization
```text
UPDATE: Contributor Account (pendingBalance -= Amount, paidBalance += Amount)
UPDATE: Withdrawal [Status: PAID, txHash: 0x...]
LEDGER: Entry [Type: WITHDRAWAL_PAYOUT, Amount: Amount]
```

## 3. Scheduled Reconciliation
The reconciliation engine runs continuously:
$$\sum \text{Ledger Incoming} - \sum \text{Ledger Outgoing} = \text{Available} + \text{Pending}$$
Any deviation triggers an immediate alert and creates a `ReconciliationRun` record with status `DISCREPANCY_DETECTED`.
