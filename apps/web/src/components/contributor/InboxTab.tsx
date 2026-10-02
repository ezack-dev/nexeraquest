'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCheck, Megaphone, Coins, ShieldAlert, PauseCircle, XCircle } from 'lucide-react';

const ICONS: Record<string, any> = {
  REWARD_CREDITED: Coins,
  CAMPAIGN_PAUSED: PauseCircle,
  CAMPAIGN_CLOSED: XCircle,
  WITHDRAWAL_PAID: Coins,
  FRAUD_FLAG: ShieldAlert,
};

export function InboxTab() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/notifications');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed to load inbox');
      setItems(data.data.notifications);
      setUnread(data.data.unreadCount);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/v1/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
    } catch {
      // ignore
    }
  };

  const openItem = async (n: any) => {
    if (['QUEUED', 'SENT'].includes(n.status)) {
      fetch('/api/v1/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: n.id }),
      }).catch(() => null);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, status: 'READ' } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Inbox
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-quest-violet text-white text-[10px] font-black tabular-nums">
              {unread}
            </span>
          )}
        </h2>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="pressable flex items-center gap-1 text-[11px] text-quest-cyan font-semibold px-2 py-1.5 min-h-[40px]"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-obsidian-850 border border-white/[0.06] skeleton-shimmer h-20" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center rounded-2xl bg-obsidian-850 border border-rose-500/20 animate-fade-in">
          <p className="text-xs font-bold text-rose-400">Couldn't load inbox</p>
          <p className="text-[11px] text-slate-400 mt-1">{error}</p>
          <button onClick={fetchInbox} className="pressable mt-3 px-4 py-2 min-h-[44px] rounded-lg bg-quest-violet text-white text-xs font-bold">
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] animate-fade-in">
          <BellRing className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-white mb-1">All caught up</h3>
          <p className="text-[11px] text-slate-400">Quest approvals, payouts, and campaign updates land here.</p>
        </div>
      ) : (
        <div className="space-y-2.5 stagger tab-enter" key={items.length}>
          {items.map((n) => {
            const Icon = ICONS[n.templateKey] || Megaphone;
            const isUnread = ['QUEUED', 'SENT'].includes(n.status);
            return (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className={`pressable w-full text-left p-3.5 rounded-xl border space-y-1 transition-colors ${
                  isUnread
                    ? 'bg-obsidian-850 border-quest-violet/30'
                    : 'bg-obsidian-850/60 border-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 shrink-0 ${isUnread ? 'text-quest-violet' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold flex-1 truncate ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                    {n.title}
                  </span>
                  {isUnread && <span className="w-2 h-2 rounded-full bg-quest-violet shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{n.messageBody}</p>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
