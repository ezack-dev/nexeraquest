'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, ShieldCheck, ArrowRight, Loader2, Search } from 'lucide-react';

export function WithdrawalsQueueView() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [status, setStatus] = useState('ALL');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [confirmPay, setConfirmPay] = useState<any | null>(null);
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    fetchWithdrawals(true);
  }, [status, debouncedQuery, sort]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const fetchWithdrawals = async (reset = false) => {
    if (reset) { setLoading(true); setError(null); }
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ status, sort });
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (!reset && nextCursor) params.set('cursor', nextCursor);
      const res = await fetch(`/api/v1/admin/withdrawals?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed to load withdrawals');
      setWithdrawals((prev) => (reset ? data.data : [...prev, ...data.data]));
      setNextCursor(data.meta?.nextCursor || null);
    } catch (err: any) {
      if (reset) setError(err.message);
      else showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleProcess = async (withdrawalId: string, action: 'PAY' | 'REJECT', hash?: string) => {
    setProcessingId(withdrawalId);
    try {
      const res = await fetch(`/api/v1/admin/withdrawals/${withdrawalId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, txHash: hash || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Processing failed');
      showToast(`Withdrawal ${action === 'PAY' ? 'paid' : 'rejected — funds returned to available'}.`);
      setConfirmPay(null);
      setTxHash('');
      fetchWithdrawals(true);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="sticky top-2 z-30 px-4 py-3 rounded-xl bg-obsidian-850 border border-quest-violet/40 text-xs text-white shadow-xl animate-fade-up" role="status">
          {toast}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Withdrawal Authorizations Queue
          </h2>
          <p className="text-xs text-slate-400">
            Review and execute cashouts from contributor internal balances
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono tabular-nums">{withdrawals.length} shown</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username or wallet address…"
            className="w-full min-h-[44px] bg-obsidian-850 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-emerald/50"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-obsidian-850 border border-white/[0.08] text-xs shrink-0 overflow-x-auto">
          {['ALL', 'REQUESTED', 'PENDING_AUTHORIZATION', 'PAID', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`pressable px-3 py-2 min-h-[40px] rounded-lg font-semibold transition-all whitespace-nowrap ${
                status === st ? 'bg-quest-emerald text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 stagger" key={status + sort + debouncedQuery}>
        {loading ? (
          <>
            <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-28" />
            <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-28" />
          </>
        ) : error ? (
          <div className="p-6 text-center rounded-2xl bg-obsidian-850 border border-rose-500/20 animate-fade-in">
            <p className="text-xs font-bold text-rose-400">Couldn't load withdrawals</p>
            <p className="text-[11px] text-slate-400 mt-1">{error}</p>
            <button onClick={() => fetchWithdrawals(true)} className="pressable mt-3 px-4 py-2 min-h-[44px] rounded-lg bg-quest-emerald text-obsidian-950 text-xs font-bold">
              Retry
            </button>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-obsidian-850 border border-white/[0.06] animate-fade-in">
            <div className="text-3xl mb-2">💸</div>
            <p className="text-sm font-bold text-white">No withdrawals found</p>
            <p className="text-xs text-slate-400 mt-1">No requests match this filter{debouncedQuery ? ` for “${debouncedQuery}”` : ''}.</p>
          </div>
        ) : (
          withdrawals.map((w) => (
            <div
              key={w.id}
              className="pressable p-4 rounded-2xl bg-obsidian-850 border border-white/[0.08] space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-black text-white font-mono">
                      {w.netAmount.toFixed(2)} {w.currency}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[10px] text-slate-300 font-bold uppercase">
                      {w.network}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        w.status === 'PAID'
                          ? 'bg-quest-emerald/20 text-quest-emerald'
                          : w.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-quest-amber/20 text-quest-amber'
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono break-all">
                    To: {w.destinationAddress}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-300 font-semibold">
                    @{w.user?.telegramUsername} (Score: {w.user?.trustScore})
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Requested: {new Date(w.requestedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {w.status !== 'PAID' && w.status !== 'REJECTED' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-white/[0.04]">
                  <button
                    onClick={() => handleProcess(w.id, 'REJECT')}
                    disabled={processingId === w.id}
                    className="pressable px-3 py-2 min-h-[44px] rounded-lg border border-white/[0.1] text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                  >
                    Reject & return funds
                  </button>
                  <button
                    onClick={() => setConfirmPay(w)}
                    disabled={processingId === w.id}
                    className="pressable px-3.5 py-2 min-h-[44px] rounded-lg bg-quest-emerald text-obsidian-950 text-xs font-bold shadow-md shadow-quest-emerald/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {processingId === w.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Authorize & Execute Payout</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        {nextCursor && !loading && (
          <button
            onClick={() => fetchWithdrawals(false)}
            disabled={loadingMore}
            className="pressable w-full py-3 min-h-[48px] rounded-xl border border-white/[0.1] text-xs font-bold text-slate-200 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load more withdrawals
          </button>
        )}
      </div>

      {/* Pay confirmation sheet — explicit tx hash, no prompt() */}
      {confirmPay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in" onClick={() => setConfirmPay(null)}>
          <div className="w-full sm:max-w-md bg-obsidian-900 border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-slide-up sm:animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-1">
              Pay {confirmPay.netAmount.toFixed(2)} {confirmPay.currency}?
            </h3>
            <p className="text-xs text-slate-400 mb-1 font-mono break-all">To: {confirmPay.destinationAddress}</p>
            <p className="text-xs text-slate-400 mb-4">
              @{confirmPay.user?.telegramUsername} · Trust {confirmPay.user?.trustScore} · Gross {confirmPay.amount.toFixed(2)} (fee {confirmPay.feeAmount.toFixed(2)})
            </p>
            <label className="block text-xs font-semibold text-slate-300 mb-1">On-chain transaction hash (blank = sandbox record)</label>
            <input
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x…"
              className="w-full min-h-[48px] bg-obsidian-850 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-quest-emerald mb-4"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => { setConfirmPay(null); setTxHash(''); }}
                className="pressable flex-1 px-4 py-3 min-h-[48px] rounded-xl border border-white/[0.1] text-sm text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcess(confirmPay.id, 'PAY', txHash.trim() || undefined)}
                disabled={processingId === confirmPay.id}
                className="pressable flex-1 px-4 py-3 min-h-[48px] rounded-xl bg-quest-emerald text-obsidian-950 text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {processingId === confirmPay.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
