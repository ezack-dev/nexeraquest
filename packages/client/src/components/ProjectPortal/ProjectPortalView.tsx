import React, { useState, useEffect } from 'react';
import { Campaign, Project } from '../../types.js';
import { api } from '../../api.js';
import { CreateCampaignModal } from './CreateCampaignModal.js';
import { ExportModal } from './ExportModal.js';
import {
  Plus,
  Users,
  ShieldCheck,
  Download,
  CheckCircle2,
  DollarSign,
  Activity,
  AlertCircle,
} from 'lucide-react';

export const ProjectPortalView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [exportCampaign, setExportCampaign] = useState<Campaign | null>(null);
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<Campaign | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string }>({
    id: '',
    name: 'All Projects',
  });

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const [data, projList] = await Promise.all([
        api.getCampaigns('ALL', undefined, undefined, 'ALL'),
        api.getProjects(),
      ]);
      setCampaigns(data);
      setProjects(projList);

      if (projList.length > 0 && !selectedProject.id) {
        setSelectedProject({
          id: projList[0].id,
          name: projList[0].name,
        });
      }
    } catch (err) {
      console.error('Failed to load project campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const executeCloseCampaign = async (camp: Campaign) => {
    try {
      setClosingId(camp.id);
      const res = await api.closeCampaign(camp.id);
      setBanner({ type: 'success', text: res.message });
      setConfirmCloseTarget(null);
      await fetchCampaigns();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to close campaign' });
    } finally {
      setClosingId(null);
    }
  };

  const projectCampaigns = campaigns.filter(
    (c) => !selectedProject.id || c.projectId === selectedProject.id
  );

  const visibleCampaigns = projectCampaigns.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const totalCompletedActions = projectCampaigns.reduce((sum, c) => sum + c.completedSlots, 0);
  const totalTargetSlots = projectCampaigns.reduce((sum, c) => sum + c.targetSlots, 0);
  const totalBudgetSpent = projectCampaigns.reduce(
    (sum, c) => sum + c.completedSlots * c.rewardPerAction,
    0
  );
  const activeEscrowLocked = projectCampaigns
    .filter((c) => c.status !== 'CLOSED' && c.status !== 'REJECTED')
    .reduce((sum, c) => sum + Math.max(0, (c.targetSlots - c.completedSlots) * c.rewardPerAction), 0);

  const sponsorInitials = (selectedProject.name || 'SP')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 bg-[#13151B] border border-white/[0.08] rounded-2xl">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#3390EC]/15 text-[#3390EC] border border-[#3390EC]/25 flex items-center justify-center font-bold text-sm shrink-0">
            {sponsorInitials}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-white tracking-[-0.02em]">
              Sponsor Dashboard
            </h1>
            <p className="text-[13px] text-zinc-400 mt-0.5">
              Launch pre-funded campaigns, monitor completion, and export participants.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {projects.length > 0 && (
            <div>
              <label htmlFor="project-selector" className="sr-only">
                Select Project Sponsor
              </label>
              <select
                id="project-selector"
                name="selectedProject"
                value={selectedProject.id}
                onChange={(e) => {
                  const chosen = projects.find((p) => p.id === e.target.value);
                  if (chosen) setSelectedProject({ id: chosen.id, name: chosen.name });
                }}
                className="w-full sm:w-auto bg-[#0E1015] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-zinc-100 focus:outline-none focus:border-[#3390EC] min-h-[42px]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-4 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl text-[13px] transition flex items-center justify-center gap-1.5 shrink-0 min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {banner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-[13px] ${
            banner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="break-words">{banner.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs text-zinc-400 hover:text-white font-medium shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Telemetry KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-[#13151B] border border-white/[0.07] rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Verified Actions</span>
            <Users className="w-4 h-4 text-[#3390EC] shrink-0" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
              {totalCompletedActions}
            </span>
            <span className="text-xs text-zinc-500 font-mono tabular-nums">/ {totalTargetSlots}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-[#13151B] border border-white/[0.07] rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Active Escrow</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              ${activeEscrowLocked.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-500 font-mono">USDT</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-[#13151B] border border-white/[0.07] rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Paid Out</span>
            <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono tabular-nums">
              ${totalBudgetSpent.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-500 font-mono">USDT</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-[#13151B] border border-white/[0.07] rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Live Campaigns</span>
            <Activity className="w-4 h-4 text-zinc-300 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
              {projectCampaigns.filter((c) => c.status === 'ACTIVE').length}
            </span>
            <span className="text-xs text-zinc-500">active</span>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-[#13151B] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm sm:text-base font-semibold text-white">Campaigns</h2>
          <div className="flex items-center gap-1 p-0.5 bg-[#0E1015] border border-white/[0.07] rounded-lg">
            {(['ALL', 'ACTIVE', 'CLOSED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  statusFilter === status
                    ? 'bg-white/[0.1] text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Closed'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[13px] text-zinc-500">Loading campaigns...</div>
        ) : visibleCampaigns.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-zinc-400">
            No campaigns found in this view.
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/[0.06]">
              {visibleCampaigns.map((camp) => {
                const fillPct = Math.min(100, (camp.completedSlots / camp.targetSlots) * 100);
                return (
                  <div key={camp.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[11px] text-zinc-400 capitalize">
                            {camp.category.toLowerCase()}
                          </span>
                          <span className="text-zinc-600">·</span>
                          <span
                            className={`text-[11px] font-medium ${
                              camp.status === 'ACTIVE'
                                ? 'text-emerald-400'
                                : camp.status === 'CLOSED'
                                ? 'text-zinc-500'
                                : 'text-amber-400'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white break-words">{camp.title}</h3>
                      </div>
                      <span className="font-mono font-semibold text-emerald-400 text-xs tabular-nums shrink-0">
                        ${camp.rewardPerAction.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-zinc-400 tabular-nums">
                        <span>
                          {camp.completedSlots} / {camp.targetSlots} completed
                        </span>
                        <span>${camp.rewardPool.toFixed(2)} pool</span>
                      </div>
                      <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#3390EC] h-full rounded-full"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setExportCampaign(camp)}
                        className="flex-1 py-2 px-3 bg-[#191C24] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-200 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1.5 min-h-[38px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export</span>
                      </button>
                      {camp.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => setConfirmCloseTarget(camp)}
                          className="flex-1 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 rounded-xl text-xs font-medium min-h-[38px]"
                        >
                          Close & Refund
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#0E1015] text-zinc-400 text-xs border-b border-white/[0.07]">
                  <tr>
                    <th className="p-4 font-medium">Campaign</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Reward</th>
                    <th className="p-4 font-medium">Progress</th>
                    <th className="p-4 font-medium">Pool</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  {visibleCampaigns.map((camp) => {
                    const fillPct = Math.min(100, (camp.completedSlots / camp.targetSlots) * 100);

                    return (
                      <tr key={camp.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 font-medium text-white max-w-xs truncate">{camp.title}</td>
                        <td className="p-4 text-xs text-zinc-400 capitalize">
                          {camp.category.toLowerCase()}
                        </td>
                        <td className="p-4 font-mono font-medium text-emerald-400 tabular-nums">
                          {camp.rewardPerAction.toFixed(2)} USDT
                        </td>
                        <td className="p-4">
                          <div className="space-y-1.5 w-32">
                            <div className="flex justify-between text-[11px] font-mono text-zinc-400 tabular-nums">
                              <span>{camp.completedSlots}</span>
                              <span>{camp.targetSlots}</span>
                            </div>
                            <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#3390EC] h-full rounded-full"
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-zinc-200 tabular-nums">
                          ${camp.rewardPool.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              camp.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : camp.status === 'CLOSED'
                                ? 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExportCampaign(camp)}
                            className="px-2.5 py-1.5 bg-[#191C24] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-200 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                          </button>

                          {camp.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => setConfirmCloseTarget(camp)}
                              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 rounded-lg text-xs font-medium transition inline-flex items-center"
                            >
                              <span>Close & Refund</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Inline Close Confirmation */}
      {confirmCloseTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmCloseTarget(null);
          }}
        >
          <div className="w-full max-w-md bg-[#13151B] border-t sm:border border-white/[0.1] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <h3 className="text-base font-semibold text-white">Close Campaign & Refund</h3>
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              Closing <strong className="text-zinc-200">{confirmCloseTarget.title}</strong> stops new claims and refunds{' '}
              <strong className="text-emerald-400 font-mono tabular-nums">
                $
                {(
                  Math.max(0, confirmCloseTarget.targetSlots - confirmCloseTarget.completedSlots) *
                  confirmCloseTarget.rewardPerAction
                ).toFixed(2)}{' '}
                USDT
              </strong>{' '}
              for the {Math.max(0, confirmCloseTarget.targetSlots - confirmCloseTarget.completedSlots)} remaining spots.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmCloseTarget(null)}
                className="flex-1 py-2.5 bg-[#191C24] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-200 rounded-xl text-xs font-medium min-h-[42px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={closingId === confirmCloseTarget.id}
                onClick={() => executeCloseCampaign(confirmCloseTarget)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold min-h-[42px]"
              >
                {closingId === confirmCloseTarget.id ? 'Closing...' : 'Confirm Close & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateCampaignModal
          projectId={selectedProject.id || (campaigns[0]?.projectId ?? 'demo_proj')}
          projectName={selectedProject.name}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => fetchCampaigns()}
        />
      )}

      {exportCampaign && (
        <ExportModal
          campaignId={exportCampaign.id}
          campaignTitle={exportCampaign.title}
          onClose={() => setExportCampaign(null)}
        />
      )}
    </div>
  );
};
