# Product Requirements Document

## NexeraQuest

QUEST. CONTRIBUTE. EARN.

A Telegram-native campaign marketplace for Web3 projects and contributors

> Source basis: This PRD is derived from the provided NexeraQuest Pitch Deck. Requirements explicitly stated in the deck are treated as source requirements. Architecture, implementation details, and any additions marked "Proposed" are product-development recommendations, not existing decisions in the deck.

Version 0.1  |  Status: Draft for product and engineering alignment

---

## 1. Document Control

| Field | Value |
| --- | --- |
| Product | NexeraQuest |
| Document | Product Requirements Document (PRD) |
| Version | 0.1 |
| Status | Draft |
| Source | NexeraQuest Pitch Deck |
| Primary surface | Telegram Bot + Telegram Mini App (source-defined) |
| Primary market framing | Web3 projects and contributors (source-defined) |

---

## 2. Executive Summary

NexeraQuest is a Telegram-based platform where Web3 projects create campaigns and everyday people complete tasks to earn crypto rewards. The product is positioned as a trust and verification layer: projects pre-fund campaign rewards, contributors complete defined actions, the platform verifies completion, and verified rewards are credited to an internal balance for withdrawal. The deck defines three core parties - Web3 projects, contributors, and NexeraQuest - and emphasizes guaranteed payouts, verified proofs, anti-bot controls, live campaign telemetry, and contributor reputation.

The initial MVP should prove one core economic loop: a real project deposits campaign funds, publishes a measurable task, real contributors complete the action, NexeraQuest verifies the action, and the correct reward is settled. The deck explicitly calls for a lean launch with 3-5 projects and 100-300 users before broader automation.

> **PRD product thesis:** Build trust into the transaction itself: projects pre-fund rewards; contributors see clear rules and verified payouts; NexeraQuest earns a transparent platform fee for verification, marketplace operations, and settlement.

---

## 3. Product Vision and Principles

- **Telegram-native first:** Launch instantly inside Telegram without requiring a separate consumer app download.
- **Verified work, not vanity metrics:** Reward actions only when the required task outcome is verified.
- **Pre-funded campaigns:** Project rewards are locked before campaigns go live, reducing payout exposure for contributors.
- **Transparent economics:** Display reward amounts, platform fees, targets, and remaining campaign budget clearly.
- **Reputation compounds:** Contributor trust and clean history should improve access to higher-value work.
- **Manual control before automation:** Early campaigns should be reviewable by admins until verification and fraud controls are proven.
- **Safety by design:** Never ask contributors for seed phrases, private keys, or passwords.

---

## 4. Problem Statement

The source deck identifies a two-sided trust problem. Web3 projects need real people to perform measurable growth, testing, and community actions; contributors want clear, legitimate tasks and guaranteed crypto payouts. NexeraQuest is proposed as the bridge that holds project funds, verifies proofs, filters suspicious behavior, and provides real-time campaign analytics.

| Stakeholder | Core problem | NexeraQuest response |
| --- | --- | --- |
| **Web3 projects** | Need real community members, engagement, testers, UGC, and measurable campaign outcomes. | Campaign builder, pre-funded escrow, verification, analytics, exports, fraud controls. |
| **Contributors** | Need legitimate tasks, clear rewards, simple onboarding, and trustworthy payment. | Telegram login, task discovery, proof verification, internal balance, withdrawal, reputation. |
| **NexeraQuest operations** | Must keep the marketplace secure, honest, and solvent. | Campaign review, fraud management, escrow audit, withdrawal authorization, disputes/refunds. |

---

## 5. Goals and Non-Goals

### 5.1 Goals
- Enable Web3 projects to launch measurable campaigns from a simple self-serve flow.
- Enable contributors to discover and complete tasks entirely inside Telegram.
- Require 100% pre-funding of campaign rewards before a campaign goes live.
- Verify task completion automatically where possible and through quick proof review where necessary.
- Credit verified rewards into an internal contributor balance and support withdrawal requests.
- Provide project-side real-time progress, verified actions, budget usage, and participant exports.
- Establish a contributor Trust Score based on honest completion and fraud signals.
- Support an operational admin layer for approvals, fraud, escrow, disputes, and withdrawals.

### 5.2 Non-goals for MVP
- Full X, Discord, and on-chain event verification (placed in later roadmap).
- Creator/KOL marketplace and long-term ambassador programs as first-class workflows.
- Portable on-chain reputation badges.
- Enterprise API and automated monthly subscription campaign launches.
- Large-scale self-serve marketplace before the initial 3-5 project / 100-300 contributor validation stage.

---

## 6. Users and Personas

| Persona | Primary job | Needs | Key actions |
| --- | --- | --- | --- |
| **Project operator** | Run a campaign that delivers verified outcomes. | Fast setup, predictable cost, real participants, transparent analytics, refunds for unclaimed slots. | Register, configure task, deposit, launch, monitor, export, close campaign. |
| **Contributor** | Complete legitimate tasks and earn crypto. | Simple onboarding, clear rules, reliable verification, trustworthy payout, reputation growth. | Open bot, browse campaign, complete task, submit proof, see balance, withdraw. |
| **Admin / operations** | Protect marketplace quality and financial integrity. | Approval queue, fraud signals, dispute tools, ledger audit, withdrawal control. | Review, approve, flag, freeze, resolve, authorize payouts/refunds. |

---

## 7. Core User Journeys

### 7.1 Project journey
1. Register project account and connect official project social handles.
2. Create task campaign with action type, participant target, reward per action, and campaign details.
3. Deposit and lock the full campaign economics in escrow before launch.
4. NexeraQuest reviews and publishes the campaign to contributors.
5. Project monitors verified actions, member counts, spend, remaining budget, and suspicious activity.
6. Project closes or completes the campaign; unclaimed reward slots are eligible for refund under settlement rules.

### 7.2 Contributor journey
1. Launch NexeraQuest from Telegram with no separate app download.
2. Browse or filter campaigns by category or reward.
3. Open a campaign and review task rules, reward, requirements, and remaining slots.
4. Complete the required action, such as joining a Telegram group or sharing/reposting content.
5. System automatically verifies the action or requests a quick proof.
6. Once approved, credit the reward to the internal balance.
7. Withdraw to a user-supplied wallet address; wallet setup is deferred until cash-out.

### 7.3 Admin journey
1. Review newly submitted project campaigns.
2. Confirm required campaign funding / escrow state.
3. Approve, reject, or pause campaigns.
4. Review fraud flags, suspicious submissions, and duplicate-account patterns.
5. Resolve disputes and rejected submissions where required.
6. Audit escrow and reward ledgers.
7. Authorize contributor withdrawal batches and project refunds according to policy.

---

## 8. Functional Requirements - Contributor Experience

| ID | Requirement | Acceptance criteria | Priority |
| --- | --- | --- | --- |
| **C-01** | Telegram authentication | User can launch the bot/Mini App and be identified through their Telegram session without separate app account creation. | P0 |
| **C-02** | Contributor profile | User can view identity handle, verification status, Trust Score, completed quests, approval rate, total earnings, active tasks, referrals, and withdrawal access. | P0 |
| **C-03** | Campaign discovery | User can browse active campaigns and filter at minimum by task category and reward amount. | P0 |
| **C-04** | Campaign detail | User can see task instructions, reward per action, target/remaining slots, eligibility, proof requirements, and relevant project information before starting. | P0 |
| **C-05** | Task start / completion | User can enter a task, complete required action, and return to NexeraQuest to initiate verification. | P0 |
| **C-06** | Automated verification | Where supported, system checks the required action and produces a verification result tied to the user and campaign. | P0 |
| **C-07** | Proof submission | When automated verification is unavailable, user can submit a defined proof payload for review. | P0 |
| **C-08** | Reward credit | Approved task produces exactly one reward credit according to campaign rules; duplicate credits are prevented. | P0 |
| **C-09** | Balance | User can view available balance and relevant transaction history. | P0 |
| **C-10** | Withdrawal request | User can add a payout wallet at cash-out and submit a withdrawal request subject to configured checks. | P0 |
| **C-11** | Notifications | Bot can notify users about matching/high-paying quests, approval/rejection, and important account or payout events. | P1 |
| **C-12** | Reputation | System updates Trust Score and visible contribution history based on configured rules and fraud outcomes. | P1 |

---

## 9. Functional Requirements - Project Experience

| ID | Requirement | Acceptance criteria | Priority |
| --- | --- | --- | --- |
| **P-01** | Project registration | Project can create an account and submit official social handles for review. | P0 |
| **P-02** | Campaign creation | Project can define campaign name, task type, action instructions, reward per action, target count, proof model, and campaign dates/limits. | P0 |
| **P-03** | Escrow funding | Campaign cannot be published until required campaign reward pool and platform fee are funded/locked. | P0 |
| **P-04** | Campaign review | Campaign enters an admin review state before public availability. | P0 |
| **P-05** | Live telemetry | Project dashboard shows target, verified completed actions, spend, remaining budget/slots, and campaign status. | P0 |
| **P-06** | Participant export | Authorized project users can export verified participant identifiers for campaign use, subject to platform/privacy rules. | P1 |
| **P-07** | Campaign controls | Project/admin can pause a live campaign and prevent additional task starts or payouts while paused. | P0 |
| **P-08** | Refund handling | Unclaimed reward slots are separately accounted for and are refundable to the project after campaign closure/expiry per policy. | P0 |
| **P-09** | Fee visibility | Project sees reward pool, platform fee, and total required deposit before confirming funding. | P0 |

---

## 10. Functional Requirements - Admin and Governance

| ID | Requirement | Acceptance criteria | Priority |
| --- | --- | --- | --- |
| **A-01** | Campaign approval queue | Admins can review pending projects/campaigns, inspect configuration, and approve/reject with a reason. | P0 |
| **A-02** | Fraud review | Admins can see flagged accounts/submissions with the underlying signals and disposition. | P0 |
| **A-03** | Account actions | Admins can freeze contributor access or project campaigns when configured risk conditions are met. | P0 |
| **A-04** | Dispute handling | Admins can review disputed task submissions and record a final decision. | P0 |
| **A-05** | Escrow ledger audit | Admins can reconcile campaign deposits, reward obligations, earned amounts, fees, refunds, and withdrawal states. | P0 |
| **A-06** | Withdrawal authorization | Admins can review and authorize withdrawal batches or individual requests. | P0 |
| **A-07** | Operational reporting | Admins can view campaign, contributor, fraud, and settlement metrics. | P1 |

---

## 11. Task Ecosystem

| Category | Example task | Illustrative reward in deck | Verification direction |
| --- | --- | --- | --- |
| **Community** | Join Telegram | 0.50 USDT | Telegram Bot API Membership check |
| **Social** | Follow & Repost | 0.30 USDT | Social API verification / proof upload |
| **Growth** | Refer a friend | 1.00 USDT | Tracked invite links |
| **Creative** | Create content | 2.00 USDT | Content submission / admin review |
| **Testing** | Community tasks / product feedback | 5.00 USDT | Proof and/or review |
| **Partnership** | Ambassador | Long-term | Recurring missions and role-based review |

---

## 12. Campaign and Escrow Model

| Concept | Requirement |
| --- | --- |
| **Reward pool** | Amount reserved for contributor rewards for verified actions (`reward_per_action * target_slots`). |
| **Platform fee** | Fee charged to the project in addition to the reward pool (e.g. 15-20%). |
| **Campaign total** | Reward pool + platform fee; shown before launch. |
| **Escrow state** | Campaign funding must be locked before campaign publication. |
| **Earned liability** | Each approved task creates a specific contributor reward obligation against campaign funds. |
| **Unclaimed balance** | Unconsumed reward slots remain attributable to the project and can be refunded under closure rules. |
| **Auditability** | Every deposit, reservation, reward credit, fee, refund, and withdrawal has an immutable internal ledger event. |

---

## 13. Settlement Rules

| State | System outcome |
| --- | --- |
| **Task completed + verified** | Credit reward to contributor balance; decrement remaining reward slot/budget. |
| **Verification failed** | No reward; record reason; campaign reward obligation is not created. |
| **User leaves early / action incomplete** | No reward; treat as incomplete based on task-specific verification rule. |
| **Duplicate attempt** | Block or reject duplicate reward; preserve first valid completion. |
| **Campaign paused** | No new task starts and no new reward approvals unless explicitly allowed by admin policy. |
| **Campaign closed** | Prevent new completions; reconcile earned and unclaimed balances; process refunds under policy. |
| **Withdrawal requested** | Create withdrawal request; run configured risk checks; authorize and settle to destination wallet. |

---

## 14. Trust, Anti-Bot, and Fraud Controls

- **Account signals:** Telegram account age and activity signals for suspicious/new scripted accounts.
- **Duplicate detection:** Pattern analysis for users attempting to operate multiple accounts.
- **Referral audits:** Detect cyclic referrals and self-referral behavior.
- **Submission integrity:** Bind proof to Telegram identity, campaign, task instance, and timestamp.
- **Velocity controls:** Rate-limit suspiciously fast task completion and repeated actions.
- **Trust Score:** Increase with honest completion; decrease or freeze with proven fraud events.
- **Manual review:** Allow admins to inspect evidence behind a flag before severe account actions.

---

## 15. Contributor Reputation Model

| Metric | Purpose | MVP treatment |
| --- | --- | --- |
| **Trust Score (0-100)** | Primary reputation indicator. | Display score (default baseline e.g. 50); change events logged. |
| **Completed quests** | Demonstrates verified activity. | Increment only on successfully settled tasks. |
| **Approval rate** | Shows reliability of submissions. | Calculate: `approved / (approved + rejected)`. |
| **Fraud flags** | Protects projects from risky behavior. | Track active/resolved flags separately from normal completion stats. |
| **Total earned** | Shows contributor economic history. | Sum settled rewards, separate from pending and rejected amounts. |

---

## 16. Notifications and Telegram Interaction Model

| Event | Audience | Notification |
| --- | --- | --- |
| New matching/high-paying campaign | Contributors | Bot message with campaign summary + deep link to Mini App. |
| Task accepted or started | Contributor | Status update and next action. |
| Task approved | Contributor | Reward amount credited to balance. |
| Task rejected | Contributor | Reason/status and appeal or support path if enabled. |
| Campaign milestone | Project | Progress update or dashboard deep link. |
| Campaign paused/closed | Project + affected users | Status and settlement instructions. |
| Withdrawal status | Contributor | Requested / processing / paid / rejected. |

---

## 17. Information Architecture / Screen Map

### 17.1 Contributor Mini App
- **Home / Discover:** campaign feed, categories, rewards, featured/high-trust tasks.
- **Campaign Detail:** project summary, task instructions, reward, eligibility, target, verification method, start CTA.
- **Task In Progress:** step-by-step task state, proof requirements, timer/deadline if configured.
- **Verification Result:** approved/rejected/pending with reason and reward outcome.
- **Wallet / Balance:** available, pending, paid/withdrawn, transaction history, withdraw CTA.
- **Profile:** Telegram handle, Trust Score, quests, approval rate, earnings, referrals.

### 17.2 Project Dashboard
- **Overview:** active campaigns, spend, verified actions, remaining budget.
- **Create Campaign:** task builder and fee calculator.
- **Campaign Detail:** telemetry, participant counts, suspicious activity, controls.
- **Participants:** verified users and export action.
- **Billing / Funding:** deposits, escrow state, fees, refunds, transaction history.

### 17.3 Admin Console
- **Operations Dashboard:** key metric indicators.
- **Campaign Approval Queue:** review and authorize campaigns.
- **Fraud & Trust Queue:** review flagged accounts/attempts.
- **Dispute Queue:** review appeals/rejections.
- **Escrow / Settlement Ledger:** double-entry reconciliation.
- **Withdrawal Authorization:** payout batch approvals.

---

## 18. Proposed Technical Architecture

| Layer | Responsibility | Recommended Tech Stack |
| --- | --- | --- |
| **Telegram Bot** | Commands, notifications, deep links, Mini App launch | Node.js (grammY / Telegraf) or Python (aiogram) |
| **Telegram Mini App (TMA)** | Contributor marketplace, task workflows, wallet/profile | React + Vite + Tailwind CSS / Telegram WebApp SDK |
| **Project & Admin Dashboard** | Campaign management, telemetry, admin queues | Next.js or React + Tailwind CSS / Shadcn UI |
| **Backend API** | Business logic, auth (Telegram initData verification), state machines | Node.js (NestJS / Express / Fastify) or Go / Python |
| **Database & Ledger** | Relational state + double-entry ledger | PostgreSQL + Prisma / Drizzle |
| **Cache & Queue** | Rate limiting, async verifications, notifications | Redis + BullMQ |
| **Storage** | User proof screenshots/files | S3-compatible object storage (Cloudflare R2 / AWS S3) |

---

## 19. Core Data Model Entities

- `User`: Telegram contributor identity (telegram_user_id, username, trust_score, status).
- `Project`: Campaign owner/sponsor (name, contact, handles, status).
- `Campaign`: Marketing/quest campaign (project_id, task_type, reward_per_action, target_slots, status, escrow_balance).
- `TaskInstance`: Contributor claim/attempt (campaign_id, user_id, status: started/submitted/approved/rejected).
- `Proof`: Submitted verification data (task_instance_id, proof_type, payload, status).
- `BalanceAccount`: Contributor balance record (user_id, available, pending, withdrawn).
- `LedgerEntry`: Immutable double-entry financial events (account_id, campaign_id, type, amount, currency, ref).
- `Withdrawal`: Payout requests (user_id, amount, destination_wallet, status, tx_hash).
- `FraudCase`: Security and integrity reviews (subject_type, subject_id, risk_score, reason, status).
- `AuditEvent`: Tamper-evident admin & system actions.

---

## 20. Open Product Decisions & Implementation Plan

1. **Canonical Fee Calculation:** Recommend explicit 20% platform fee added to gross budget: `Total = RewardPool + (RewardPool * 0.20)`.
2. **Settlement Asset & Network:** Recommend USDT / TON on TON Blockchain (native to Telegram ecosystem) or EVM (USDT on Arbitrum/Polygon for low gas fees).
3. **Custody & Escrow Architecture:** Hybrid model for MVP: custodial ledger-backed escrow with non-custodial batch withdrawals to user-provided addresses.
