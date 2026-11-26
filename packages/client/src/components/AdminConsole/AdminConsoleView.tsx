import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { AuditSummary, FraudCase, Campaign } from '../../types.js';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const AdminConsoleView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proofs' | 'withdrawals' | 'fraud' | 'campaigns' | 'audit'>('proofs');
  const [proofs, setProofs] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [fraudCases, setFraudCases] = useState<FraudCase[]>([]);
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);
  const [audit, setAudit] = useState<AuditSummary | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rejectPrompt, setRejectPrompt] = useState<{
    kind: 'proof' | 'withdrawal';
    id: string;
    title: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = async () => {
    try {
      const [pr, wd, fr, pc, ad] = await Promise.all([
        api.getPendingProofs(),
        api.getPendingWithdrawals(),
        api.getFraudCases(),
        api.getPendingCampaigns(),
        api.getLedgerAudit(),
      ]);

      setProofs(pr);
      setWithdrawals(wd);
      setFraudCases(fr);
      setPendingCampaigns(pc);
      setAudit(ad);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProofDecision = async (proofId: string, decision: 'APPROVE' | 'REJECT', reason?: string) => {
    try {
      const res = await api.decisionProof(proofId, decision, reason);
      setBanner({ type: 'success', text: res.message });
      await loadData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  const handleAuthorizeWithdrawal = async (id: string) => {
    try {
      const res = await api.authorizeWithdrawal(id);
      setBanner({ type: 'success', text: res.message });
      await loadData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  const handleRejectWithdrawal = async (id: string, reason: string) => {
    try {
      const res = await api.rejectWithdrawal(id, reason);
      setBanner({ type: 'success', text: res.message });
      await loadData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  const handleCampaignReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.reviewCampaign(id, action);
      setBanner({ type: 'success', text: `Campaign ${action.toLowerCase()}d.` });
      await loadData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  const handleFraudResolve = async (id: string, action: 'CLEARED' | 'BANNED') => {
    try {
      await api.resolveFraudCase(id, action);
      setBanner({ type: 'success', text: `Fraud case resolved as ${action}.` });
      await loadData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  const submitRejectPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectPrompt || !rejectReason.trim()) return;
    if (rejectPrompt.kind === 'proof') {
      await handleProofDecision(rejectPrompt.id, 'REJECT', rejectReason.trim());
    } else {
      await handleRejectWithdrawal(rejectPrompt.id, rejectReason.trim());
    }
    setRejectPrompt(null);
    setRejectReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-[#111216] border border-zinc-800/90 rounded-2xl">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#171920] text-[#2AABEE] border border-zinc-800 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-[-0.02em]">
                Operations Console
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-[#2AABEE]/10 text-[#2AABEE] border border-[#2AABEE]/25 text-[10px] font-mono font-medium">
                Platform Admin
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Escrow reconciliation, fraud review, manual proof approvals, and batch payout authorization.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="px-3.5 py-2.5 bg-[#171920] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 self-start sm:self-auto min-h-[40px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queues</span>
        </button>
      </div>

      {/* Inline Feedback Banner */}
      {banner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            banner.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="break-words">{banner.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-zinc-400 hover:text-zinc-100 font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Solvency & Operations KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-[#111216] border border-zinc-800/90 rounded-2xl">
          <span className="text-[11px] text-zinc-400 block">Ledger Solvency Invariant</span>
          <div className="mt-1.5 flex items-center gap-1.5">
            <ShieldCheck
              className={`w-4 h-4 shrink-0 ${audit?.isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}
            />
            <span
              className={`text-xs sm:text-sm font-bold font-mono ${
                audit?.isBalanced ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {audit?.isBalanced ? 'ZERO-SUM BALANCED' : 'RECONCILIATION ERROR'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 font-mono tabular-nums">
            {audit?.totalEntriesCount ?? 0} immutable entries
          </p>
        </div>

        <div className="p-4 bg-[#111216] border border-zinc-800/90 rounded-2xl">
          <span className="text-[11px] text-zinc-400 block">Pending Proofs</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-400 font-mono tabular-nums mt-1">
            {proofs.length}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Manual review queue</p>
        </div>

        <div className="p-4 bg-[#111216] border border-zinc-800/90 rounded-2xl">
          <span className="text-[11px] text-zinc-400 block">Pending Cashouts</span>
          <p className="text-xl sm:text-2xl font-bold text-[#2AABEE] font-mono tabular-nums mt-1">
            {withdrawals.length}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Awaiting batch authorization</p>
        </div>

        <div className="p-4 bg-[#111216] border border-zinc-800/90 rounded-2xl">
          <span className="text-[11px] text-zinc-400 block">Open Fraud Cases</span>
          <p className="text-xl sm:text-2xl font-bold text-rose-400 font-mono tabular-nums mt-1">
            {fraudCases.filter((f) => f.status === 'OPEN').length}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Sybil & velocity flags</p>
        </div>
      </div>

      {/* Wrapped Queue Navigation (Zero horizontal overflow) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800/90 pb-3">
        {[
          { id: 'proofs', label: `Proof Reviews (${proofs.length})` },
          { id: 'withdrawals', label: `Withdrawal Batches (${withdrawals.length})` },
          { id: 'fraud', label: `Fraud & Trust Queue (${fraudCases.length})` },
          { id: 'campaigns', label: `Pending Campaigns (${pendingCampaigns.length})` },
          { id: 'audit', label: 'Financial Ledger Audit' },
        ].map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition border ${
              activeTab === t.id
                ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                : 'bg-[#111216] text-zinc-400 border-zinc-800/90 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-[#111216] border border-zinc-800/90 rounded-2xl p-4 sm:p-6">
        {/* 1. PROOF REVIEW QUEUE */}
        {activeTab === 'proofs' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-100">Manual Proof Verification Queue</h2>

            {proofs.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No pending proofs in review queue.
              </div>
            ) : (
              <div className="space-y-3">
                {proofs.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-[#0B0C0F] border border-zinc-800/90 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100 break-words">
                          {p.taskInstance?.campaign?.title}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 tabular-nums">
                          +{p.taskInstance?.campaign?.rewardPerAction?.toFixed(2)} USDT
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Contributor:{' '}
                        <span className="text-zinc-200 font-mono">@{p.taskInstance?.user?.username}</span>{' '}
                        <span className="font-mono text-[11px] tabular-nums">
                          (Trust: {p.taskInstance?.user?.trustScore}/100)
                        </span>
                      </p>
                      <div className="p-3 bg-[#111216] rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300 break-words">
                        {p.payload}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleProofDecision(p.id, 'APPROVE')}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 min-h-[40px]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Settle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setRejectPrompt({
                            kind: 'proof',
                            id: p.id,
                            title: p.taskInstance?.campaign?.title || 'Proof Submission',
                          })
                        }
                        className="py-2 px-3.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 min-h-[40px]"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. WITHDRAWAL AUTHORIZATION QUEUE */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-100">Pending Crypto Withdrawal Batches</h2>

            {withdrawals.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No pending withdrawal requests.
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 bg-[#0B0C0F] border border-zinc-800/90 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                          ${w.amount.toFixed(2)} {w.currency}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                          {w.network}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono break-all">
                        Destination: <span className="text-zinc-200 select-all">{w.destinationAddress}</span>
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono tabular-nums">
                        User: @{w.user?.username} · Trust Score: {w.user?.trustScore}/100
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAuthorizeWithdrawal(w.id)}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 min-h-[40px]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Authorize On-Chain Payout</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setRejectPrompt({
                            kind: 'withdrawal',
                            id: w.id,
                            title: `$${w.amount.toFixed(2)} ${w.currency} Withdrawal`,
                          })
                        }
                        className="py-2 px-3.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 min-h-[40px]"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject & Refund</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. FRAUD & TRUST QUEUE */}
        {activeTab === 'fraud' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-100">Fraud Heuristics & Trust Incidents</h2>

            {fraudCases.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Clean audit. No fraud incidents detected.
              </div>
            ) : (
              <div className="space-y-3">
                {fraudCases.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 bg-[#0B0C0F] border border-zinc-800/90 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-rose-400 font-mono">
                          [{f.severity}] Incident {f.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono">
                          {f.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 font-mono break-all">Signals: {f.signals}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 break-words">{f.notes}</p>
                    </div>

                    {f.status === 'OPEN' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleFraudResolve(f.id, 'BANNED')}
                          className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold min-h-[38px]"
                        >
                          Ban User
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFraudResolve(f.id, 'CLEARED')}
                          className="py-2 px-3 bg-[#171920] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold min-h-[38px]"
                        >
                          Dismiss & Clear
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. PENDING CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-100">Pending Project Campaign Reviews</h2>

            {pendingCampaigns.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No campaigns awaiting review.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCampaigns.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-[#0B0C0F] border border-zinc-800/90 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-zinc-100 break-words">{c.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5 break-words">{c.instructions}</p>
                      <p className="text-[11px] text-zinc-500 font-mono tabular-nums mt-1">
                        Reward: ${c.rewardPerAction.toFixed(2)} · Slots: {c.targetSlots} · Escrow: $
                        {c.rewardPool.toFixed(2)} USDT
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCampaignReview(c.id, 'APPROVE')}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold min-h-[38px]"
                      >
                        Approve Campaign
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCampaignReview(c.id, 'REJECT')}
                        className="py-2 px-3.5 bg-rose-950/40 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold min-h-[38px]"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. FINANCIAL LEDGER AUDIT */}
        {activeTab === 'audit' && audit && (
          <div className="space-y-5">
            <div className="p-4 bg-[#0B0C0F] rounded-xl border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Full Double-Entry Balance Sheet</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Reconciliation of pre-funded escrows, earned contributor balances, fees, and settled payouts.
                </p>
              </div>
              <div
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 ${
                  audit.isBalanced
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{audit.isBalanced ? 'Zero-Sum Invariant OK' : 'Audit Mismatch'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
              <div className="p-3.5 bg-[#0B0C0F] rounded-xl border border-zinc-800/90">
                <span className="text-zinc-500 block text-[10px]">TOTAL ESCROW DEPOSITS</span>
                <span className="text-sm sm:text-base font-bold text-zinc-100 mt-1 block">
                  ${audit.totalDeposits.toFixed(2)} USDT
                </span>
              </div>
              <div className="p-3.5 bg-[#0B0C0F] rounded-xl border border-zinc-800/90">
                <span className="text-zinc-500 block text-[10px]">PLATFORM REVENUE (20%)</span>
                <span className="text-sm sm:text-base font-bold text-[#2AABEE] mt-1 block">
                  ${audit.totalPlatformFees.toFixed(2)} USDT
                </span>
              </div>
              <div className="p-3.5 bg-[#0B0C0F] rounded-xl border border-zinc-800/90">
                <span className="text-zinc-500 block text-[10px]">EARNED REWARDS</span>
                <span className="text-sm sm:text-base font-bold text-emerald-400 mt-1 block">
                  ${audit.totalRewardsEarned.toFixed(2)} USDT
                </span>
              </div>
              <div className="p-3.5 bg-[#0B0C0F] rounded-xl border border-zinc-800/90">
                <span className="text-zinc-500 block text-[10px]">SETTLED PAYOUTS</span>
                <span className="text-sm sm:text-base font-bold text-amber-400 mt-1 block">
                  ${audit.totalWithdrawalsSettled.toFixed(2)} USDT
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#0B0C0F] rounded-xl border border-zinc-800/90 text-xs text-zinc-400 space-y-2 font-mono tabular-nums">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                <span>Active Campaign Remaining Escrow Liability:</span>
                <span className="text-zinc-100 font-semibold">${audit.totalCampaignEscrowLiability.toFixed(2)} USDT</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                <span>Contributor Liquid Available Balance:</span>
                <span className="text-zinc-100 font-semibold">${audit.totalAvailableLiability.toFixed(2)} USDT</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                <span>Contributor Pending Withdrawal Liability:</span>
                <span className="text-zinc-100 font-semibold">${audit.totalPendingLiability.toFixed(2)} USDT</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-t border-zinc-800 pt-2 font-bold text-emerald-400">
                <span>Solvency Formula Status:</span>
                <span>
                  {audit.isBalanced
                    ? 'DEPOSITS == ESCROW + REWARDS + REFUNDS (Verified)'
                    : 'RECONCILIATION CHECK FAILED'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inline Rejection Reason Modal (replaces browser prompt) */}
      {rejectPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={submitRejectPrompt}
            className="w-full max-w-md bg-[#111216] border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <h3 className="text-base font-bold text-zinc-100">Reject {rejectPrompt.title}</h3>
            <div>
              <label htmlFor="admin-reject-reason" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Rejection Reason
              </label>
              <textarea
                id="admin-reject-reason"
                name="rejectReason"
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this submission or payout was rejected..."
                className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#2AABEE]"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRejectPrompt(null);
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 bg-[#171920] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold min-h-[42px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold min-h-[42px]"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
