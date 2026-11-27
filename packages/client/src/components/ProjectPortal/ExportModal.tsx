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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#13151B] border-t sm:border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-base font-semibold text-white">Verified Participants</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white break-words">{campaignTitle}</h4>
              <p className="text-xs text-zinc-400 font-mono tabular-nums mt-0.5">
                {data?.totalVerified ?? 0} verified participants
              </p>
            </div>
            <button
              type="button"
              onClick={downloadCSV}
              disabled={loading || !data?.participants?.length}
              className="py-2 px-3.5 bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 font-semibold rounded-xl text-xs transition inline-flex items-center justify-center gap-1.5 shrink-0 min-h-[38px]"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[13px] text-zinc-500">Loading participants...</div>
          ) : !data?.participants?.length ? (
            <div className="p-8 text-center bg-[#0E1015] border border-white/[0.07] rounded-xl text-[13px] text-zinc-400">
              No verified participants yet.
            </div>
          ) : (
            <>
              <div className="sm:hidden space-y-2.5">
                {data.participants.map((p: any) => (
                  <div
                    key={p.index}
                    className="p-3 bg-[#0E1015] border border-white/[0.07] rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100 font-mono">{p.username}</span>
                      <span className="text-emerald-400 font-mono tabular-nums">Trust {p.trustScore}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono">Telegram ID: {p.telegramId}</p>
                    <p className="text-[11px] text-zinc-500 font-mono break-all">{p.proofPayload}</p>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block border border-white/[0.08] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0E1015] text-zinc-400 font-mono text-[11px] border-b border-white/[0.07]">
                    <tr>
                      <th className="p-3 font-medium">#</th>
                      <th className="p-3 font-medium">Telegram ID</th>
                      <th className="p-3 font-medium">Handle</th>
                      <th className="p-3 font-medium">Trust</th>
                      <th className="p-3 font-medium">Proof</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                    {data.participants.map((p: any) => (
                      <tr key={p.index} className="hover:bg-white/[0.02] font-mono text-[11px]">
                        <td className="p-3 text-zinc-500 tabular-nums">{p.index}</td>
                        <td className="p-3 text-[#3390EC] tabular-nums">{p.telegramId}</td>
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
