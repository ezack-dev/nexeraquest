import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { X, Download, FileSpreadsheet } from 'lucide-react';

interface ExportModalProps {
  campaignId: string;
  campaignTitle: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ campaignId, campaignTitle, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExport = async () => {
      try {
        setLoading(true);
        const res = await api.exportParticipants(campaignId);
        setData(res);
      } catch (err) {
        console.error('Failed to export:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExport();
  }, [campaignId]);

  const downloadCSV = () => {
    if (!data?.participants) return;
    const headers = ['Index', 'Telegram ID', 'Username', 'Trust Score', 'Completed At', 'Proof Payload'];
    const rows = data.participants.map((p: any) => [
      p.index,
      `"${p.telegramId}"`,
      `"${p.username}"`,
      p.trustScore,
      `"${p.completedAt}"`,
      `"${(p.proofPayload || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nexeraquest_participants_${campaignId.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#111216] border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-5 py-4 border-b border-zinc-800/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-zinc-100">Verified Participants Export</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-zinc-100 break-words">{campaignTitle}</h4>
              <p className="text-xs text-zinc-400 font-mono tabular-nums mt-0.5">
                Total Verified:{' '}
                <span className="text-emerald-400 font-semibold">{data?.totalVerified ?? 0} Contributors</span>
              </p>
            </div>
            <button
              type="button"
              onClick={downloadCSV}
              disabled={loading || !data?.participants?.length}
              className="py-2 px-3.5 bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 font-bold rounded-xl text-xs transition inline-flex items-center justify-center gap-1.5 shrink-0 min-h-[38px]"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Generating participant data...
            </div>
          ) : !data?.participants?.length ? (
            <div className="p-8 text-center bg-[#0B0C0F] border border-zinc-800 rounded-xl text-xs text-zinc-400">
              No verified participants yet for this campaign.
            </div>
          ) : (
            <>
              {/* Mobile Participant Cards */}
              <div className="sm:hidden space-y-2.5">
                {data.participants.map((p: any) => (
                  <div key={p.index} className="p-3 bg-[#0B0C0F] border border-zinc-800/90 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100 font-mono">{p.username}</span>
                      <span className="text-emerald-400 font-mono text-[11px] tabular-nums">Trust {p.trustScore}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono">TG ID: {p.telegramId}</p>
                    <p className="text-[11px] text-zinc-500 font-mono break-all">{p.proofPayload}</p>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0C0F] text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Telegram ID</th>
                      <th className="p-3">Handle</th>
                      <th className="p-3">Trust</th>
                      <th className="p-3">Proof</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                    {data.participants.map((p: any) => (
                      <tr key={p.index} className="hover:bg-zinc-900/50 font-mono text-[11px]">
                        <td className="p-3 text-zinc-500 tabular-nums">{p.index}</td>
                        <td className="p-3 text-[#2AABEE] tabular-nums">{p.telegramId}</td>
                        <td className="p-3 font-medium text-zinc-100">{p.username}</td>
                        <td className="p-3 text-emerald-400 tabular-nums">{p.trustScore}</td>
                        <td className="p-3 truncate max-w-xs text-zinc-400">{p.proofPayload}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
