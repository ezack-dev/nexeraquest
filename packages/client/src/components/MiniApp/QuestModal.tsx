import React, { useState } from 'react';
import { Campaign, TaskInstance } from '../../types.js';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.js';
import { X, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';

interface QuestModalProps {
  campaign: Campaign;
  onClose: () => void;
  onComplete: () => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ campaign, onClose, onComplete }) => {
  const { user, refreshUser } = useAuth();
  const [taskInstance, setTaskInstance] = useState<TaskInstance | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [proofPayload, setProofPayload] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);
  const [claimedLocally, setClaimedLocally] = useState<boolean>(false);
  const [initialCompleted] = useState<number>(campaign.completedSlots);

  const handleStartTask = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.startTask(campaign.id, user.id);
      setTaskInstance(res.taskInstance);
    } catch (err: any) {
      setError(err.message || 'Failed to start quest');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!taskInstance) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyTask(taskInstance.id, proofPayload);
      setSuccessResult(res.message);
      if (res.success || res.status === 'VERIFIED') {
        setClaimedLocally(true);
      }
      await refreshUser();
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Ensure modal slot count reflects verification immediately without double counting
  const effectiveCompleted = claimedLocally
    ? Math.max(campaign.completedSlots, initialCompleted + 1)
    : campaign.completedSlots;
  const slotsRemaining = Math.max(0, campaign.targetSlots - effectiveCompleted);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#111216] border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/90 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-zinc-900 text-zinc-300 border border-zinc-800">
              {campaign.category}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pre-Funded Escrow</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quest modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-[-0.02em] break-words">
              {campaign.title}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Sponsored by{' '}
              <span className="font-semibold text-zinc-200">{campaign.project?.name || 'Verified Sponsor'}</span>
            </p>
          </div>

          {/* Reward & Slots Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#0B0C0F] border border-zinc-800/90 rounded-xl">
            <div>
              <span className="text-[11px] text-zinc-500 block">Guaranteed Reward</span>
              <p className="text-base sm:text-lg font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                {campaign.rewardPerAction.toFixed(2)} USDT
              </p>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Slots Remaining</span>
              <p className="text-base sm:text-lg font-bold text-zinc-100 font-mono tabular-nums mt-0.5">
                {slotsRemaining} / {campaign.targetSlots}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Task Instructions
            </h3>
            <div className="p-3.5 bg-[#0B0C0F] border border-zinc-800/90 rounded-xl text-xs text-zinc-300 leading-relaxed whitespace-pre-line break-words">
              {campaign.instructions || campaign.description}
            </div>
          </div>

          {/* External Action Link */}
          {campaign.externalUrl && (
            <div>
              <a
                href={campaign.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#171920] hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-xs font-semibold text-[#2AABEE] transition min-h-[44px]"
              >
                <span>Open External Task / Channel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Success Result */}
          {successResult && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-emerald-300">
                {claimedLocally ? 'Quest Approved' : 'Proof Submitted'}
              </h4>
              <p className="text-xs text-zinc-300">{successResult}</p>
            </div>
          )}

          {/* Execution Section */}
          {!successResult && (
            <div className="pt-1 pb-[env(safe-area-inset-bottom)]">
              {!taskInstance ? (
                <button
                  type="button"
                  onClick={handleStartTask}
                  disabled={loading || slotsRemaining === 0}
                  className="w-full py-3 px-4 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 font-bold rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[46px]"
                >
                  {loading ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Start Quest ({campaign.rewardPerAction.toFixed(2)} USDT)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-[#171920] border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#2AABEE] shrink-0" />
                    <span>Quest in progress. Complete the required action and verify below.</span>
                  </div>

                  {campaign.proofType !== 'AUTOMATIC_MEMBERSHIP' && (
                    <div>
                      <label htmlFor="proof-payload-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        {campaign.proofType === 'LINK_SUBMISSION'
                          ? 'Paste Your Post / Repost URL'
                          : 'Provide Your Feedback / Bug Report'}
                      </label>
                      <textarea
                        id="proof-payload-input"
                        name="proofPayload"
                        value={proofPayload}
                        onChange={(e) => setProofPayload(e.target.value)}
                        placeholder={
                          campaign.proofType === 'LINK_SUBMISSION'
                            ? 'https://x.com/your_handle/status/...'
                            : 'Describe your feedback or bugs encountered...'
                        }
                        rows={3}
                        className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#2AABEE] transition"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[46px]"
                  >
                    {loading ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {campaign.proofType === 'AUTOMATIC_MEMBERSHIP'
                            ? 'Verify Membership & Claim'
                            : 'Submit Proof for Verification'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
