'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';

export function DisputesView() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/disputes');
      const data = await res.json();
      if (data.success) {
        setDisputes(data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState<string | null>(null);
  const [partialFor, setPartialFor] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const handleResolve = async (
    disputeId: string,
    decision: 'OVERTURNED' | 'UPHELD' | 'PARTIAL_ADJUSTMENT',
    extra?: { partialAmount?: number }
  ) => {
    const notes = prompt(`Resolution reason for ${decision}:`, decision === 'OVERTURNED' ? 'Manual review verified membership' : 'Proof did not satisfy requirements');
    if (notes === null) return;

    try {
      const res = await fetch(`/api/v1/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Resolution failed');
      showToast(`Dispute ${decision === 'UPHELD' ? 'upheld' : decision === 'OVERTURNED' ? 'overturned — reward granted' : `partially adjusted (${extra?.partialAmount})`}.`);
      setPartialFor(null);
      setPartialAmount('');
      fetchDisputes();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="sticky top-2 z-30 px-4 py-3 rounded-xl bg-obsidian-850 border border-quest-violet/40 text-xs text-white shadow-xl animate-fade-up" role="status">
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Dispute Resolution Queue</h2>
          <p className="text-xs text-slate-400">Review contributor appeals on rejected tasks</p>
        </div>
        <span className="text-xs text-slate-400 font-mono">{disputes.length} Records</span>
      </div>

      <div className="space-y-3 stagger">
        {loading ? (
          <>
            <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-28" />
            <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-28" />
          </>
        ) : disputes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-obsidian-850 border border-white/[0.06] animate-fade-in">
            <div className="text-3xl mb-2">⚖️</div>
            <p className="text-sm font-bold text-white">Queue clear</p>
            <p className="text-xs text-slate-400 mt-1">No active disputes. Appeals will appear here.</p>
          </div>
        ) : (
          disputes.map((d) => (
            <div
              key={d.id}
              className="pressable p-4 rounded-2xl bg-obsidian-850 border border-white/[0.08] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Dispute #{d.id.slice(0, 8)}</span>
                  <span className="px-2 py-0.5 rounded bg-quest-amber/15 text-quest-amber text-[10px] font-bold">
                    {d.status}
                  </span>
                </div>
                <span className="text-xs text-slate-400">Contributor: @{d.user?.telegramUsername}</span>
              </div>

              <div className="p-3 rounded-xl bg-obsidian-900 border border-white/[0.04] text-xs space-y-2">
                <div>
                  <span className="text-slate-400 block mb-0.5">Contributor Appeal Reason:</span>
                  <p className="text-white font-medium">{d.reason}</p>
                </div>
                {d.proofSummary && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Submitted Proof Details:</span>
                    <p className="text-slate-300 font-mono text-[11px]">{d.proofSummary}</p>
                  </div>
                )}
              </div>

              {d.status === 'UNDER_REVIEW' && (
                <div className="pt-2 border-t border-white/[0.04] space-y-2">
                  {partialFor === d.id ? (
                    <div className="flex flex-col sm:flex-row gap-2 animate-fade-in">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        placeholder="Partial amount (USDT)"
                        className="flex-1 min-h-[44px] bg-obsidian-900 border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-quest-amber"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolve(d.id, 'PARTIAL_ADJUSTMENT', { partialAmount: Number(partialAmount) })}
                          disabled={!partialAmount || Number(partialAmount) <= 0}
                          className="pressable flex-1 sm:flex-none px-3 py-2 min-h-[44px] rounded-lg bg-quest-amber text-obsidian-950 text-xs font-bold disabled:opacity-40"
                        >
                          Confirm partial
                        </button>
                        <button
                          onClick={() => { setPartialFor(null); setPartialAmount(''); }}
                          className="pressable px-3 py-2 min-h-[44px] rounded-lg border border-white/[0.1] text-xs text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                      <button
                        onClick={() => handleResolve(d.id, 'UPHELD')}
                        className="pressable px-3 py-2 min-h-[44px] rounded-lg border border-white/[0.1] text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        Uphold Rejection
                      </button>
                      <button
                        onClick={() => setPartialFor(d.id)}
                        className="pressable px-3 py-2 min-h-[44px] rounded-lg border border-quest-amber/40 text-xs font-semibold text-quest-amber hover:bg-quest-amber/10 transition-colors"
                      >
                        Partial adjustment
                      </button>
                      <button
                        onClick={() => handleResolve(d.id, 'OVERTURNED')}
                        className="pressable px-3 py-2 min-h-[44px] rounded-lg bg-quest-emerald text-obsidian-950 text-xs font-bold shadow-md shadow-quest-emerald/20 hover:opacity-95 transition-opacity"
                      >
                        Overturn & Grant Reward
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
