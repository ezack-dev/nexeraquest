'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, CheckCircle2, Clock, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface ParticipantsTableProps {
  campaigns: any[];
}

export function ParticipantsTable({ campaigns }: ParticipantsTableProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
  }, [search, status, selectedCampaignId]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'ALL') params.append('status', status);
      if (selectedCampaignId) params.append('campaignId', selectedCampaignId);

      const res = await fetch(`/api/v1/project/participants?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setParticipants(data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    const url = `/api/v1/project/export${selectedCampaignId ? `?campaignId=${selectedCampaignId}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contributor username..."
              className="w-full bg-obsidian-850 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-cyan"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-obsidian-850 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-quest-cyan"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 border border-white/[0.1] text-xs font-semibold text-slate-200 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-quest-emerald" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Participants Data Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-obsidian-850">
        <table className="w-full text-left text-xs">
          <thead className="bg-obsidian-900 border-b border-white/[0.08] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Contributor</th>
              <th className="py-3 px-4">Campaign & Task</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Reward</th>
              <th className="py-3 px-4">Reputation</th>
              <th className="py-3 px-4">Completed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  Loading participant records...
                </td>
              </tr>
            ) : participants.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No verified participants found matching criteria.
                </td>
              </tr>
            ) : (
              participants.map((p) => {
                const isApproved = p.status === 'APPROVED';
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">
                        {p.user?.firstName || 'Contributor'}
                      </div>
                      <div className="text-[11px] text-quest-cyan font-mono">
                        @{p.user?.telegramUsername || 'anonymous'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200 truncate max-w-xs">{p.task?.title}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{p.campaign?.title}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-quest-emerald/15 text-quest-emerald'
                            : 'bg-quest-amber/15 text-quest-amber'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-quest-emerald">
                      +{p.campaign?.rewardPerAction} {p.campaign?.currency}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      Score {p.user?.trustScore || 50}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {p.completedAt ? new Date(p.completedAt).toLocaleString() : 'In Progress'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
