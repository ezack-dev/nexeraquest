# NexeraQuest Database Schema Specification

## 1. Relational Model & Entities
NexeraQuest enforces strict relational integrity with foreign keys, unique constraints, and indexes across 25+ domain tables:

| Entity | Purpose | Key Constraints |
|---|---|---|
| `User` | Platform identity (Contributor, Project Owner, Admin) | `telegramId` UNIQUE, `email` UNIQUE |
| `Project` | Web3 projects launching campaigns | `slug` UNIQUE |
| `ProjectMember` | Role-based project team memberships | UNIQUE(`projectId`, `userId`) |
| `Campaign` | Bounty/quest campaign specifications | `slug` UNIQUE, FK to `Project` |
| `CampaignTask` | Concrete action required (e.g. Join Channel) | FK to `Campaign` |
| `TaskInstance` | Contributor execution attempt of a task | UNIQUE(`campaignTaskId`, `userId`) |
| `Proof` | Structured proof submitted by contributor | UNIQUE(`taskInstanceId`) |
| `VerificationAttempt` | Record of verification execution | FK to `TaskInstance` |
| `VerificationResult` | Result payload and confidence score | FK to `VerificationAttempt` |
| `BalanceAccount` | Accounting balances for contributors & projects | UNIQUE(`userId`, `accountType`, `currency`) |
| `LedgerEntry` | Immutable financial journal entry | `idempotencyKey` UNIQUE, indexed |
| `Withdrawal` | Contributor cashout request | `idempotencyKey` UNIQUE, FK to `BalanceAccount` |
| `TrustEvent` | Historical score changes with audit reasons | FK to `User` |
| `FraudCase` | Suspected sybil or abnormal activity cases | FK to `User` |
| `FraudSignal` | Granular signals attached to a fraud case | FK to `FraudCase` |
| `Dispute` | Contributor appeals on rejected tasks | FK to `TaskInstance` |
| `Referral` | Contributor referral graph attribution | `refereeId` UNIQUE, FK to `User` |
| `Notification` | System and Telegram bot push messages | FK to `User` |
| `AuditEvent` | Immutable security log of sensitive mutations | Indexed on `actorId`, `entityType` |
| `CampaignFunding` | Recorded deposits into campaign escrow | FK to `Campaign` |
| `CampaignSettlement` | Final accounting settlement for closed campaigns | FK to `Campaign` |
| `Refund` | Reclaimed unused escrow funds | FK to `Campaign` |
| `PricingRule` | Configurable platform fee calculation | Configurable fee % and floor |
| `SystemSetting` | Key-value system configurations | `key` UNIQUE |
| `FeatureFlag` | Operational toggle switches | `key` UNIQUE |
| `ReconciliationRun` | Audited financial reconciliation runs | Timestamped reports |

## 2. Relational Invariants
- A contributor cannot have multiple active instances for the same task (`campaignTaskId_userId` unique constraint).
- A reward cannot be credited twice for the same task (`rewardClaimed` flag and `idempotencyKey` on `LedgerEntry`).
- Campaign funds cannot become `LIVE` without recorded `CampaignFunding`.
