/**
 * NexeraQuest Domain Types & State Machines
 * Tagline: QUEST. CONTRIBUTE. EARN.
 */

// User & Role System
export type UserRole =
  | 'CONTRIBUTOR'
  | 'PROJECT_OWNER'
  | 'PROJECT_OPERATOR'
  | 'ADMIN'
  | 'FINANCE_ADMIN'
  | 'RISK_ADMIN'
  | 'SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface UserProfile {
  id: string;
  telegramId?: string | null;
  telegramUsername?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role: UserRole;
  status: UserStatus;
  trustScore: number;
  avatarUrl?: string | null;
  referralCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Campaign Lifecycle State Machine
export type CampaignStatus =
  | 'DRAFT'
  | 'FUNDING_REQUIRED'
  | 'FUNDED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'LIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SETTLED';

export type CampaignCategory =
  | 'Community'
  | 'Social'
  | 'Growth'
  | 'Creative'
  | 'Testing'
  | 'Partnership';

export interface CampaignEligibility {
  minTrustScore?: number;
  maxCompletionsPerUser?: number;
  allowedCountries?: string[];
  disallowedCountries?: string[];
  telegramAccountAgeDays?: number;
  requiresPriorVerifiedTask?: boolean;
}

export interface CampaignEconomics {
  rewardPerAction: number;
  targetParticipants: number;
  rewardPool: number;
  feePercentage: number;
  feeAmount: number;
  totalDeposit: number;
  currency: string;
}

export interface Campaign {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  description: string;
  category: CampaignCategory;
  coverUrl?: string | null;
  status: CampaignStatus;
  rewardPerAction: number;
  targetParticipants: number;
  completedParticipants: number;
  totalBudget: number;
  platformFee: number;
  lockedBudget: number;
  earnedBudget: number;
  refundableBudget: number;
  currency: string;
  verificationType: string;
  verificationConfig?: any;
  eligibilityConfig?: CampaignEligibility;
  startDate?: string | null;
  endDate?: string | null;
  pausedReason?: string | null;
  rejectionReason?: string | null;
  project?: Project;
  tasks?: CampaignTask[];
  createdAt: string;
  updatedAt: string;
}

export type TaskType =
  | 'TELEGRAM_JOIN'
  | 'TELEGRAM_CHANNEL'
  | 'CONTENT_REVIEW'
  | 'SOCIAL_SHARE'
  | 'PRODUCT_TEST'
  | 'CUSTOM_TASK';

export interface CampaignTask {
  id: string;
  campaignId: string;
  title: string;
  taskType: TaskType;
  actionType: string;
  destinationUrl?: string | null;
  instructions: string;
  proofRequirements?: string | null;
  timerSeconds?: number | null;
  orderIndex: number;
  verificationAdapter: string;
  adapterConfig?: any;
  createdAt: string;
}

// Task Instance State Machine
export type TaskInstanceStatus =
  | 'AVAILABLE'
  | 'STARTING'
  | 'IN_PROGRESS'
  | 'SUBMISSION_REQUIRED'
  | 'VERIFYING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface TaskInstance {
  id: string;
  campaignTaskId: string;
  campaignId: string;
  userId: string;
  status: TaskInstanceStatus;
  startedAt: string;
  expiresAt?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  completedAt?: string | null;
  proof?: Proof | null;
  rewardClaimed?: boolean;
  metadata?: any;
  task?: CampaignTask;
  campaign?: Campaign;
}

// Proof & Verification
export type ProofType = 'URL' | 'TEXT' | 'IMAGE_UPLOAD' | 'TELEGRAM_SESSION';

export interface Proof {
  id: string;
  taskInstanceId: string;
  userId: string;
  proofType: ProofType;
  content?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  checksum?: string | null;
  submittedAt: string;
}

export type VerificationState = 'VERIFIED' | 'NOT_VERIFIED' | 'UNAVAILABLE' | 'PENDING';

export interface VerificationResult {
  status: VerificationState;
  adapter: string;
  confidence: number;
  reason?: string;
  rawDetails?: any;
  timestamp: string;
}

// Balance Accounts & Ledger
export type BalanceAccountType = 'CONTRIBUTOR' | 'PROJECT' | 'PLATFORM_FEE' | 'ESCROW';

export interface BalanceAccount {
  id: string;
  userId?: string | null;
  projectId?: string | null;
  accountType: BalanceAccountType;
  availableBalance: number;
  pendingBalance: number;
  reservedBalance: number;
  paidBalance: number;
  currency: string;
}

export type LedgerEntryType =
  | 'DEPOSIT'
  | 'ESCROW_LOCK'
  | 'REWARD_CREDIT'
  | 'REWARD_REVERSAL'
  | 'FEE_COLLECTION'
  | 'WITHDRAWAL_REQUEST'
  | 'WITHDRAWAL_PAYOUT'
  | 'REFUND'
  | 'ADJUSTMENT';

export interface LedgerEntry {
  id: string;
  transactionId: string;
  sourceAccountId?: string | null;
  destinationAccountId?: string | null;
  amount: number;
  currency: string;
  entryType: LedgerEntryType;
  campaignId?: string | null;
  taskInstanceId?: string | null;
  withdrawalId?: string | null;
  idempotencyKey?: string | null;
  referenceNote: string;
  createdAt: string;
}

// Withdrawal Lifecycle
export type WithdrawalStatus =
  | 'REQUESTED'
  | 'RISK_CHECK'
  | 'PENDING_AUTHORIZATION'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REJECTED'
  | 'MANUAL_REVIEW'
  | 'CANCELLED';

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  network: string;
  destinationAddress: string;
  status: WithdrawalStatus;
  txHash?: string | null;
  failureReason?: string | null;
  idempotencyKey: string;
  requestedAt: string;
  processedAt?: string | null;
}

// Trust Score & Reputation Engine
export type TrustEventType =
  | 'TASK_APPROVED'
  | 'TASK_REJECTED'
  | 'FRAUD_CONFIRMED'
  | 'DISPUTE_WON'
  | 'DISPUTE_LOST'
  | 'CONSECUTIVE_SUCCESS'
  | 'ACCOUNT_AGE'
  | 'MANUAL_ADJUSTMENT';

export interface TrustEvent {
  id: string;
  userId: string;
  previousScore: number;
  newScore: number;
  delta: number;
  eventType: TrustEventType;
  reason: string;
  metadata?: any;
  createdAt: string;
}

// Fraud & Risk
export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FraudCaseStatus = 'OPEN' | 'INVESTIGATING' | 'DISMISSED' | 'CONFIRMED' | 'RESOLVED';

export type FraudSignalType =
  | 'TELEGRAM_AGE'
  | 'VELOCITY_SPIKE'
  | 'SYBIL_CLUSTER'
  | 'PROOF_REUSE'
  | 'REFERRAL_LOOP'
  | 'TIMESTAMP_ANOMALY'
  | 'REPEATED_FAILURES'
  | 'SUSPICIOUS_WITHDRAWAL';

export interface FraudCase {
  id: string;
  userId: string;
  taskInstanceId?: string | null;
  withdrawalId?: string | null;
  riskScore: number;
  severity: FraudSeverity;
  status: FraudCaseStatus;
  signals?: FraudSignal[];
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FraudSignal {
  id: string;
  fraudCaseId?: string | null;
  userId: string;
  signalType: FraudSignalType;
  weight: number;
  details: string;
  detectedAt: string;
}

// Disputes
export type DisputeStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'EVIDENCE_REQUESTED'
  | 'UPHELD'
  | 'OVERTURNED'
  | 'PARTIAL_ADJUSTMENT'
  | 'REJECTED';

export interface Dispute {
  id: string;
  taskInstanceId: string;
  userId: string;
  projectId?: string | null;
  initiatedBy: 'CONTRIBUTOR' | 'PROJECT';
  reason: string;
  proofSummary?: string | null;
  status: DisputeStatus;
  adminDecision?: string | null;
  adminNotes?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Projects & Operators
export type ProjectVerificationStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface Project {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  website?: string | null;
  twitterUrl?: string | null;
  telegramUrl?: string | null;
  description: string;
  verificationStatus: ProjectVerificationStatus;
  operatorEmail?: string | null;
  contactDetails?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Referral
export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  status: 'ATTRIBUTED' | 'QUALIFIED' | 'REWARDED' | 'FRAUD_FLAGGED';
  rewardAmount?: number;
  createdAt: string;
}

// Notifications
export type NotificationChannel = 'TELEGRAM' | 'IN_APP' | 'EMAIL';

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  templateKey: string;
  title: string;
  messageBody: string;
  deepLink?: string | null;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'READ';
  createdAt: string;
}

// Audit Logs
export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}

// Pricing Rules & System Settings
export interface PricingRule {
  id: string;
  name: string;
  feePercentage: number;
  minimumFee: number;
  flatFee: number;
  currency: string;
  isActive: boolean;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

// Reconciliation
export interface ReconciliationReport {
  id: string;
  triggeredBy: string;
  status: 'PASSED' | 'DISCREPANCY_DETECTED' | 'FAILED';
  totalAccountsChecked: number;
  discrepancies: Array<{
    accountId: string;
    accountType: string;
    calculatedBalance: number;
    recordedBalance: number;
    difference: number;
    errorType: string;
  }>;
  summary: string;
  timestamp: string;
}

// API Response Envelope
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}
