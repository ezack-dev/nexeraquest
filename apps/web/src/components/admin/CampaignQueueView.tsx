'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Pause, Play, ShieldAlert, Layers, Search, ArrowDownWideNarrow, Loader2 } from 'lucide-react';

interface CampaignQueueViewProps {
  onActionComplete: () => void;
}

export function CampaignQueueView({ onActionComplete }: CampaignQueueViewProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    fetchCampaigns(true);
  }, [filter, debouncedQuery, sort]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const fetchCampaigns = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }
    try {
      const params = new URLSearchParams({ status: filter, sort });
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (!reset && nextCursor) params.set('cursor', nextCursor);
      const res = await fetch(`/api/v1/admin/campaigns?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed to load queue');
      setCampaigns((prev) => (reset ? data.data : [...prev, ...data.data]));
      setNextCursor(data.meta?.nextCursor || null);
    } catch (err: any) {
      if (reset) setError(err.message);
      else showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleReview = async (id: string, action: string) => {
    const reason = prompt(`Reason for ${action}:`, 'Admin verified compliance with NexeraQuest policies');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/v1/admin/campaigns/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Action failed');
      showToast(`Campaign ${action.toLowerCase()} completed.`);
      fetchCampaigns(true);
      onActionComplete();
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
      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns or projects…"
            className="w-full min-h-[44px] bg-obsidian-850 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-amber"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-obsidian-850 border border-white/[0.08] text-xs shrink-0">
          <ArrowDownWideNarrow className="w-3.5 h-3.5 text-slate-500 ml-2" />
          {([
            ['newest', 'Newest'],
            ['budget', 'Budget'],
            ['progress', 'Progress'],
          ] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setSort(v)}
              className={`pressable px-3 py-2 min-h-[40px] rounded-lg font-semibold transition-all ${
                sort === v ? 'bg-quest-amber text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Filter */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-obsidian-850 border border-white/[0.08] text-xs overflow-x-auto">
          {['ALL', 'UNDER_REVIEW', 'LIVE', 'PAUSED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`pressable px-3 py-2 min-h-[40px] rounded-lg font-semibold transition-all whitespace-nowrap ${
                filter === st ? 'bg-quest-amber text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-mono tabular-nums shrink-0">{campaigns.length} shown</span>
      </div>

      {/* Campaigns Queue Table */}
      <div className="space-y-3 stagger" key={`${filter}-${sort}-${debouncedQuery}`}>
        {loading ? (
          <>
            <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-32" />
            <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-32" />
          </>
        ) : error ? (
          <div className="p-6 text-center rounded-2xl bg-obsidian-850 border border-rose-500/20 animate-fade-in">
            <p className="text-xs font-bold text-rose-400">Couldn't load queue</p>
            <p className="text-[11px] text-slate-400 mt-1">{error}</p>
            <button onClick={() => fetchCampaigns(true)} className="pressable mt-3 px-4 py-2 min-h-[44px] rounded-lg bg-quest-amber text-obsidian-950 text-xs font-bold">
              Retry
            </button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-obsidian-850 border border-white/[0.06] animate-fade-in">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm font-bold text-white">Queue clear</p>
            <p className="text-xs text-slate-400 mt-1">No campaigns match this filter{debouncedQuery ? ` for “${debouncedQuery}”` : ''}.</p>
          </div>
        ) : (
          campaigns.map((c) => (
            <div
              key={c.id}
              className="pressable p-4 rounded-2xl bg-obsidian-850 border border-white/[0.08] space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={c.project?.logoUrl || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=128'}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-white/[0.1]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{c.title}</h4>
                      <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[10px] text-slate-300 uppercase tracking-wide">
                        {c.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{c.project?.name} • Category: {c.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-quest-emerald font-mono">
                    {c.totalBudget.toFixed(2)} {c.currency}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Fee: {c.platformFee.toFixed(2)} {c.currency}
                  </span>
                </div>
              </div>

              {/* Task Details */}
              {c.tasks?.[0] && (
                <div className="p-3 rounded-xl bg-obsidian-900 border border-white/[0.04] text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-white">Task: {c.tasks[0].title}</span>
                    <span className="text-quest-cyan font-mono">{c.tasks[0].verificationAdapter}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{c.tasks[0].instructions}</p>
                </div>
              )}

              {/* Operator Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-white/[0.04]">
                {c.status !== 'LIVE' && (
                  <button
                    onClick={() => handleReview(c.id, 'APPROVE')}
                    className="pressable px-3 py-2 min-h-[44px] rounded-lg bg-quest-emerald/15 hover:bg-quest-emerald/25 text-quest-emerald text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Launch</span>
                  </button>
                )}

                {c.status === 'LIVE' && (
                  <button
                    onClick={() => handleReview(c.id, 'PAUSE')}
                    className="pressable px-3 py-2 min-h-[44px] rounded-lg bg-quest-amber/15 hover:bg-quest-amber/25 text-quest-amber text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}

                {c.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleReview(c.id, 'REJECT')}
                    className="pressable px-3 py-2 min-h-[44px] rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {nextCursor && !loading && (
          <button
            onClick={() => fetchCampaigns(false)}
            disabled={loadingMore}
            className="pressable w-full py-3 min-h-[48px] rounded-xl border border-white/[0.1] text-xs font-bold text-slate-200 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load more campaigns
          </button>
        )}
      </div>
    </div>
  );
}
