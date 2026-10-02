'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  Copy,
  Check,
  Share2,
  ExternalLink,
  BookOpen,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface ProfileTabProps {
  profile: any;
  trustHistory: any[];
}

export function ProfileTab({ profile, trustHistory }: ProfileTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyReferral = () => {
    if (profile?.referralLink) {
      navigator.clipboard.writeText(profile.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const score = profile?.trustScore || 88;

  return (
    <div className="space-y-4 pb-20">
      {/* Profile Header */}
      <div className="p-5 rounded-2xl bg-obsidian-850 border border-white/[0.08] text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-quest-violet/40 p-0.5 relative">
          <img
            src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        <h2 className="text-base font-bold text-white mb-0.5">
          {profile?.firstName} {profile?.lastName}
        </h2>
        <span className="text-xs text-quest-cyan font-mono mb-4 block">
          @{profile?.telegramUsername || 'cryptodave'}
        </span>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06] text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block mb-0.5">Quests Done</span>
            <span className="font-bold text-white">{profile?.completedQuests || 14}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block mb-0.5">Approval Rate</span>
            <span className="font-bold text-quest-emerald">{profile?.approvalRate || 98}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block mb-0.5">Referrals</span>
            <span className="font-bold text-quest-cyan">{profile?.referralsCount || 3}</span>
          </div>
        </div>
      </div>

      {/* Trust Score Reputation Center */}
      <div className="p-4 rounded-2xl bg-obsidian-850 border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-quest-violet" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Trust Score</h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-quest-violet/20 text-quest-violet text-[10px] font-bold">
            {score >= 80 ? 'Elite Tier' : score >= 50 ? 'Trusted' : 'Probation'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-obsidian-950"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-quest-violet"
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-black text-sm text-white font-mono">{score}</span>
          </div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Your Trust Score reflects genuine completion history and enables access to high-reward exclusive campaigns.
          </div>
        </div>

        {/* Recent Trust Events */}
        {trustHistory && trustHistory.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.04] text-[11px]">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Reputation History
            </span>
            {trustHistory.slice(0, 3).map((ev: any) => (
              <div key={ev.id} className="flex justify-between items-center text-slate-400 py-0.5">
                <span className="truncate max-w-[200px]">{ev.reason}</span>
                <span
                  className={`font-mono font-bold ${
                    ev.delta > 0 ? 'text-quest-emerald' : 'text-rose-400'
                  }`}
                >
                  {ev.delta > 0 ? `+${ev.delta}` : ev.delta}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referral Hub */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-quest-violet/10 via-obsidian-850 to-obsidian-850 border border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Referral Program</h3>
          <span className="text-[10px] text-quest-cyan font-bold font-mono">
            Code: {profile?.referralCode || 'DAVE88'}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Invite friends to NexeraQuest and earn qualified bounty bonuses for every task they complete!
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={profile?.referralLink || 'https://t.me/NexeraQuestBot/app?startapp=ref_DAVE88'}
            className="flex-1 bg-obsidian-950 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
          />
          <button
            onClick={handleCopyReferral}
            className="px-3.5 py-2 rounded-xl bg-quest-violet text-white text-xs font-bold hover:bg-quest-violet/90 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Safety & Legal Disclosures */}
      <div className="p-3.5 rounded-2xl bg-obsidian-850 border border-white/[0.06] space-y-2 text-xs text-slate-400">
        <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
          Safety & Policies
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('NexeraQuest Terms: Campaigns are funded via smart escrow. Verified work guarantees reward distribution.');
            }}
            className="p-2 rounded-xl bg-obsidian-900 border border-white/[0.05] hover:border-white/[0.15] text-[11px] text-slate-300 flex items-center justify-between"
          >
            <span>Terms of Service</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Privacy Policy: NexeraQuest minimizes data collection. Only public Telegram identifiers are stored.');
            }}
            className="p-2 rounded-xl bg-obsidian-900 border border-white/[0.05] hover:border-white/[0.15] text-[11px] text-slate-300 flex items-center justify-between"
          >
            <span>Privacy Policy</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Dispute Policy: Contributor rejections can be appealed to NexeraQuest Ops within 48 hours with proof.');
            }}
            className="p-2 rounded-xl bg-obsidian-900 border border-white/[0.05] hover:border-white/[0.15] text-[11px] text-slate-300 flex items-center justify-between"
          >
            <span>Dispute Policy</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Risk Disclosures: Cryptocurrency markets carry volatility. NexeraQuest provides pre-funded escrow settlements.');
            }}
            className="p-2 rounded-xl bg-obsidian-900 border border-white/[0.05] hover:border-white/[0.15] text-[11px] text-slate-300 flex items-center justify-between"
          >
            <span>Risk Disclosures</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
