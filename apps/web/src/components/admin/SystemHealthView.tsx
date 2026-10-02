'use client';

import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react';

export function SystemHealthView() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/health');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Health check failed');
      setHealth(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-4 stagger">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">System Health</h2>
          <p className="text-xs text-slate-400">Database, queues, providers, and reconciliation freshness</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="pressable px-3 py-2 min-h-[44px] rounded-lg border border-white/[0.1] text-xs text-slate-200 flex items-center gap-2 disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {loading ? (
        <>
          <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-24" />
          <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-24" />
        </>
      ) : error ? (
        <div className="p-6 text-center rounded-2xl bg-obsidian-850 border border-rose-500/20 animate-fade-in">
          <p className="text-sm font-bold text-rose-400">Health check failed</p>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
          <button onClick={fetchHealth} className="pressable mt-3 px-4 py-2 min-h-[44px] rounded-lg bg-quest-violet text-white text-xs font-bold">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-fade-up ${health?.healthy ? 'bg-quest-emerald/10 border-quest-emerald/30' : 'bg-quest-amber/10 border-quest-amber/30'}`}>
            <Activity className={`w-6 h-6 ${health?.healthy ? 'text-quest-emerald' : 'text-quest-amber'}`} />
            <div>
              <p className="text-sm font-bold text-white">{health?.healthy ? 'All systems operational' : 'Attention needed — see failing checks below'}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                {Object.entries(health?.queues || {}).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'queues empty'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(health?.checks || {}).map(([name, c]: [string, any]) => (
              <div key={name} className="pressable p-4 rounded-2xl bg-obsidian-850 border border-white/[0.08] flex items-start gap-3">
                {c.ok ? (
                  <CheckCircle2 className="w-5 h-5 text-quest-emerald shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white capitalize">{name}</p>
                  <p className="text-[11px] text-slate-400 break-words">{c.detail || (c.ok ? 'OK' : 'Failing')}</p>
                  {c.latencyMs !== undefined && (
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{c.latencyMs}ms</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
