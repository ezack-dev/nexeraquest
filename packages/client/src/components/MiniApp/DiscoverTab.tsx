import React, { useState, useEffect } from 'react';
import { Campaign } from '../../types.js';
import { api } from '../../api.js';
import { QuestModal } from './QuestModal.js';
import { Search, ShieldCheck, Users, ChevronRight, Lock, X } from 'lucide-react';

export const DiscoverTab: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const categories = [
    { id: 'ALL', label: 'All Quests' },
    { id: 'COMMUNITY', label: 'Community' },
    { id: 'SOCIAL', label: 'Social' },
    { id: 'GROWTH', label: 'Growth' },
    { id: 'TESTING', label: 'Testing' },
    { id: 'CREATIVE', label: 'Creative' },
  ];

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.getCampaigns(selectedCategory, search);
      setCampaigns(data);
      setSelectedCampaign((prev) => {
        if (!prev) return null;
        return data.find((c: Campaign) => c.id === prev.id) || prev;
      });
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [selectedCategory, search]);

  return (
    <div className="space-y-4">
      {/* Search & Wrapped Category Chips (Zero horizontal clipping on mobile) */}
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="quest-search" className="sr-only">
            Search campaigns by project or task
          </label>
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="quest-search"
            name="questSearch"
            type="text"
            placeholder="Search campaigns by project or task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-[#111216] border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#2AABEE] transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-100 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Wrapped Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Campaign categories">
          {categories.map((c) => {
            const active = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  active
                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                    : 'bg-[#111216] text-zinc-400 border-zinc-800/90 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Institutional Escrow Callout */}
      <div className="p-4 rounded-2xl bg-[#111216] border border-zinc-800/90 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#2AABEE]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Web3 Marketplace</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 font-medium">
            <Lock className="w-3 h-3" />
            <span>Non-Custodial Escrow</span>
          </span>
        </div>
        <div>
          <h1 className="text-base font-bold text-zinc-100 tracking-[-0.02em]">Pre-Funded Crypto Quests</h1>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            Every campaign reward pool is locked upfront in escrow before launch. Complete verified tasks and cash out directly.
          </p>
        </div>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500">
          Loading pre-funded campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-12 text-center bg-[#111216] border border-zinc-800/80 rounded-2xl text-xs text-zinc-400">
          No campaigns found matching your filter.
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((camp) => {
            const fillPct = Math.min(100, (camp.completedSlots / camp.targetSlots) * 100);
            const slotsLeft = Math.max(0, camp.targetSlots - camp.completedSlots);

            return (
              <button
                type="button"
                key={camp.id}
                onClick={() => setSelectedCampaign(camp)}
                className="w-full text-left group p-4 bg-[#111216] hover:bg-[#171920] border border-zinc-800/90 hover:border-zinc-700 rounded-2xl cursor-pointer transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {camp.category}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium truncate">
                        {camp.project?.name || 'Sponsor'}
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition leading-snug break-words">
                      {camp.title}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {camp.description}
                    </p>
                  </div>

                  {/* Reward Badge */}
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Reward</span>
                    <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono tabular-nums whitespace-nowrap">
                      {camp.rewardPerAction.toFixed(2)} USDT
                    </span>
                  </div>
                </div>

                {/* Progress & Footer */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{slotsLeft} slots left</span>
                    </span>
                    <span className="text-emerald-400/90 font-medium inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Escrow Locked</span>
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-0.5 text-zinc-300 group-hover:text-[#2AABEE] font-medium shrink-0 transition">
                    <span>Open</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Crisp Progress Indicator */}
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="bg-[#2AABEE] h-full rounded-full transition-all"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Quest Modal */}
      {selectedCampaign && (
        <QuestModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onComplete={() => {
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
};
