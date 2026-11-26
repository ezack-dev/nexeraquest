export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  trustScore: number;
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED';
  referralCode: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  website?: string;
  telegramChannel?: string;
  twitterHandle?: string;
}

export interface Campaign {
  id: string;
  projectId: string;
  project?: Project;
  title: string;
  description: string;
  category: 'COMMUNITY' | 'SOCIAL' | 'GROWTH' | 'CREATIVE' | 'TESTING';
  taskType: 'TELEGRAM_JOIN' | 'TWITTER_FOLLOW' | 'REFERRAL' | 'CONTENT_SUBMIT' | 'FEEDBACK';
  instructions: string;
  externalUrl?: string | null;
  rewardPerAction: number;
  targetSlots: number;
  completedSlots: number;
  rewardPool: number;
  platformFee: number;
  totalCost: number;
  proofType: 'AUTOMATIC_MEMBERSHIP' | 'LINK_SUBMISSION' | 'SCREENSHOT_UPLOAD' | 'TEXT_RESPONSE';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CLOSED' | 'REJECTED';
  rejectionReason?: string;
  createdAt?: string;
}

export interface Proof {
  id: string;
  taskInstanceId: string;
  proofType: string;
  payload: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface TaskInstance {
  id: string;
  campaignId: string;
  campaign?: Campaign;
  userId: string;
  user?: User;
  status: 'STARTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ABANDONED';
  proof?: Proof;
  startedAt: string;
  completedAt?: string;
}

export interface LedgerEntry {
  id: string;
  type: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  referenceId?: string;
  description?: string;
  timestamp: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  user?: User;
  amount: number;
  currency: string;
  network: string;
  destinationAddress: string;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  txHash?: string;
  createdAt: string;
}

export interface BalanceAccount {
  available: number;
  pending: number;
  withdrawn: number;
  totalEarnings: number;
  ledgerEntries: LedgerEntry[];
  withdrawals: Withdrawal[];
}

export interface FraudCase {
  id: string;
  subjectType: string;
  subjectId: string;
  severity: string;
  signals: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface AuditSummary {
  totalDeposits: number;
  totalPlatformFees: number;
  totalRewardsEarned: number;
  totalWithdrawalsSettled: number;
  totalRefunds: number;
  totalAvailableLiability: number;
  totalPendingLiability: number;
  totalWithdrawnRecorded: number;
  totalCampaignEscrowLiability: number;
  isBalanced: boolean;
  totalEntriesCount: number;
}
