'use client';

import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface ExploreTabProps {
  campaigns: any[];
  onSelectCampaign: (campaign: any) => void;
}

const CATEGORIES = ['All', 'Community', 'Social', 'Growth', 'Creative', 'Testing'];

export function ExploreTab({ campaigns, onSelectCampaign }: ExploreTabProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<'highest' | 'newest' | 'slots'>('highest');

  const filtered = campaigns
    .filter((c) => {
      const matchCat = category === 'All' || c.category === category;
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        c.project?.name?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sort === 'highest') return b.rewardPerAction - a.rewardPerAction;
      if (sort === 'slots') return a.completedParticipants - b.completedParticipants;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-4 pb-20">
      {/* Search & Sort Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns, protocols, tasks..."
            className="w-full bg-obsidian-850 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-violet"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-quest-violet text-white'
                  : 'bg-obsidian-850 text-slate-400 border border-white/[0.06] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing {filtered.length} quests</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Sort:</span>
            <button
              onClick={() => setSort('highest')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                sort === 'highest' ? 'bg-white/[0.1] text-white' : 'text-slate-500'
              }`}
            >
              Highest Reward
            </button>
            <button
              onClick={() => setSort('newest')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                sort === 'newest' ? 'bg-white/[0.1] text-white' : 'text-slate-500'
              }`}
            >
              Newest
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Feed */}
      <div className="space-y-3 stagger" key={`${category}-${sort}-${search}`}>
        {filtered.length === 0 && (
          <div className="py-16 text-center animate-fade-in">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-bold text-white">No quests match</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search or category.</p>
          </div>
        )}
        {filtered.map((c) => {
          const progress = Math.min(100, Math.round((c.completedParticipants / c.targetParticipants) * 100));
          return (
            <div
              key={c.id}
              onClick={() => onSelectCampaign(c)}
              className="pressable p-4 rounded-2xl bg-obsidian-850 border border-white/[0.06] hover:border-quest-violet/40 hover:shadow-lg hover:shadow-quest-violet/10 cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={c.project?.logoUrl || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=128'}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-white/[0.08]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-300">{c.project?.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-quest-cyan/15 text-quest-cyan text-[9px] font-bold">
                        VERIFIED
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{c.category}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-quest-emerald">
                    +{c.rewardPerAction} {c.currency}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">100% Escrow</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white mb-1 group-hover:text-quest-violet transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{c.description}</p>
              </div>

              {/* Slots Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Capacity</span>
                  <span>
                    {c.completedParticipants} / {c.targetParticipants} filled ({progress}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-obsidian-950 overflow-hidden border border-white/[0.05]">
                  <div
                    className="h-full bg-gradient-to-r from-quest-violet to-quest-cyan rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
