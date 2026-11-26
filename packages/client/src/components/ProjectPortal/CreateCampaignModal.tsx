import React, { useState } from 'react';
import { api } from '../../api.js';
import { X, ShieldCheck, Calculator, AlertCircle, Layers } from 'lucide-react';

interface CreateCampaignModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  projectId,
  projectName,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('COMMUNITY');
  const [taskType, setTaskType] = useState('TELEGRAM_JOIN');
  const [instructions, setInstructions] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [rewardPerAction, setRewardPerAction] = useState('0.50');
  const [targetSlots, setTargetSlots] = useState('100');
  const [proofType, setProofType] = useState('AUTOMATIC_MEMBERSHIP');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Economic calculation
  const reward = parseFloat(rewardPerAction) || 0;
  const slots = parseInt(targetSlots, 10) || 0;
  const rewardPool = Number((reward * slots).toFixed(2));
  const platformFee = Number((rewardPool * 0.20).toFixed(2)); // Canonical 20%
  const totalCost = Number((rewardPool + platformFee).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const created = await api.createCampaign({
        projectId,
        title,
        description,
        category,
        taskType,
        instructions,
        externalUrl,
        rewardPerAction: reward,
        targetSlots: slots,
        proofType,
      });

      await api.fundCampaign(created.id, `PORTAL_ESCROW_TX_${Date.now()}`);

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create and fund campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-[#111216] border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/90 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-4 h-4 text-[#2AABEE] shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-zinc-100 truncate">
              Create & Pre-Fund Campaign
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close campaign modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-[11px] text-zinc-400 font-mono">
            Sponsor: <span className="text-zinc-200 font-semibold">{projectName}</span>
          </div>

          <div>
            <label htmlFor="camp-title" className="block text-zinc-300 font-semibold mb-1.5">
              Campaign Title
            </label>
            <input
              id="camp-title"
              name="title"
              type="text"
              required
              placeholder="e.g. Join TonVerse Official Telegram Channel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#2AABEE]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="camp-category" className="block text-zinc-300 font-semibold mb-1.5">
                Category
              </label>
              <select
                id="camp-category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-[#2AABEE]"
              >
                <option value="COMMUNITY">Community</option>
                <option value="SOCIAL">Social</option>
                <option value="GROWTH">Growth</option>
                <option value="TESTING">Testing</option>
                <option value="CREATIVE">Creative</option>
              </select>
            </div>
            <div>
              <label htmlFor="camp-proof-type" className="block text-zinc-300 font-semibold mb-1.5">
                Proof Verification Model
              </label>
              <select
                id="camp-proof-type"
                name="proofType"
                value={proofType}
                onChange={(e) => setProofType(e.target.value)}
                className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-[#2AABEE]"
              >
                <option value="AUTOMATIC_MEMBERSHIP">Automatic Telegram Check</option>
                <option value="LINK_SUBMISSION">URL / Social Link Submission</option>
                <option value="TEXT_RESPONSE">Detailed Feedback / Text</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="camp-url" className="block text-zinc-300 font-semibold mb-1.5">
              Target Action Link (Optional)
            </label>
            <input
              id="camp-url"
              name="externalUrl"
              type="url"
              placeholder="https://t.me/your_channel or https://x.com/your_handle"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#2AABEE]"
            />
          </div>

          <div>
            <label htmlFor="camp-instructions" className="block text-zinc-300 font-semibold mb-1.5">
              Action Instructions
            </label>
            <textarea
              id="camp-instructions"
              name="instructions"
              required
              rows={2}
              placeholder="Step-by-step instructions for contributors..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#2AABEE]"
            />
          </div>

          {/* Economics Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="camp-reward" className="block text-zinc-300 font-semibold mb-1.5">
                Reward per Action (USDT)
              </label>
              <input
                id="camp-reward"
                name="rewardPerAction"
                type="number"
                step="0.05"
                min="0.10"
                required
                value={rewardPerAction}
                onChange={(e) => setRewardPerAction(e.target.value)}
                className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-2.5 text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-[#2AABEE]"
              />
            </div>
            <div>
              <label htmlFor="camp-slots" className="block text-zinc-300 font-semibold mb-1.5">
                Target Participant Slots
              </label>
              <input
                id="camp-slots"
                name="targetSlots"
                type="number"
                min="10"
                required
                value={targetSlots}
                onChange={(e) => setTargetSlots(e.target.value)}
                className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-2.5 text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-[#2AABEE]"
              />
            </div>
          </div>

          {/* Pre-Fund Escrow Breakdown Card */}
          <div className="p-4 bg-[#0B0C0F] border border-zinc-800/90 rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-2 text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#2AABEE] shrink-0" />
                <span>
                  Contributor Reward Pool ({slots} × ${reward.toFixed(2)})
                </span>
              </span>
              <span className="font-mono tabular-nums text-zinc-200 shrink-0">
                ${rewardPool.toFixed(2)} USDT
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-zinc-400">
              <span>Platform Verification Fee (20%)</span>
              <span className="font-mono tabular-nums text-zinc-200 shrink-0">
                ${platformFee.toFixed(2)} USDT
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2 font-bold text-sm">
              <span className="text-zinc-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Total Escrow Required</span>
              </span>
              <span className="font-mono tabular-nums text-emerald-400 shrink-0">
                ${totalCost.toFixed(2)} USDT
              </span>
            </div>
            <p className="text-[10px] text-zinc-500">
              100% of unclaimed reward slots are refundable upon campaign closure.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 font-bold rounded-xl transition flex items-center justify-center min-h-[46px]"
          >
            {loading ? 'Funding Escrow & Publishing...' : `Deposit ${totalCost.toFixed(2)} USDT & Launch`}
          </button>
        </form>
      </div>
    </div>
  );
};
