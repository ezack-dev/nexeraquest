# NexeraQuest Fraud & Sybil Defense System

## 1. Multi-Layer Risk Architecture
NexeraQuest combats Web3 botting, reward farming, and duplicate identity abuse using multi-layered heuristic signal analysis.

### Signals Monitored:
1. **Velocity Spike (`VELOCITY_SPIKE`):**
   - Flags accounts completing $>5$ tasks within 5 minutes or $>20$ tasks in an hour.
2. **Proof Reuse (`PROOF_REUSE`):**
   - Exact image hash collisions or identical text strings submitted by different contributors.
3. **Repeated Rejections (`REPEATED_FAILURES`):**
   - Accounts with $>60\%$ rejection rate on recent task verification attempts.
4. **Cyclic Referrals (`REFERRAL_LOOP`):**
   - User A invites User B who invites User A.
5. **Abnormal Withdrawal Patterns (`SUSPICIOUS_WITHDRAWAL`):**
   - Instant cashout of full balances immediately after bulk task completions.

## 2. Risk Scoring & Operational Actions
- **0 – 29: LOW Risk** $\implies$ Standard user experience, automated small withdrawals eligible.
- **30 – 59: MEDIUM Risk** $\implies$ Monitored in Fraud Queue, withdrawal requires background verification.
- **60 – 79: HIGH Risk** $\implies$ Auto-opens `FraudCase`, pauses withdrawals pending manual operator review.
- **80 – 100: CRITICAL Risk** $\implies$ Contributor account status automatically set to `SUSPENDED`.

## 3. Separation of Concerns
- Contributors and projects never see internal fraud weights or heuristics.
- Admins can investigate signals, inspect proof hashes, freeze accounts, dismiss false positives, or resolve cases with audit logs.
