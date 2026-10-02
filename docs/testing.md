# NexeraQuest Testing Strategy

## 1. Testing Philosophy
NexeraQuest prioritizes financial correctness, state machine invariants, and tamper-proof security over superficial test counts.

### Critical Verification Invariants:
1. **Concurrency & Double-Pay Prevention:**
   - 10 concurrent requests to claim a reward on the same task instance must result in exactly 1 successful ledger entry and 9 idempotent responses.
2. **State Machine Integrity:**
   - Tasks cannot transition from `APPROVED` back to `IN_PROGRESS`.
   - Campaigns cannot transition to `LIVE` unless escrow funding is confirmed.
3. **Double-Entry Ledger Balancing:**
   - The sum of account balances must equal the sum of unspent ledger credits.
4. **Cryptographic Telegram Signature Validation:**
   - Invalid HMAC signatures, altered parameters, or expired auth dates (>24h) must be rejected.
5. **Configurable Fee Rules:**
   - Economics must match the formula dynamically specified by the active pricing rule.

## 2. Test Execution
```bash
# Run unit and integration test suite
npm test

# Run ledger concurrency tests
npm run test tests/ledger.test.ts

# Run state machine tests
npm run test tests/state-machine.test.ts
```
