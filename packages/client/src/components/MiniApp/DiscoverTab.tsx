import React, { useState, useEffect, useMemo } from 'react';
import { Campaign, TaskInstance } from '../../types.js';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.js';
import { QuestModal } from './QuestModal.js';
import {
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  MessageSquare,
  Share2,
  UserPlus,
  FlaskConical,
  Palette,
} from 'lucide-react';

function getSponsorStyle(name?: string) {
  const label = name || 'Sponsor';
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const styles = [
    'bg-sky-500/15 text-sky-300 border-sky-500/25',
    'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
    'bg-amber-500/15 text-amber-300 border-amber-500/25',
  ];
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash + label.charCodeAt(i)) % styles.length;
  return { initials: initials || 'NQ', badgeClass: styles[hash] };
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'COMMUNITY':
      return MessageSquare;
    case 'SOCIAL':
      return Share2;
    case 'GROWTH':
      return UserPlus;
    case 'TESTING':
      return FlaskConical;
    case 'CREATIVE':
      return Palette;
    default:
      return MessageSquare;
  }
}

export const DiscoverTab: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userTasks, setUserTasks] = useState<TaskInstance[]>([]);
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

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const [campData, taskData] = await Promise.all([
        api.getCampaigns(selectedCategory, search),
        user?.id ? api.getUserTasks(user.id).catch(() => []) : Promise.resolve([]),
      ]);
      setCampaigns(campData);
      setUserTasks(taskData);
      setSelectedCampaign((prev) => {
        if (!prev) return null;
        return campData.find((c: Campaign) => c.id === prev.id) || prev;
      });
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [selectedCategory, search, user?.id]);

  const userTaskByCampaign = useMemo(() => {
    const map = new Map<string, TaskInstance>();
    for (const t of userTasks) {
      if (!map.has(t.campaignId)) {
        map.set(t.campaignId, t);
      }
    }
    return map;
  }, [userTasks]);

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-[-0.02em]">Quests</h1>
          <p className="text-[13px] text-zinc-400">Complete verified tasks to earn USDT</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#13151B] border border-white/[0.08] text-[11px] font-medium text-zinc-300 tabular-nums">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {campaigns.length} Live
        </span>
      </div>

      {/* Search & Category Chips */}
      <div className="space-y-2.5">
        <div className="relative">
          <label htmlFor="quest-search" className="sr-only">
            Search campaigns by project or task
          </label>
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="quest-search"
            name="questSearch"
            type="text"
            placeholder="Search projects or tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-[#13151B] border border-white/[0.08] rounded-xl text-[13px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#3390EC] transition"
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
                    ? 'bg-white text-zinc-950 border-white font-semibold'
                    : 'bg-[#13151B] text-zinc-400 border-white/[0.07] hover:text-zinc-200 hover:border-white/[0.14]'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quest Feed */}
      {loading ? (
        <div className="py-12 text-center text-[13px] text-zinc-500">Loading quests...</div>
      ) : campaigns.length === 0 ? (
        <div className="py-12 text-center bg-[#13151B] border border-white/[0.07] rounded-2xl text-[13px] text-zinc-400">
          No quests match your current filter.
        </div>
      ) : (
        <div className="space-y-2.5">
          {campaigns.map((camp) => {
            const fillPct = Math.min(100, (camp.completedSlots / camp.targetSlots) * 100);
            const slotsLeft = Math.max(0, camp.targetSlots - camp.completedSlots);
            const sponsor = getSponsorStyle(camp.project?.name);
            const CategoryIcon = getCategoryIcon(camp.category);
            const existingTask = userTaskByCampaign.get(camp.id);

            return (
              <button
                type="button"
                key={camp.id}
                onClick={() => setSelectedCampaign(camp)}
                className="w-full text-left group p-4 bg-[#13151B] hover:bg-[#191C24] border border-white/[0.07] hover:border-white/[0.15] rounded-2xl cursor-pointer transition"
              >
                {/* Top Sponsor Row + Reward Pill */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-md border text-[10px] font-bold flex items-center justify-center shrink-0 ${sponsor.badgeClass}`}
                    >
                      {sponsor.initials}
                    </div>
                    <span className="text-xs font-medium text-zinc-300 truncate">
                      {camp.project?.name || 'Verified Sponsor'}
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 shrink-0">
                      <CategoryIcon className="w-3 h-3" />
                      <span className="capitalize">{camp.category.toLowerCase()}</span>
                    </span>
                  </div>

                  {/* Reward Pill */}
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-semibold text-xs tabular-nums whitespace-nowrap shrink-0">
                    +{camp.rewardPerAction.toFixed(2)} USDT
                  </span>
                </div>

                {/* Title & Description */}
                <h2 className="text-[14px] font-semibold text-white group-hover:text-white leading-snug break-words">
                  {camp.title}
                </h2>
                <p className="text-[13px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {camp.description}
                </p>

                {/* Bottom Status & Slots */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {existingTask?.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Completed</span>
                      </span>
                    ) : existingTask?.status === 'SUBMITTED' ? (
                      <span className="inline-flex items-center gap-1 text-[#3390EC] font-medium">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Pending Review</span>
                      </span>
                    ) : existingTask?.status === 'STARTED' ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>In Progress</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400 tabular-nums">{slotsLeft} spots left</span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-0.5 text-zinc-400 group-hover:text-white font-medium shrink-0 transition">
                    <span>{existingTask?.status === 'APPROVED' ? 'Details' : 'Open'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Subtle Progress Bar */}
                <div className="w-full bg-white/[0.05] h-1 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="bg-[#3390EC] h-full rounded-full transition-all"
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
          existingTask={userTaskByCampaign.get(selectedCampaign.id)}
          onClose={() => setSelectedCampaign(null)}
          onComplete={() => {
            fetchFeed();
          }}
        />
      )}
    </div>
  );
};
