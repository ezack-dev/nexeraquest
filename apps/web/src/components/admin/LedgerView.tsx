'use client';

import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Filter, ShieldCheck, Search, Loader2, Copy, Check } from 'lucide-react';

export function LedgerView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    fetchLedger(true);
  }, [typeFilter, debouncedQuery]);

  const fetchLedger = async (reset = false) => {
    if (reset) { setLoading(true); setError(null); }
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ type: typeFilter });
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (!reset && nextCursor) params.set('cursor', nextCursor);
      const res = await fetch(`/api/v1/admin/ledger?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed to load ledger');
      setEntries((prev) => (reset ? data.data : [...prev, ...data.data]));
      setNextCursor(data.meta?.nextCursor || null);
    } catch (err: any) {
      if (reset) setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const copyTx = (tx: string) => {
    navigator.clipboard?.writeText(tx).catch(() => null);
    setCopied(tx);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Double-Entry Financial Journal
          </h2>
          <p className="text-xs text-slate-400">
            Immutable transactional journal tracking every satoshi and USDT movement
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tx ID or note…"
              className="w-full min-h-[44px] bg-obsidian-850 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-amber"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="min-h-[44px] bg-obsidian-850 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-quest-amber"
          >
            <option value="ALL">All Entry Types</option>
            <option value="ESCROW_LOCK">Escrow Lock</option>
            <option value="REWARD_CREDIT">Reward Credit</option>
            <option value="FEE_COLLECTION">Platform Fee</option>
            <option value="WITHDRAWAL_REQUEST">Withdrawal Request</option>
            <option value="WITHDRAWAL_PAYOUT">Withdrawal Payout</option>
            <option value="REFUND">Refund</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/[0.08] bg-obsidian-850">
        <table className="w-full text-left text-xs">
          <thead className="bg-obsidian-900 border-b border-white/[0.08] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Reference Note</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Streaming ledger entries...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  <p className="text-xs font-bold text-rose-400">Couldn't load ledger</p>
                  <button onClick={() => fetchLedger(true)} className="mt-2 px-4 py-2 rounded-lg bg-quest-amber text-obsidian-950 text-xs font-bold">
                    Retry
                  </button>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No ledger entries matching filter{debouncedQuery ? ` for “${debouncedQuery}”` : ''}.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                    <button onClick={() => copyTx(e.transactionId)} className="flex items-center gap-1.5 hover:text-white" title="Copy transaction ID">
                      <span className="truncate max-w-[180px]">{e.transactionId}</span>
                      {copied === e.transactionId ? <Check className="w-3 h-3 text-quest-emerald" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wide bg-white/[0.06] text-slate-200 whitespace-nowrap">
                      {e.entryType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-quest-emerald whitespace-nowrap tabular-nums">
                    {e.amount.toFixed(2)} {e.currency}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-sm truncate text-[11px]">
                    {e.referenceNote}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2.5 stagger" key={typeFilter + debouncedQuery}>
        {loading ? (
          <>
            <div className="p-4 rounded-xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-24" />
            <div className="p-4 rounded-xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-24" />
          </>
        ) : entries.length === 0 && !error ? (
          <div className="p-8 text-center rounded-2xl bg-obsidian-850 border border-white/[0.06] animate-fade-in">
            <p className="text-sm font-bold text-white">No entries found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different type or search.</p>
          </div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="pressable p-3.5 rounded-xl bg-obsidian-850 border border-white/[0.08] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-white/[0.06] text-slate-200">
                  {e.entryType}
                </span>
                <span className="font-mono font-bold text-quest-emerald text-sm tabular-nums">
                  {e.amount.toFixed(2)} {e.currency}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-2">{e.referenceNote}</p>
              <div className="flex items-center justify-between">
                <button onClick={() => copyTx(e.transactionId)} className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <span className="truncate max-w-[180px]">{e.transactionId}</span>
                  {copied === e.transactionId ? <Check className="w-3 h-3 text-quest-emerald" /> : <Copy className="w-3 h-3" />}
                </button>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(e.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {nextCursor && !loading && (
        <button
          onClick={() => fetchLedger(false)}
          disabled={loadingMore}
          className="pressable w-full py-3 min-h-[48px] rounded-xl border border-white/[0.1] text-xs font-bold text-slate-200 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Load more entries
        </button>
      )}
    </div>
  );
}
