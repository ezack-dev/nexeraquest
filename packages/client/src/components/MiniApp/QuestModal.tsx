import React, { useState, useEffect } from 'react';
import { Campaign, TaskInstance } from '../../types.js';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.js';
import { X, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';

interface QuestModalProps {
  campaign: Campaign;
  existingTask?: TaskInstance;
  onClose: () => void;
  onComplete: () => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ campaign, existingTask, onClose, onComplete }) => {
  const { user, refreshUser } = useAuth();
  const [taskInstance, setTaskInstance] = useState<TaskInstance | null>(existingTask || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [proofPayload, setProofPayload] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);
  const [claimedLocally, setClaimedLocally] = useState<boolean>(false);
  const [initialCompleted] = useState<number>(campaign.completedSlots);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

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

  const effectiveCompleted = claimedLocally
    ? Math.max(campaign.completedSlots, initialCompleted + 1)
    : campaign.completedSlots;
  const slotsRemaining = Math.max(0, campaign.targetSlots - effectiveCompleted);

  const alreadyApproved = existingTask?.status === 'APPROVED' && !successResult;
  const alreadySubmitted = existingTask?.status === 'SUBMITTED' && !successResult;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-[#13151B] border-t sm:border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-zinc-400 truncate">
              {campaign.project?.name || 'Verified Sponsor'}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-medium text-emerald-400 inline-flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Funded</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quest modal"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-[-0.02em] break-words">
              {campaign.title}
            </h2>
            <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">{campaign.description}</p>
          </div>

          {/* Reward & Availability */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#0E1015] border border-white/[0.07] rounded-xl">
            <div>
              <span className="text-xs text-zinc-400 block">Reward</span>
              <p className="text-base sm:text-lg font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
                +{campaign.rewardPerAction.toFixed(2)} USDT
              </p>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">Remaining Spots</span>
              <p className="text-base sm:text-lg font-semibold text-zinc-100 font-mono tabular-nums mt-0.5">
                {slotsRemaining} / {campaign.targetSlots}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 mb-2">How to Complete</h3>
            <div className="p-3.5 bg-[#0E1015] border border-white/[0.07] rounded-xl text-[13px] text-zinc-300 leading-relaxed whitespace-pre-line break-words">
              {campaign.instructions || campaign.description}
            </div>
          </div>

          {/* External Action Link */}
          {campaign.externalUrl && !alreadyApproved && (
            <a
              href={campaign.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#191C24] hover:bg-white/[0.09] border border-white/[0.1] rounded-xl text-[13px] font-medium text-[#3390EC] transition min-h-[44px]"
            >
              <span>Open Task Link</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-2 text-[13px] text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Already Approved Receipt */}
          {alreadyApproved && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Quest Completed · +{campaign.rewardPerAction.toFixed(2)} USDT</span>
              </div>
              <p className="text-xs text-zinc-300">
                Your submission has been verified and credited to your balance.
              </p>
              {existingTask?.proof?.payload && (
                <p className="text-xs text-zinc-400 font-mono truncate pt-1">
                  Proof: {existingTask.proof.payload}
                </p>
              )}
            </div>
          )}

          {/* Already Submitted Pending Review */}
          {alreadySubmitted && (
            <div className="p-4 bg-[#3390EC]/10 border border-[#3390EC]/25 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-[#3390EC] font-semibold text-sm">
                <Clock className="w-4 h-4" />
                <span>Submission Under Review</span>
              </div>
              <p className="text-xs text-zinc-300">
                Your proof is in queue. Your balance will update automatically once approved.
              </p>
              {existingTask?.proof?.payload && (
                <p className="text-xs text-zinc-400 font-mono truncate pt-1">
                  Submitted: {existingTask.proof.payload}
                </p>
              )}
            </div>
          )}

          {/* Fresh Completion Confirmation */}
          {successResult && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-emerald-300">
                {claimedLocally ? 'Reward Credited' : 'Proof Submitted'}
              </h4>
              <p className="text-[13px] text-zinc-300">{successResult}</p>
            </div>
          )}

          {/* Active Execution Controls */}
          {!successResult && !alreadyApproved && !alreadySubmitted && (
            <div className="pt-1">
              {!taskInstance ? (
                <button
                  type="button"
                  onClick={handleStartTask}
                  disabled={loading || slotsRemaining === 0}
                  className="w-full py-3 px-4 bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2 min-h-[46px]"
                >
                  {loading ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Start Quest</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-[#0E1015] border border-white/[0.07] rounded-xl text-xs text-zinc-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#3390EC] shrink-0" />
                    <span>Complete the steps above, then submit verification below.</span>
                  </div>

                  {campaign.proofType !== 'AUTOMATIC_MEMBERSHIP' && (
                    <div>
                      <label
                        htmlFor="proof-payload-input"
                        className="block text-xs font-medium text-zinc-300 mb-1.5"
                      >
                        {campaign.proofType === 'LINK_SUBMISSION'
                          ? 'Your Post or Repost URL'
                          : 'Your Feedback or Bug Report'}
                      </label>
                      <textarea
                        id="proof-payload-input"
                        name="proofPayload"
                        value={proofPayload}
                        onChange={(e) => setProofPayload(e.target.value)}
                        placeholder={
                          campaign.proofType === 'LINK_SUBMISSION'
                            ? 'https://x.com/your_handle/status/...'
                            : 'Write your feedback here...'
                        }
                        rows={3}
                        className="w-full bg-[#0E1015] border border-white/[0.08] rounded-xl p-3 text-[13px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#3390EC] transition"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2 min-h-[46px]"
                  >
                    {loading ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {campaign.proofType === 'AUTOMATIC_MEMBERSHIP'
                            ? 'Verify & Claim Reward'
                            : 'Submit Proof'}
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
