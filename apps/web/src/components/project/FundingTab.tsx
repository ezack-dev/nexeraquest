'use client';

import React, { useState } from 'react';
import { ShieldCheck, RotateCcw, AlertCircle, CheckCircle2, Coins, XCircle, Loader2 } from 'lucide-react';

interface FundingTabProps {
  stats: any;
  campaigns: any[];
  onRefresh: () => void;
}

export function FundingTab({ stats, campaigns, onRefresh }: FundingTabProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleClose = async () => {
    if (!confirmClose) return;
    setBusyId(confirmClose.id);
    try {
      const res = await fetch(`/api/v1/campaigns/${confirmClose.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Close failed');
      showToast(`Campaign closed. ${data.data.refundable.toFixed(2)} USDT available to reclaim; ${data.data.earned.toFixed(2)} stays allocated to contributors.`);
      setConfirmClose(null);
      onRefresh();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleRefund = async (campaignId: string) => {
    setBusyId(campaignId);
    try {
      const res = await fetch(`/api/v1/campaigns/${campaignId}/refund`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Refund failed');
      showToast(`Reclaimed ${data.data?.refundedAmount?.toFixed(2) || ''} USDT of unused escrow.`);
      onRefresh();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 stagger">
      {toast && (
        <div className="sticky top-2 z-30 px-4 py-3 rounded-xl bg-obsidian-850 border border-quest-violet/40 text-xs text-white shadow-xl animate-fade-up" role="status">
          {toast}
        </div>
      )}
      {/* Escrow Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-obsidian-850 border border-white/[0.08]">
          <span className="text-xs text-slate-400 block mb-1">Total Escrow Deposited</span>
          <span className="text-2xl font-black text-white font-mono">
            {(stats?.totalBudget || 575).toFixed(2)} USDT
          </span>
        </div>
        <div className="p-4 rounded-xl bg-obsidian-850 border border-white/[0.08]">
          <span className="text-xs text-slate-400 block mb-1">Locked Reward Escrow</span>
          <span className="text-2xl font-black text-quest-amber font-mono">
            {(stats?.totalLocked || 420).toFixed(2)} USDT
          </span>
        </div>
        <div className="p-4 rounded-xl bg-obsidian-850 border border-white/[0.08]">
          <span className="text-xs text-slate-400 block mb-1">Earned Contributor Liabilities</span>
          <span className="text-2xl font-black text-quest-emerald font-mono">
            {(stats?.totalSpent || 80).toFixed(2)} USDT
          </span>
        </div>
      </div>

      {/* Campaign Escrows List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Campaign Escrow Allocation
        </h3>

        {campaigns.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-obsidian-850 border border-white/[0.06] animate-fade-in">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-sm font-bold text-white">No funded campaigns yet</p>
            <p className="text-xs text-slate-400 mt-1">Create and fund a campaign to see escrow allocation here.</p>
          </div>
        ) : (
        <div className="space-y-2">
          {campaigns.map((c) => {
            const spentPct = c.totalBudget > 0 ? Math.min(100, Math.round((c.earnedBudget / c.totalBudget) * 100)) : 0;
            return (
            <div
              key={c.id}
              className="pressable p-4 rounded-xl bg-obsidian-850 border border-white/[0.06] space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-xs font-bold text-white truncate">{c.title}</h4>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-slate-300 font-mono">
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
                    <span>Deposit: {c.totalBudget.toFixed(2)}</span>
                    <span className="text-quest-amber">Locked: {c.lockedBudget.toFixed(2)}</span>
                    <span className="text-quest-emerald">Earned: {c.earnedBudget.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {['LIVE', 'PAUSED'].includes(c.status) && (
                    <button
                      onClick={() => setConfirmClose(c)}
                      disabled={busyId === c.id}
                      className="pressable px-3 py-2 min-h-[44px] rounded-lg border border-rose-500/40 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Close campaign</span>
                    </button>
                  )}
                  {['COMPLETED', 'EXPIRED', 'CANCELLED', 'PAUSED'].includes(c.status) && c.lockedBudget > 0 && (
                    <button
                      onClick={() => handleRefund(c.id)}
                      disabled={busyId === c.id}
                      className="pressable px-3 py-2 min-h-[44px] rounded-lg bg-quest-amber/15 hover:bg-quest-amber/25 text-quest-amber text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      {busyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>Reclaim {c.lockedBudget.toFixed(2)} USDT</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Budget distributed</span>
                  <span>{spentPct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-obsidian-950 overflow-hidden border border-white/[0.05]">
                  <div
                    className="h-full bg-gradient-to-r from-quest-emerald to-quest-cyan rounded-full transition-all duration-500"
                    style={{ width: `${spentPct}%` }}
                  />
                </div>
              </div>
            </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Close confirmation sheet */}
      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in" onClick={() => setConfirmClose(null)}>
          <div className="w-full sm:max-w-md bg-obsidian-900 border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-slide-up sm:animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-2">Close “{confirmClose.title}”?</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-1">
              Earned rewards (<span className="text-quest-emerald font-mono">{confirmClose.earnedBudget.toFixed(2)} USDT</span>) stay
              allocated to contributors. Unclaimed slots (<span className="text-quest-amber font-mono">{confirmClose.lockedBudget.toFixed(2)} USDT</span>) become
              reclaimable in a separate refund step.
            </p>
            <p className="text-xs text-slate-400 mb-4">In-flight verifications will be frozen. This cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setConfirmClose(null)}
                className="pressable flex-1 px-4 py-3 min-h-[48px] rounded-xl border border-white/[0.1] text-sm text-slate-200"
              >
                Keep running
              </button>
              <button
                onClick={handleClose}
                disabled={busyId === confirmClose.id}
                className="pressable flex-1 px-4 py-3 min-h-[48px] rounded-xl bg-rose-500 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busyId === confirmClose.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Close campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
