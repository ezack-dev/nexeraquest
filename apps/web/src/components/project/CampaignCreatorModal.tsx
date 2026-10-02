'use client';

import React, { useState } from 'react';
import {
  X,
  Coins,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';
import { calculateCampaignEconomics } from '@nexeraquest/config';

interface CampaignCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CampaignCreatorModal({ isOpen, onClose, onSuccess }: CampaignCreatorModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<any>(null);
  const [fundedSuccess, setFundedSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Community');
  const [taskType, setTaskType] = useState('TELEGRAM_CHANNEL');
  const [destinationUrl, setDestinationUrl] = useState('https://t.me/tondefi_announcements');
  const [instructions, setInstructions] = useState('Join the channel and remain an active member.');
  const [rewardPerAction, setRewardPerAction] = useState('2.50');
  const [targetParticipants, setTargetParticipants] = useState('100');
  const [minTrustScore, setMinTrustScore] = useState('40');

  if (!isOpen) return null;

  const economics = calculateCampaignEconomics(Number(rewardPerAction) || 0, Number(targetParticipants) || 1);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          taskType,
          destinationUrl,
          taskInstructions: instructions,
          rewardPerAction: Number(rewardPerAction),
          targetParticipants: Number(targetParticipants),
          minTrustScore: Number(minTrustScore),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create campaign');
      }

      setCreatedCampaign(data.data.campaign);
      setStep(4); // Move to Escrow Funding step
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFundEscrow = async () => {
    if (!createdCampaign) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/campaigns/${createdCampaign.id}/fund`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Escrow funding failed');
      }

      setFundedSuccess(true);
      onSuccess();
    } catch (err: any) {
      alert(`Funding Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div key={step} className="w-full sm:max-w-xl bg-obsidian-900 border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-slide-up sm:animate-scale-in tab-enter">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                step >= s ? 'bg-quest-cyan' : 'bg-obsidian-800'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Campaign Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-quest-cyan uppercase tracking-wider">Step 1 of 4</span>
              <h2 className="text-lg font-bold text-white">Basic Campaign Information</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. TonDeFi Community Expansion Campaign"
                className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-cyan"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-quest-cyan"
              >
                <option value="Community">Community</option>
                <option value="Social">Social</option>
                <option value="Growth">Growth</option>
                <option value="Creative">Creative</option>
                <option value="Testing">Testing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Objective</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Explain what contributors will achieve and learn..."
                className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-cyan"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!title) {
                    alert('Please enter a campaign title.');
                    return;
                  }
                  setStep(2);
                }}
                className="w-full py-3 rounded-xl bg-quest-cyan text-obsidian-950 font-bold text-xs shadow-lg shadow-quest-cyan/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
              >
                <span>Continue to Task Config</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Task & Verification Adapter */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-quest-cyan uppercase tracking-wider">Step 2 of 4</span>
              <h2 className="text-lg font-bold text-white">Task & Verification Adapter</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-quest-cyan"
              >
                <option value="TELEGRAM_CHANNEL">Telegram Channel Join (Automated Bot Verification)</option>
                <option value="TELEGRAM_JOIN">Telegram Group Join</option>
                <option value="CONTENT_REVIEW">Product Testing / Structured Review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Destination URL</label>
              <input
                type="text"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://t.me/your_channel or https://app.yourproject.com"
                className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contributor Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                placeholder="Step-by-step instructions for the contributor..."
                className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-cyan"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-[2] py-2.5 rounded-xl bg-quest-cyan text-obsidian-950 font-bold text-xs shadow-lg shadow-quest-cyan/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
              >
                <span>Continue to Economics</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Economics & Pricing Calculation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-quest-cyan uppercase tracking-wider">Step 3 of 4</span>
              <h2 className="text-lg font-bold text-white">Campaign Economics & Pricing</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reward Per Action (USDT)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={rewardPerAction}
                  onChange={(e) => setRewardPerAction(e.target.value)}
                  className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-quest-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Contributors</label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  value={targetParticipants}
                  onChange={(e) => setTargetParticipants(e.target.value)}
                  className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-quest-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Min. Contributor Trust Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={minTrustScore}
                onChange={(e) => setMinTrustScore(e.target.value)}
                className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-quest-cyan"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Contributors below this score cannot start this task (anti-bot safeguard).
              </span>
            </div>

            {/* Live Pricing Breakdown Box */}
            <div className="p-4 rounded-xl bg-obsidian-850 border border-quest-cyan/20 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Reward Pool Liability</span>
                <span className="text-white font-bold font-mono">{economics.rewardPool.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform Fee ({economics.feePercentage}%)</span>
                <span className="text-quest-cyan font-bold font-mono">{economics.feeAmount.toFixed(2)} USDT</span>
              </div>
              <div className="border-t border-white/[0.08] pt-2 flex justify-between font-bold text-sm">
                <span className="text-slate-200">Total Required Escrow Deposit</span>
                <span className="text-quest-emerald font-mono font-black">{economics.totalDeposit.toFixed(2)} USDT</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="flex-[2] py-2.5 rounded-xl bg-quest-cyan text-obsidian-950 font-bold text-xs shadow-lg shadow-quest-cyan/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Campaign & Review Escrow</span>}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Escrow Funding Confirmation */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-quest-emerald uppercase tracking-wider">Step 4 of 4</span>
              <h2 className="text-lg font-bold text-white">Escrow Funding & Launch</h2>
            </div>

            {!fundedSuccess ? (
              <>
                <div className="p-4 rounded-xl bg-obsidian-850 border border-white/[0.08] space-y-2 text-xs">
                  <div className="text-slate-400 mb-1">Campaign Created:</div>
                  <h3 className="text-sm font-bold text-white">{createdCampaign?.title}</h3>
                  <div className="flex justify-between pt-2 border-t border-white/[0.06] text-slate-300">
                    <span>Required Escrow Deposit:</span>
                    <span className="text-base font-black text-quest-emerald font-mono">
                      {economics.totalDeposit.toFixed(2)} USDT
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-quest-amber/10 border border-quest-amber/20 text-quest-amber text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Campaigns cannot go LIVE without confirmed escrow funding. Locking funds guarantees reward fulfillment to contributors.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleFundEscrow}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-quest-emerald text-obsidian-950 font-bold text-xs shadow-lg shadow-quest-emerald/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Locking Escrow & Launching...</span>
                    </>
                  ) : (
                    <span>Confirm Escrow Lock & Launch Campaign</span>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-quest-emerald/10 border border-quest-emerald/20 text-quest-emerald flex items-center justify-center mx-auto mb-3 shadow-lg shadow-quest-emerald/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Campaign is LIVE!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                  Escrow locked: <span className="font-bold text-quest-emerald font-mono">{economics.totalDeposit.toFixed(2)} USDT</span>. Contributors can now discover and execute this quest.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-quest-cyan text-obsidian-950 font-bold text-xs"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
