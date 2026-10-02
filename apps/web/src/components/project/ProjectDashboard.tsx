'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Users,
  BarChart3,
  Coins,
  Settings,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { CampaignCreatorModal } from './CampaignCreatorModal';
import { ParticipantsTable } from './ParticipantsTable';
import { FundingTab } from './FundingTab';

export function ProjectDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'participants' | 'analytics' | 'funding' | 'settings'>('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/project/overview');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const project = data?.project;
  const stats = data?.stats;
  const funnel = data?.funnel;
  const metrics = data?.metrics;
  const campaigns = data?.campaigns || [];
  const recentCompletions = data?.recentCompletions || [];
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-obsidian-950 text-slate-100 min-h-[calc(100vh-60px)]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-obsidian-900 border-r border-white/[0.08] p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Project Identity Pill */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-obsidian-850 border border-white/[0.06]">
            <img
              src={project?.logoUrl || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=128'}
              alt={project?.name}
              className="w-10 h-10 rounded-xl object-cover border border-white/[0.1]"
            />
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white truncate">{project?.name || 'TonDeFi Hub'}</h2>
              <div className="flex items-center gap-1 text-[10px] text-quest-cyan font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Protocol</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-quest-cyan text-obsidian-950 font-bold shadow-md shadow-quest-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-quest-cyan text-obsidian-950 font-bold shadow-md shadow-quest-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Campaigns</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                activeTab === 'participants'
                  ? 'bg-quest-cyan text-obsidian-950 font-bold shadow-md shadow-quest-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Participants</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-quest-cyan text-obsidian-950 font-bold shadow-md shadow-quest-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Funnel Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('funding')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                activeTab === 'funding'
                  ? 'bg-quest-cyan text-obsidian-950 font-bold shadow-md shadow-quest-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Escrow & Funding</span>
            </button>
          </nav>
        </div>

        {/* Create Campaign CTA */}
        <div className="pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => setIsCreatorOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-quest-cyan to-teal-400 text-obsidian-950 font-bold text-xs shadow-lg shadow-quest-cyan/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeTab === 'overview' && 'Campaign Overview & Telemetry'}
              {activeTab === 'campaigns' && 'Managed Campaigns'}
              {activeTab === 'participants' && 'Verified Contributors & Participants'}
              {activeTab === 'analytics' && 'Campaign Conversion Funnel'}
              {activeTab === 'funding' && 'Escrow Accounting & Refunds'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Web3 contributor telemetry backed by pre-funded escrow invariants.
            </p>
          </div>

          <button
            onClick={() => setIsCreatorOpen(true)}
            className="self-start sm:self-auto py-2 px-3.5 rounded-xl bg-quest-cyan text-obsidian-950 font-bold text-xs shadow-md shadow-quest-cyan/20 hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div key={activeTab} className="space-y-6 stagger tab-enter">
            {loading ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] skeleton-shimmer h-24" />
                  ))}
                </div>
                <div className="p-5 rounded-2xl bg-obsidian-900 border border-white/[0.08] skeleton-shimmer h-40" />
              </>
            ) : (
            <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="pressable p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Active Campaigns</span>
                <div className="text-2xl font-black text-white tabular-nums">{stats?.activeCampaigns ?? 0}</div>
                <span className="text-[10px] text-quest-emerald font-semibold">Live in Marketplace</span>
              </div>

              <div className="pressable p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Total Escrow Budget</span>
                <div className="text-2xl font-black text-quest-cyan font-mono tabular-nums">
                  {(stats?.totalBudget ?? 0).toFixed(2)} USDT
                </div>
                <span className="text-[10px] text-slate-400">Pre-funded & audited</span>
              </div>

              <div className="pressable p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Verified Actions</span>
                <div className="text-2xl font-black text-quest-emerald tabular-nums">
                  {stats?.totalVerifiedActions ?? 0}
                </div>
                <span className="text-[10px] text-slate-400">100% verified work</span>
              </div>

              <div className="pressable p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Escrow Remaining</span>
                <div className="text-2xl font-black text-quest-amber font-mono tabular-nums">
                  {(stats?.totalLocked ?? 0).toFixed(2)} USDT
                </div>
                <span className="text-[10px] text-slate-400">Available for rewards</span>
              </div>
            </div>

            {/* Campaign Funnel Telemetry */}
            <div className="p-5 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Contributor Acquisition Funnel
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time progression from start to verified settlement
                  </p>
                </div>
                <span className="text-xs text-quest-cyan font-mono font-semibold">
                  {funnel?.verified ?? 0} Rewarded
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                {[
                  { label: '1. Started', value: funnel?.started ?? 0, cls: 'text-white' },
                  { label: '2. Submitted', value: funnel?.submitted ?? 0, cls: 'text-quest-cyan' },
                  { label: '3. Verified', value: funnel?.verified ?? 0, cls: 'text-quest-violet' },
                  { label: '4. Rewarded', value: funnel?.rewarded ?? 0, cls: 'text-quest-emerald' },
                  { label: '5. Rejected', value: funnel?.rejected ?? 0, cls: 'text-rose-400' },
                  { label: '6. Disputed', value: funnel?.disputed ?? 0, cls: 'text-quest-amber' },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-obsidian-850 border border-white/[0.06] text-center">
                    <span className="text-[10px] text-slate-400 block mb-1">{s.label}</span>
                    <span className={`text-lg font-black tabular-nums ${s.cls}`}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Conversion bars */}
              <div className="space-y-2">
                {(() => {
                  const started = funnel?.started ?? 0;
                  const rows = [
                    { label: 'Start → Submit', pct: started > 0 ? ((funnel?.submitted ?? 0) / started) * 100 : 0 },
                    { label: 'Submit → Verify', pct: (funnel?.submitted ?? 0) > 0 ? ((funnel?.verified ?? 0) / (funnel?.submitted ?? 1)) * 100 : 0 },
                    { label: 'Verify → Reward', pct: (funnel?.verified ?? 0) > 0 ? ((funnel?.rewarded ?? 0) / (funnel?.verified ?? 1)) * 100 : 0 },
                  ];
                  return rows.map((r) => (
                    <div key={r.label} className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="w-28 shrink-0">{r.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-obsidian-950 overflow-hidden border border-white/[0.05]">
                        <div
                          className="h-full bg-gradient-to-r from-quest-violet to-quest-cyan rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(r.pct))}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono">{Math.round(r.pct)}%</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            </>
            )}

            {/* Live Campaigns Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Campaigns
                </h3>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="text-xs text-quest-cyan hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {campaigns.map((camp: any) => {
                  const progress = Math.min(
                    100,
                    Math.round((camp.completedParticipants / camp.targetParticipants) * 100)
                  );
                  return (
                    <div
                      key={camp.id}
                      className="p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[10px] text-slate-300 uppercase tracking-wide">
                            {camp.category}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-quest-emerald/15 text-quest-emerald text-[10px] font-bold">
                            {camp.status}
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono text-quest-emerald">
                          +{camp.rewardPerAction} {camp.currency}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white">{camp.title}</h4>

                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Progress</span>
                          <span>
                            {camp.completedParticipants} / {camp.targetParticipants} ({progress}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-obsidian-950 overflow-hidden border border-white/[0.05]">
                          <div
                            className="h-full bg-gradient-to-r from-quest-cyan to-teal-400 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Campaigns */}
        {activeTab === 'campaigns' && (
          <div className="space-y-3">
            {campaigns.map((camp: any) => (
              <div
                key={camp.id}
                className="p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-quest-cyan/15 text-quest-cyan text-[10px] font-bold uppercase">
                      {camp.category}
                    </span>
                    <h3 className="text-sm font-bold text-white">{camp.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mb-2">{camp.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Reward: +{camp.rewardPerAction} {camp.currency}</span>
                    <span>Completed: {camp.completedParticipants} / {camp.targetParticipants}</span>
                    <span>Status: <span className="font-bold text-white">{camp.status}</span></span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-500 block mb-1">Escrow Budget</span>
                  <span className="text-base font-black text-quest-emerald font-mono">
                    {camp.totalBudget.toFixed(2)} {camp.currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Participants */}
        {activeTab === 'participants' && <ParticipantsTable campaigns={campaigns} />}

        {/* Tab 4: Analytics */}
        {activeTab === 'analytics' && (
          <div key={activeTab} className="p-4 sm:p-6 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-4 stagger tab-enter">
            <div>
              <h3 className="text-sm font-bold text-white">Full Telemetry Metrics</h3>
              <p className="text-xs text-slate-400">
                Every figure below is computed from live database records — never estimated.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="pressable p-4 rounded-xl bg-obsidian-850 border border-white/[0.06]">
                <span className="text-slate-400 block mb-1">Cost Per Verified Action</span>
                <span className="text-xl font-bold text-white font-mono tabular-nums">
                  {metrics?.costPerVerified != null ? `${metrics.costPerVerified.toFixed(2)} USDT` : '—'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Earned spend ÷ verified</span>
              </div>
              <div className="pressable p-4 rounded-xl bg-obsidian-850 border border-white/[0.06]">
                <span className="text-slate-400 block mb-1">Verification Approval Rate</span>
                <span className="text-xl font-bold text-quest-emerald font-mono tabular-nums">
                  {metrics?.approvalRate != null ? `${metrics.approvalRate.toFixed(1)}%` : '—'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {metrics ? `${funnel?.verified ?? 0} of ${(funnel?.verified ?? 0) + (funnel?.rejected ?? 0)} judged` : 'No judgments yet'}
                </span>
              </div>
              <div className="pressable p-4 rounded-xl bg-obsidian-850 border border-white/[0.06]">
                <span className="text-slate-400 block mb-1">Rejection Volume</span>
                <span className="text-xl font-bold text-rose-400 font-mono tabular-nums">
                  {metrics?.totalRejected ?? 0}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Failed verifications</span>
              </div>
              <div className="pressable p-4 rounded-xl bg-obsidian-850 border border-white/[0.06]">
                <span className="text-slate-400 block mb-1">Fraud Signals</span>
                <span className="text-xl font-bold text-quest-amber font-mono tabular-nums">
                  {metrics?.fraudSignals ?? 0}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Across participants</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Funding */}
        {activeTab === 'funding' && (
          <FundingTab stats={stats} campaigns={campaigns} onRefresh={loadOverview} />
        )}
      </main>

      <CampaignCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onSuccess={() => {
          loadOverview();
          setIsCreatorOpen(false);
        }}
      />
    </div>
  );
}
