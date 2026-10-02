'use client';

import React from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Coins,
  ArrowRight,
  Flame,
  CheckCircle2,
  Users
} from 'lucide-react';

interface HomeTabProps {
  user: any;
  balance: any;
  campaigns: any[];
  onSelectCampaign: (campaign: any) => void;
  onExploreClick: () => void;
  onWalletClick: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

const CATEGORIES = ['All', 'Community', 'Social', 'Growth', 'Creative', 'Testing'];

export function HomeTab({
  user,
  balance,
  campaigns,
  onSelectCampaign,
  onExploreClick,
  onWalletClick,
  activeCategory,
  onSelectCategory,
}: HomeTabProps) {
  const isSandbox = process.env.NEXT_PUBLIC_SANDBOX_MODE === 'true';
  const featuredCampaign = campaigns.find((c) => c.status === 'LIVE');
  const filteredCampaigns = campaigns
    .filter((c) => activeCategory === 'All' || c.category === activeCategory)
    .slice(0, 6);

  return (
    <div className="space-y-4 pb-20 stagger">
      {isSandbox && (
        <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold text-center">
          Sandbox mode — verification and payouts are simulated, not real transactions.
        </div>
      )}
      {/* Contributor Identity & Trust Pill */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.firstName || 'User'}
              className="w-10 h-10 rounded-full object-cover border border-white/[0.15]"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-quest-emerald border-2 border-obsidian-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              Hey, {user?.firstName || 'Contributor'}! 👋
            </h1>
            <span className="text-[11px] text-slate-400">@{user?.telegramUsername || 'cryptodave'}</span>
          </div>
        </div>

        {/* Trust Score Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-quest-violet/10 border border-quest-violet/25 text-quest-violet">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-xs font-bold font-mono">Score {user?.trustScore || 88}</span>
        </div>
      </div>

      {/* Balance Summary Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-obsidian-850 via-obsidian-900 to-obsidian-800 border border-white/[0.08] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-quest-emerald/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400">Available Balance</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300">
            Escrow Backed
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {(balance?.available || 48.5).toFixed(2)}
            </span>
            <span className="text-xs font-bold text-quest-emerald">USDT</span>
          </div>
          <button
            onClick={onWalletClick}
            className="px-3.5 py-1.5 rounded-xl bg-quest-emerald text-obsidian-950 text-xs font-bold shadow-md shadow-quest-emerald/20 hover:opacity-95 transition-opacity"
          >
            Cashout
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.06] text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">Pending Rewards</span>
            <span className="font-semibold text-slate-300">
              {(balance?.pending || 5.0).toFixed(2)} USDT
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Total Earned</span>
            <span className="font-semibold text-quest-cyan">
              {(balance?.totalEarned || 173.5).toFixed(2)} USDT
            </span>
          </div>
        </div>
      </div>

      {/* Featured Campaign Banner */}
      {featuredCampaign && (
        <div
          onClick={() => onSelectCampaign(featuredCampaign)}
          className="p-4 rounded-2xl bg-gradient-to-r from-quest-violet/20 via-obsidian-850 to-obsidian-800 border-web3-glow cursor-pointer group hover:scale-[1.01] transition-transform relative overflow-hidden"
        >
          <div className="flex items-center gap-1.5 text-quest-violet text-xs font-bold mb-2">
            <Flame className="w-4 h-4 text-quest-amber" />
            <span className="uppercase tracking-wider">Featured Campaign</span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <img
              src={featuredCampaign.project?.logoUrl || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=128'}
              alt=""
              className="w-10 h-10 rounded-xl object-cover border border-white/[0.1]"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate group-hover:text-quest-violet transition-colors">
                {featuredCampaign.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1">{featuredCampaign.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-black text-quest-emerald">
                +{featuredCampaign.rewardPerAction} USDT
              </div>
              <span className="text-[10px] text-slate-500">Instant</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06]">
            <span>
              {featuredCampaign.targetParticipants - featuredCampaign.completedParticipants} slots remaining
            </span>
            <span className="text-quest-cyan font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Start Quest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Campaign Categories</h2>
          <button onClick={onExploreClick} className="text-xs text-quest-cyan font-semibold hover:underline">
            View All
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-quest-violet text-white shadow-sm shadow-quest-violet/30'
                  : 'bg-obsidian-850 text-slate-400 border border-white/[0.06] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Cards List */}
      <div className="space-y-2.5">
        {filteredCampaigns.map((camp) => (
          <div
            key={camp.id}
            onClick={() => onSelectCampaign(camp)}
            className="p-3.5 rounded-xl bg-obsidian-850 border border-white/[0.06] hover:border-white/[0.15] cursor-pointer transition-all flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={camp.project?.logoUrl || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=128'}
                alt=""
                className="w-9 h-9 rounded-lg object-cover border border-white/[0.08]"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold text-quest-cyan uppercase tracking-wide">
                    {camp.category}
                  </span>
                  <span className="text-slate-600 text-[10px]">•</span>
                  <span className="text-[10px] text-slate-400">{camp.project?.name}</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate group-hover:text-quest-violet transition-colors">
                  {camp.title}
                </h4>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-black text-quest-emerald">
                +{camp.rewardPerAction} {camp.currency}
              </div>
              <div className="text-[10px] text-slate-500">
                {camp.targetParticipants - camp.completedParticipants} left
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
