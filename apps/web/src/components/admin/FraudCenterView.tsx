'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, UserX, UserCheck, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';

export function FraudCenterView() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    fetchFraudCases(true);
  }, [debouncedQuery, sort]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const fetchFraudCases = async (reset = false) => {
    if (reset) { setLoading(true); setError(null); }
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ sort });
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (!reset && nextCursor) params.set('cursor', nextCursor);
      const res = await fetch(`/api/v1/admin/fraud?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed to load cases');
      setCases((prev) => (reset ? data.data : [...prev, ...data.data]));
      setNextCursor(data.meta?.nextCursor || null);
    } catch (err: any) {
      if (reset) setError(err.message);
      else showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFreeze = async (userId: string, action: 'FREEZE' | 'UNFREEZE') => {
    try {
      const res = await fetch('/api/v1/admin/fraud/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, reason: 'Operator fraud mitigation' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Action failed');
      showToast(`Contributor ${action === 'FREEZE' ? 'frozen' : 'unfrozen'}.`);
      fetchFraudCases(true);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleResolveCase = async (caseId: string, resolution: 'DISMISSED' | 'CONFIRMED') => {
    const notes = prompt(`Resolution notes for case:`, resolution === 'CONFIRMED' ? 'Confirmed sybil botting' : 'Dismissed false positive');
    if (notes === null) return;

    try {
      const res = await fetch(`/api/v1/admin/fraud/${caseId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to resolve case');
      showToast(`Case marked as ${resolution.toLowerCase()}.`);
      fetchFraudCases(true);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sybil & Risk Intelligence</h2>
          <p className="text-xs text-slate-400">Heuristic fraud detection engine flagging abnormal velocity and clusters</p>
        </div>
        <span className="text-xs text-rose-400 font-mono font-bold tabular-nums">{cases.length} shown</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username or Telegram ID…"
            className="w-full min-h-[44px] bg-obsidian-850 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-obsidian-850 border border-white/[0.08] text-xs shrink-0">
          {([['newest', 'Newest'], ['risk', 'Risk']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setSort(v)}
              className={`pressable px-3 py-2 min-h-[40px] rounded-lg font-semibold transition-all ${
                sort === v ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 stagger" key={sort + debouncedQuery}>
        {loading ? (
          <>
            <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-32" />
            <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-32" />
          </>
        ) : error ? (
          <div className="p-6 text-center rounded-2xl bg-obsidian-850 border border-rose-500/20 animate-fade-in">
            <p className="text-xs font-bold text-rose-400">Couldn't load cases</p>
            <p className="text-[11px] text-slate-400 mt-1">{error}</p>
            <button onClick={() => fetchFraudCases(true)} className="pressable mt-3 px-4 py-2 min-h-[44px] rounded-lg bg-rose-500 text-white text-xs font-bold">
              Retry
            </button>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-obsidian-850 border border-white/[0.06] animate-fade-in">
            <div className="text-3xl mb-2">🛡️</div>
            <p className="text-sm font-bold text-white">No cases found</p>
            <p className="text-xs text-slate-400 mt-1">System risk score: NORMAL{debouncedQuery ? ` for “${debouncedQuery}”` : ''}.</p>
          </div>
        ) : (
          cases.map((fc) => (
            <div
              key={fc.id}
              className="pressable p-4 rounded-2xl bg-obsidian-850 border border-rose-500/20 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      fc.severity === 'CRITICAL'
                        ? 'bg-rose-500 text-white'
                        : fc.severity === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-quest-amber/20 text-quest-amber'
                    }`}
                  >
                    {fc.severity} RISK
                  </span>
                  <span className="text-xs font-mono font-bold text-white">Score: {fc.riskScore}/100</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-300">
                    User: @{fc.user?.telegramUsername || fc.user?.telegramId || 'unknown'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      fc.user?.status === 'SUSPENDED' ? 'bg-rose-500/20 text-rose-400' : 'bg-quest-emerald/20 text-quest-emerald'
                    }`}
                  >
                    {fc.user?.status}
                  </span>
                </div>

                <span className="text-xs text-slate-400 font-mono">Case #{fc.id.slice(0, 10)}</span>
              </div>

              {/* Signals */}
              <div className="space-y-1.5 p-3 rounded-xl bg-obsidian-900 border border-white/[0.04]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Detected Signals
                </span>
                {fc.signals?.map((sig: any) => (
                  <div key={sig.id} className="text-xs flex items-center justify-between text-slate-300">
                    <span>{sig.details}</span>
                    <span className="text-rose-400 font-mono font-bold text-[11px]">+{sig.weight}pts</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-1 border-t border-white/[0.04]">
                {fc.user?.status !== 'SUSPENDED' ? (
                  <button
                    onClick={() => handleFreeze(fc.userId, 'FREEZE')}
                    className="pressable px-3 py-2 min-h-[44px] rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Freeze Contributor</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleFreeze(fc.userId, 'UNFREEZE')}
                    className="pressable px-3 py-2 min-h-[44px] rounded-lg bg-quest-emerald/15 hover:bg-quest-emerald/25 text-quest-emerald text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Unfreeze Contributor</span>
                  </button>
                )}

                <button
                  onClick={() => handleResolveCase(fc.id, 'DISMISSED')}
                  className="pressable px-3 py-2 min-h-[44px] rounded-lg border border-white/[0.1] hover:bg-white/[0.05] text-slate-300 text-xs font-semibold transition-colors"
                >
                  Dismiss (False Positive)
                </button>

                <button
                  onClick={() => handleResolveCase(fc.id, 'CONFIRMED')}
                  className="pressable px-3 py-2 min-h-[44px] rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
                >
                  Confirm Fraud
                </button>
              </div>
            </div>
          ))
        )}
        {nextCursor && !loading && (
          <button
            onClick={() => fetchFraudCases(false)}
            disabled={loadingMore}
            className="pressable w-full py-3 min-h-[48px] rounded-xl border border-white/[0.1] text-xs font-bold text-slate-200 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load more cases
          </button>
        )}
      </div>
    </div>
  );
}
