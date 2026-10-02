'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle, ExternalLink, ShieldAlert, Scale, Timer } from 'lucide-react';

function useCountdown(target: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const ms = new Date(target).getTime() - now;
  if (ms <= 0) return 'Expired';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function MyQuestsTab() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'disputed'>('all');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [appealFor, setAppealFor] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/tasks/my?filter=${filter}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed to load quests');
      setTasks(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const submitAppeal = async (taskInstanceId: string) => {
    if (!appealReason.trim()) {
      showToast('Please explain why this deserves re-review.');
      return;
    }
    try {
      const res = await fetch('/api/v1/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskInstanceId, reason: appealReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Appeal failed');
      showToast('Appeal submitted — an operator will re-review your proof.');
      setAppealFor(null);
      setAppealReason('');
      fetchTasks();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {toast && (
        <div className="sticky top-2 z-30 px-4 py-3 rounded-xl bg-obsidian-850 border border-quest-violet/40 text-xs text-white shadow-xl animate-fade-up" role="status">
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">My Quest History</h2>
        <span className="text-xs text-slate-400 font-mono tabular-nums">{tasks.length} Records</span>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-obsidian-850 border border-white/[0.06] text-xs" role="tablist">
        {(['all', 'active', 'completed', 'disputed'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={filter === tab}
            onClick={() => setFilter(tab)}
            className={`pressable py-2 min-h-[40px] rounded-lg font-semibold capitalize transition-all ${
              filter === tab ? 'bg-quest-violet text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-2.5" key={filter}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-24" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center rounded-2xl bg-obsidian-850 border border-rose-500/20 animate-fade-in">
          <p className="text-xs font-bold text-rose-400">Couldn't load quests</p>
          <p className="text-[11px] text-slate-400 mt-1">{error}</p>
          <button onClick={fetchTasks} className="pressable mt-3 px-4 py-2 min-h-[44px] rounded-lg bg-quest-violet text-white text-xs font-bold">
            Retry
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] animate-fade-in">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-white mb-1">No Quests in this Category</h3>
          <p className="text-[11px] text-slate-400">
            Browse the marketplace to start your first verified task!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 stagger tab-enter" key={filter}>
          {tasks.map((inst) => {
            const isApproved = inst.status === 'APPROVED';
            const isRejected = inst.status === 'REJECTED';
            const isLive = ['IN_PROGRESS', 'SUBMISSION_REQUIRED', 'STARTING'].includes(inst.status);
            return (
              <QuestRow
                key={inst.id}
                inst={inst}
                isApproved={isApproved}
                isRejected={isRejected}
                isLive={isLive}
                appealFor={appealFor}
                appealReason={appealReason}
                setAppealFor={setAppealFor}
                setAppealReason={setAppealReason}
                submitAppeal={submitAppeal}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuestRow({ inst, isApproved, isRejected, isLive, appealFor, appealReason, setAppealFor, setAppealReason, submitAppeal }: any) {
  const countdown = useCountdown(isLive ? inst.expiresAt : null);
  return (
    <div className="pressable p-3.5 rounded-xl bg-obsidian-850 border border-white/[0.06] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-slate-400 truncate">
          {inst.campaign?.project?.name}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
            isApproved
              ? 'bg-quest-emerald/15 text-quest-emerald'
              : isRejected
              ? 'bg-rose-500/15 text-rose-400'
              : 'bg-quest-amber/15 text-quest-amber'
          }`}
        >
          {inst.status}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-white truncate min-w-0">
          {inst.task?.title}
        </h4>
        <span className="text-xs font-bold text-quest-emerald font-mono shrink-0 tabular-nums">
          +{inst.campaign?.rewardPerAction} {inst.campaign?.currency}
        </span>
      </div>

      {isLive && countdown && (
        <div className="flex items-center gap-1.5 text-[11px] text-quest-amber font-semibold">
          <Timer className="w-3.5 h-3.5" />
          <span className="font-mono tabular-nums">{countdown === 'Expired' ? 'Time expired — verify now' : `${countdown} left`}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-white/[0.04]">
        <span>Started {new Date(inst.startedAt).toLocaleDateString()}</span>
        {inst.completedAt && (
          <span className="text-slate-400">
            Completed {new Date(inst.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {isRejected && (
        <div className="pt-1">
          {appealFor === inst.id ? (
            <div className="space-y-2 animate-fade-in">
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Explain why this deserves re-review…"
                rows={2}
                className="w-full bg-obsidian-900 border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-amber"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => submitAppeal(inst.id)}
                  className="pressable flex-1 px-3 py-2 min-h-[44px] rounded-lg bg-quest-amber text-obsidian-950 text-xs font-bold"
                >
                  Submit appeal
                </button>
                <button
                  onClick={() => { setAppealFor(null); setAppealReason(''); }}
                  className="pressable px-3 py-2 min-h-[44px] rounded-lg border border-white/[0.1] text-xs text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAppealFor(inst.id)}
              className="pressable w-full py-2 min-h-[44px] rounded-lg border border-quest-amber/40 text-xs font-semibold text-quest-amber hover:bg-quest-amber/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5" />
              Appeal decision
            </button>
          )}
        </div>
      )}
    </div>
  );
}
