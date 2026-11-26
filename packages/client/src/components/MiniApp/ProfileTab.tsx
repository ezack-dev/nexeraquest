import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api.js';
import { Shield, Award, Users, Copy, Check, TrendingUp } from 'lucide-react';

export const ProfileTab: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const data = await api.getUserProfile(user.id);
        setProfileData(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    fetchProfile();
  }, [user]);

  const referralLink = `https://t.me/nexeraquest_bot?start=ref_${user?.referralCode || 'NQ123'}`;

  const copyRefLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const trustScore = user?.trustScore ?? 50;
  const trustTier =
    trustScore >= 80 ? 'Elite Contributor' : trustScore >= 65 ? 'Verified Pioneer' : 'Standard Member';

  // SVG Radial Gauge math
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (trustScore / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Contributor Identity Card */}
      <div className="p-5 bg-[#111216] border border-zinc-800/90 rounded-2xl text-center space-y-4">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#171920] border border-zinc-700/80 flex items-center justify-center text-lg font-bold text-zinc-100 mb-2.5">
            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <h2 className="text-base font-bold text-zinc-100 tracking-[-0.02em]">
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-xs text-zinc-400 font-mono">@{user?.username || 'user'}</p>
        </div>

        {/* Trust Score Gauge */}
        <div className="p-4 bg-[#0B0C0F] border border-zinc-800/90 rounded-xl flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 block">
              On-Chain Trust Score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-zinc-100 font-mono tabular-nums">{trustScore}</span>
              <span className="text-xs text-zinc-500 font-mono">/ 100</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-400 inline-flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3" />
              <span>{trustTier}</span>
            </span>
          </div>

          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r={radius} stroke="#27272A" strokeWidth="5" fill="none" />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="#2AABEE"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <span className="absolute text-xs font-mono font-bold text-zinc-200 tabular-nums">
              {trustScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 bg-[#111216] border border-zinc-800/90 rounded-2xl text-center">
          <Award className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <span className="text-[10px] text-zinc-500 block">Completed</span>
          <span className="text-sm font-bold text-zinc-100 font-mono tabular-nums">
            {profileData?.stats?.completedQuests ?? 0}
          </span>
        </div>
        <div className="p-3 bg-[#111216] border border-zinc-800/90 rounded-2xl text-center">
          <TrendingUp className="w-4 h-4 text-[#2AABEE] mx-auto mb-1" />
          <span className="text-[10px] text-zinc-500 block">Approval</span>
          <span className="text-sm font-bold text-zinc-100 font-mono tabular-nums">
            {profileData?.stats?.approvalRate ?? 100}%
          </span>
        </div>
        <div className="p-3 bg-[#111216] border border-zinc-800/90 rounded-2xl text-center">
          <Users className="w-4 h-4 text-zinc-300 mx-auto mb-1" />
          <span className="text-[10px] text-zinc-500 block">Referrals</span>
          <span className="text-sm font-bold text-zinc-100 font-mono tabular-nums">
            {profileData?.stats?.referralsCount ?? 0}
          </span>
        </div>
      </div>

      {/* Referral Link Box */}
      <div className="p-4 bg-[#111216] border border-zinc-800/90 rounded-2xl space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-zinc-200">
          <label htmlFor="referral-link-input" className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#2AABEE]" />
            <span>Refer Friends & Earn</span>
          </label>
          <span className="text-emerald-400 font-mono text-[11px] tabular-nums">+1.00 USDT / referral</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Share your invite link. You earn instant credit when friends complete their first verified quest.
        </p>

        <div className="flex items-center gap-2 pt-0.5">
          <input
            id="referral-link-input"
            name="referralLink"
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 min-w-0 bg-[#0B0C0F] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={copyRefLink}
            className="px-3.5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 min-h-[36px]"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Reputation Timeline */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-1">
          Reputation Timeline
        </h3>
        {!profileData?.recentTrustEvents || profileData.recentTrustEvents.length === 0 ? (
          <div className="p-4 bg-[#111216] border border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
            No score changes recorded.
          </div>
        ) : (
          <div className="space-y-1.5">
            {profileData.recentTrustEvents.map((evt: any) => (
              <div
                key={evt.id}
                className="p-3 bg-[#111216] border border-zinc-800/90 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-200 truncate">{evt.reason}</p>
                  <p className="text-[10px] text-zinc-500">{new Date(evt.createdAt).toLocaleDateString()}</p>
                </div>
                <span
                  className={`font-mono font-semibold text-xs tabular-nums shrink-0 ${
                    evt.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {evt.delta >= 0 ? `+${evt.delta}` : evt.delta}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
