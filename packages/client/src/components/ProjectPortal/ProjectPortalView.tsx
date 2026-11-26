import React, { useState, useEffect } from 'react';
import { Campaign, Project } from '../../types.js';
import { api } from '../../api.js';
import { CreateCampaignModal } from './CreateCampaignModal.js';
import { ExportModal } from './ExportModal.js';
import {
  Building,
  Plus,
  Users,
  ShieldCheck,
  Download,
  CheckCircle2,
  DollarSign,
  PieChart,
  AlertCircle,
} from 'lucide-react';

export const ProjectPortalView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

  // Filter campaigns by selected project
  const projectCampaigns = campaigns.filter(
    (c) => !selectedProject.id || c.projectId === selectedProject.id
  );

  const totalCompletedActions = projectCampaigns.reduce((sum, c) => sum + c.completedSlots, 0);
  const totalTargetSlots = projectCampaigns.reduce((sum, c) => sum + c.targetSlots, 0);
  const totalBudgetSpent = projectCampaigns.reduce(
    (sum, c) => sum + c.completedSlots * c.rewardPerAction,
    0
  );
  // Active remaining locked escrow (excludes closed/refunded campaigns)
  const activeEscrowLocked = projectCampaigns
    .filter((c) => c.status !== 'CLOSED' && c.status !== 'REJECTED')
    .reduce((sum, c) => sum + Math.max(0, (c.targetSlots - c.completedSlots) * c.rewardPerAction), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header & Project Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 bg-[#111216] border border-zinc-800/90 rounded-2xl">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#171920] text-[#2AABEE] border border-zinc-800 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-[-0.02em]">
                Project Sponsor Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium">
                Verified Sponsor
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage pre-funded campaigns, track verified contributor outcomes, and export audience data.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {projects.length > 0 && (
            <div className="min-w-0">
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
                className="w-full sm:w-auto bg-[#0B0C0F] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-[#2AABEE] min-h-[42px]"
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
            className="py-2.5 px-4 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shrink-0 min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Pre-Fund Campaign</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {banner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            banner.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{banner.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-zinc-400 hover:text-zinc-100 font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-[#111216] border border-zinc-800/90 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] sm:text-xs">
            <span>Verified Actions</span>
            <Users className="w-4 h-4 text-[#2AABEE] shrink-0" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono tabular-nums">
              {totalCompletedActions}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono tabular-nums">/ {totalTargetSlots} slots</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Verified humans</span>
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-[#111216] border border-zinc-800/90 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] sm:text-xs">
            <span>Active Escrow</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              ${activeEscrowLocked.toFixed(2)}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">USDT</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Remaining locked rewards</p>
        </div>

        <div className="p-4 sm:p-5 bg-[#111216] border border-zinc-800/90 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] sm:text-xs">
            <span>Current Spend</span>
            <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono tabular-nums">
              ${totalBudgetSpent.toFixed(2)}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">USDT</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Settled to contributors</p>
        </div>

        <div className="p-4 sm:p-5 bg-[#111216] border border-zinc-800/90 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] sm:text-xs">
            <span>Active Campaigns</span>
            <PieChart className="w-4 h-4 text-zinc-300 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono tabular-nums">
              {projectCampaigns.filter((c) => c.status === 'ACTIVE').length}
            </span>
            <span className="text-[11px] text-zinc-500">live</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Open in Telegram Mini App</p>
        </div>
      </div>

      {/* Campaigns List (Responsive Cards on Mobile + Table on Desktop) */}
      <div className="bg-[#111216] border border-zinc-800/90 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/90 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-zinc-100">Live Campaign Telemetry</h2>
          <span className="text-xs text-zinc-400 font-mono tabular-nums">{projectCampaigns.length} Campaigns</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500">Loading telemetry...</div>
        ) : projectCampaigns.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No campaigns found for this sponsor. Create your first campaign above.
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-zinc-800/80">
              {projectCampaigns.map((camp) => {
                const fillPct = Math.min(100, (camp.completedSlots / camp.targetSlots) * 100);
                return (
                  <div key={camp.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-zinc-900 text-zinc-300 border border-zinc-800">
                            {camp.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              camp.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : camp.status === 'CLOSED'
                                ? 'bg-zinc-900 text-zinc-400 border-zinc-800'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-100 break-words">{camp.title}</h3>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-xs tabular-nums shrink-0">
                        ${camp.rewardPerAction.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-zinc-400 tabular-nums">
                        <span>
                          {camp.completedSlots} / {camp.targetSlots} slots
                        </span>
                        <span>Pool: ${camp.rewardPool.toFixed(2)} USDT</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#2AABEE] h-full rounded-full"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setExportCampaign(camp)}
                        className="flex-1 py-2 px-3 bg-[#171920] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1.5 min-h-[38px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export</span>
                      </button>
                      {camp.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => setConfirmCloseTarget(camp)}
                          className="flex-1 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-medium min-h-[38px]"
                        >
                          Close & Refund
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0C0F] text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                  <tr>
                    <th className="p-4 font-medium">Campaign Title</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Reward / Action</th>
                    <th className="p-4 font-medium">Progress (Slots)</th>
                    <th className="p-4 font-medium">Escrow Pool</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {projectCampaigns.map((camp) => {
                    const fillPct = Math.min(100, (camp.completedSlots / camp.targetSlots) * 100);

                    return (
                      <tr key={camp.id} className="hover:bg-zinc-900/40 transition">
                        <td className="p-4 font-semibold text-zinc-100 max-w-xs truncate">
                          {camp.title}
                          <span className="block text-[10px] text-zinc-500 font-mono mt-0.5">
                            ID: {camp.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-zinc-900 text-zinc-300 border border-zinc-800">
                            {camp.category}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-emerald-400 tabular-nums">
                          {camp.rewardPerAction.toFixed(2)} USDT
                        </td>
                        <td className="p-4">
                          <div className="space-y-1 w-32">
                            <div className="flex justify-between text-[10px] font-mono text-zinc-400 tabular-nums">
                              <span>{camp.completedSlots} filled</span>
                              <span>{camp.targetSlots}</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#2AABEE] h-full rounded-full"
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-zinc-200 tabular-nums">
                          ${camp.rewardPool.toFixed(2)} USDT
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              camp.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : camp.status === 'CLOSED'
                                ? 'bg-zinc-900 text-zinc-400 border-zinc-800'
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
                            className="px-2.5 py-1.5 bg-[#171920] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-medium transition inline-flex items-center gap-1"
                            title="Export Verified Participant CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                          </button>

                          {camp.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => setConfirmCloseTarget(camp)}
                              className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium transition inline-flex items-center"
                              title="Close & Refund Unclaimed Slots"
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

      {/* Inline Close & Refund Confirmation Dialog */}
      {confirmCloseTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111216] border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <h3 className="text-base font-bold text-zinc-100">Close Campaign & Refund Escrow</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Closing <strong className="text-zinc-200">{confirmCloseTarget.title}</strong> will halt new participant claims and immediately refund{' '}
              <strong className="text-emerald-400 font-mono tabular-nums">
                $
                {(
                  Math.max(0, confirmCloseTarget.targetSlots - confirmCloseTarget.completedSlots) *
                  confirmCloseTarget.rewardPerAction
                ).toFixed(2)}{' '}
                USDT
              </strong>{' '}
              ({Math.max(0, confirmCloseTarget.targetSlots - confirmCloseTarget.completedSlots)} unclaimed slots) to your sponsor account.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmCloseTarget(null)}
                className="flex-1 py-2.5 bg-[#171920] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold min-h-[42px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={closingId === confirmCloseTarget.id}
                onClick={() => executeCloseCampaign(confirmCloseTarget)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold min-h-[42px]"
              >
                {closingId === confirmCloseTarget.id ? 'Closing...' : 'Confirm Close & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
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
