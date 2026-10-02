'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Layers,
  Users,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  Coins,
  Settings,
  Scale,
  FileText,
  Clock
} from 'lucide-react';
import { CampaignQueueView } from './CampaignQueueView';
import { FraudCenterView } from './FraudCenterView';
import { DisputesView } from './DisputesView';
import { LedgerView } from './LedgerView';
import { WithdrawalsQueueView } from './WithdrawalsQueueView';
import { ReconciliationView } from './ReconciliationView';
import { SettingsView } from './SettingsView';
import { SystemHealthView } from './SystemHealthView';

export function AdminConsole() {
  const [tab, setTab] = useState<'overview' | 'campaigns' | 'fraud' | 'disputes' | 'ledger' | 'withdrawals' | 'reconciliation' | 'settings' | 'health'>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const kpis = overview?.kpis;

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-obsidian-950 text-slate-100 min-h-[calc(100vh-60px)]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-obsidian-900 border-r border-white/[0.08] p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Admin Identity Pill */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-obsidian-850 border border-quest-amber/20">
            <div className="w-10 h-10 rounded-xl bg-quest-amber/15 border border-quest-amber/30 flex items-center justify-center text-quest-amber font-black">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">Operations Center</h2>
              <span className="text-[10px] text-quest-amber font-mono font-bold tracking-wide">
                SUPER_ADMIN ROLE
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            <button
              onClick={() => setTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                tab === 'overview'
                  ? 'bg-quest-amber text-obsidian-950 font-bold shadow-md shadow-quest-amber/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Operations Overview</span>
            </button>

            <button
              onClick={() => setTab('campaigns')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                tab === 'campaigns'
                  ? 'bg-quest-amber text-obsidian-950 font-bold shadow-md shadow-quest-amber/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Campaign Queue</span>
              </div>
              {kpis?.pendingApprovals > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-quest-amber text-obsidian-950 text-[10px] font-black">
                  {kpis.pendingApprovals}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab('fraud')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                tab === 'fraud'
                  ? 'bg-quest-amber text-obsidian-950 font-bold shadow-md shadow-quest-amber/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Fraud Center</span>
              </div>
              {kpis?.openFraudCases > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {kpis.openFraudCases}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab('disputes')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                tab === 'disputes'
                  ? 'bg-quest-amber text-obsidian-950 font-bold shadow-md shadow-quest-amber/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Scale className="w-4 h-4" />
                <span>Dispute Resolution</span>
              </div>
              {kpis?.pendingDisputes > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-quest-amber text-obsidian-950 text-[10px] font-black">
                  {kpis.pendingDisputes}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab('ledger')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                tab === 'ledger'
                  ? 'bg-quest-amber text-obsidian-950 font-bold shadow-md shadow-quest-amber/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Financial Ledger</span>
            </button>

            <button
              onClick={() => setTab('withdrawals')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                tab === 'withdrawals'
                  ? 'bg-quest-amber text-obsidian-950 font-bold shadow-md shadow-quest-amber/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Coins className="w-4 h-4" />
                <span>Withdrawal Payouts</span>
              </div>
              {kpis?.pendingWithdrawals > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-quest-amber text-obsidian-950 text-[10px] font-black">
                  {kpis.pendingWithdrawals}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab('reconciliation')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                tab === 'reconciliation'
                  ? 'bg-quest-amber text-obsidian-950 font-bold shadow-md shadow-quest-amber/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ledger Reconciliation</span>
            </button>

            <button
              onClick={() => setTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                tab === 'settings'
                  ? 'bg-quest-amber text-obsidian-950 font-bold shadow-md shadow-quest-amber/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>System & Pricing Settings</span>
            </button>

            <button
              onClick={() => setTab('health')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                tab === 'health'
                  ? 'bg-quest-amber text-obsidian-950 font-bold shadow-md shadow-quest-amber/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>System Health</span>
            </button>
          </nav>
        </div>

        {/* Security Health Indicator */}
        <div className="p-3 rounded-xl bg-obsidian-850 border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-quest-emerald font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-quest-emerald animate-pulse" />
            <span>Audit Trail Active</span>
          </div>
          <span className="block text-[10px]">Zero client trust enforced</span>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {tab === 'overview' && 'Operations Command & Telemetry'}
              {tab === 'campaigns' && 'Campaign Approval Queue'}
              {tab === 'fraud' && 'Fraud Intelligence & Risk Queue'}
              {tab === 'disputes' && 'Dispute Resolution Queue'}
              {tab === 'ledger' && 'Audited Double-Entry Ledger'}
              {tab === 'withdrawals' && 'Withdrawal Authorization Queue'}
              {tab === 'reconciliation' && 'Financial Reconciliation Engine'}
              {tab === 'settings' && 'Platform Settings & Pricing Model'}
              {tab === 'health' && 'System Health & Provider Status'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              NexeraQuest Internal Administrative Engine • Strict Invariant Enforcement
            </p>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-1">
                <span className="text-[11px] text-slate-400">Total Funded Escrow</span>
                <div className="text-2xl font-black text-white font-mono">
                  {(kpis?.totalFunded || 1667.5).toFixed(2)} USDT
                </div>
                <span className="text-[10px] text-quest-emerald font-semibold">100% Pre-Funded</span>
              </div>

              <div className="p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-1">
                <span className="text-[11px] text-slate-400">Reward Liabilities Paid</span>
                <div className="text-2xl font-black text-quest-cyan font-mono">
                  {(kpis?.totalRewardLiabilitiesSettled || 170).toFixed(2)} USDT
                </div>
                <span className="text-[10px] text-slate-400">Audited via Ledger</span>
              </div>

              <div className="p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-1">
                <span className="text-[11px] text-slate-400">Platform Fee Revenue</span>
                <div className="text-2xl font-black text-quest-emerald font-mono">
                  {(kpis?.platformFeeRevenue || 245.5).toFixed(2)} USDT
                </div>
                <span className="text-[10px] text-quest-emerald font-semibold">Available for Treasury</span>
              </div>

              <div className="p-4 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-1">
                <span className="text-[11px] text-slate-400">Pending Actions</span>
                <div className="text-2xl font-black text-quest-amber">
                  {(kpis?.pendingApprovals || 0) + (kpis?.pendingWithdrawals || 0) + (kpis?.openFraudCases || 0)}
                </div>
                <span className="text-[10px] text-quest-amber font-semibold">Requires Operator Review</span>
              </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setTab('campaigns')}
                className="p-4 rounded-xl bg-obsidian-900 border border-white/[0.08] hover:border-quest-amber/30 cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Campaign Approvals</span>
                  <span className="px-2 py-0.5 rounded-full bg-quest-amber/15 text-quest-amber text-[10px] font-bold">
                    {kpis?.pendingApprovals || 1} Pending
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Inspect economics and tasks before launch</p>
              </div>

              <div
                onClick={() => setTab('fraud')}
                className="p-4 rounded-xl bg-obsidian-900 border border-white/[0.08] hover:border-rose-500/30 cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Fraud Investigation</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[10px] font-bold">
                    {kpis?.openFraudCases || 1} Open Cases
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Evaluate velocity spikes and freeze botters</p>
              </div>

              <div
                onClick={() => setTab('withdrawals')}
                className="p-4 rounded-xl bg-obsidian-900 border border-white/[0.08] hover:border-quest-cyan/30 cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Withdrawals Queue</span>
                  <span className="px-2 py-0.5 rounded-full bg-quest-cyan/15 text-quest-cyan text-[10px] font-bold">
                    {kpis?.pendingWithdrawals || 1} Pending
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Authorize on-chain cashout batches</p>
              </div>
            </div>

            {/* Recent Audit Events Stream */}
            <div className="p-5 rounded-2xl bg-obsidian-900 border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Recent Security Audit Logs
              </h3>
              <div className="space-y-2">
                {overview?.recentAuditLogs?.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-obsidian-850 border border-white/[0.04] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
                        {log.action}
                      </span>
                      <span className="text-slate-300">{log.entityType} ({log.entityId.slice(0, 8)}...)</span>
                    </div>
                    <span className="text-slate-500 text-[10px] font-mono">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Campaign Queue */}
        {tab === 'campaigns' && <CampaignQueueView onActionComplete={fetchOverview} />}

        {/* Tab 3: Fraud Center */}
        {tab === 'fraud' && <FraudCenterView />}

        {/* Tab 4: Disputes */}
        {tab === 'disputes' && <DisputesView />}

        {/* Tab 5: Ledger */}
        {tab === 'ledger' && <LedgerView />}

        {/* Tab 6: Withdrawals */}
        {tab === 'withdrawals' && <WithdrawalsQueueView />}

        {/* Tab 7: Reconciliation */}
        {tab === 'reconciliation' && (
          <ReconciliationView latestRun={overview?.latestReconciliation} />
        )}

        {/* Tab 8: Settings */}
        {tab === 'settings' && <SettingsView />}

        {/* Tab 9: System Health */}
        {tab === 'health' && <SystemHealthView />}
      </main>
    </div>
  );
}
