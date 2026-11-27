import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api.js';
import { UserAvatar } from '../UserAvatar.js';
import { Shield, Award, Users, Copy, Check, TrendingUp } from 'lucide-react';

export const ProfileTab: React.FC = () => {
  const { user, authMode } = useAuth();
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

  const displayUser = profileData?.user || user;
  const fullName =
    [displayUser?.firstName, displayUser?.lastName].filter(Boolean).join(' ') ||
    displayUser?.username ||
    'Contributor';
  const trustScore = displayUser?.trustScore ?? 50;
  const trustTier =
    trustScore >= 80 ? 'Elite Contributor' : trustScore >= 65 ? 'Verified Pioneer' : 'Member';

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (trustScore / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Identity & Reputation Card */}
      <div className="p-5 bg-[#13151B] border border-white/[0.08] rounded-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <UserAvatar
              user={displayUser}
              sizeClass="w-12 h-12"
              roundedClass="rounded-xl"
              textClass="text-base"
            />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white tracking-[-0.02em] truncate">
                {fullName}
              </h2>
              <p className="text-xs text-zinc-400 font-mono truncate">
                @{displayUser?.username || 'user'}
              </p>
            </div>
          </div>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${
              authMode === 'demo'
                ? 'bg-white/[0.04] border-white/[0.08] text-zinc-400'
                : 'bg-[#3390EC]/10 border-[#3390EC]/25 text-[#3390EC]'
            }`}
          >
            {authMode === 'telegram_miniapp'
              ? 'Mini App'
              : authMode === 'telegram_widget'
              ? 'Telegram'
              : 'Sandbox'}
          </span>
        </div>

        {/* Trust Score Summary */}
        <div className="p-4 bg-[#0E1015] border border-white/[0.07] rounded-xl flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-zinc-400 block">Trust Score</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-white font-mono tabular-nums">{trustScore}</span>
              <span className="text-xs text-zinc-500 font-mono">/ 100</span>
            </div>
            <span className="text-xs font-medium text-emerald-400 inline-flex items-center gap-1 mt-1">
              <Shield className="w-3.5 h-3.5" />
              <span>{trustTier}</span>
            </span>
          </div>

          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="#3390EC"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <span className="absolute text-xs font-mono font-semibold text-zinc-100 tabular-nums">
              {trustScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 bg-[#13151B] border border-white/[0.07] rounded-2xl text-center">
          <Award className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <span className="text-[11px] text-zinc-400 block">Completed</span>
          <span className="text-sm font-semibold text-white font-mono tabular-nums">
            {profileData?.stats?.completedQuests ?? 0}
          </span>
        </div>
        <div className="p-3.5 bg-[#13151B] border border-white/[0.07] rounded-2xl text-center">
          <TrendingUp className="w-4 h-4 text-[#3390EC] mx-auto mb-1" />
          <span className="text-[11px] text-zinc-400 block">Approval</span>
          <span className="text-sm font-semibold text-white font-mono tabular-nums">
            {profileData?.stats?.approvalRate ?? 100}%
          </span>
        </div>
        <div className="p-3.5 bg-[#13151B] border border-white/[0.07] rounded-2xl text-center">
          <Users className="w-4 h-4 text-zinc-300 mx-auto mb-1" />
          <span className="text-[11px] text-zinc-400 block">Referrals</span>
          <span className="text-sm font-semibold text-white font-mono tabular-nums">
            {profileData?.stats?.referralsCount ?? 0}
          </span>
        </div>
      </div>

      {/* Referral Invite Card */}
      <div className="p-4 bg-[#13151B] border border-white/[0.07] rounded-2xl space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <label htmlFor="referral-link-input" className="font-semibold text-zinc-100 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#3390EC]" />
            <span>Invite Friends</span>
          </label>
          <span className="text-emerald-400 font-mono text-xs tabular-nums">+1.00 USDT / invite</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Earn rewards when friends sign up through your link and complete their first quest.
        </p>

        <div className="flex items-center gap-2 pt-0.5">
          <input
            id="referral-link-input"
            name="referralLink"
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 min-w-0 bg-[#0E1015] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={copyRefLink}
            className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 min-h-[38px]"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Reputation History */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-400 px-0.5">Score History</h3>
        {!profileData?.recentTrustEvents || profileData.recentTrustEvents.length === 0 ? (
          <div className="p-4 bg-[#13151B] border border-white/[0.07] rounded-xl text-center text-xs text-zinc-500">
            No score updates yet.
          </div>
        ) : (
          <div className="space-y-1.5">
            {profileData.recentTrustEvents.map((evt: any) => (
              <div
                key={evt.id}
                className="p-3 bg-[#13151B] border border-white/[0.07] rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-200 truncate">{evt.reason}</p>
                  <p className="text-[11px] text-zinc-500">{new Date(evt.createdAt).toLocaleDateString()}</p>
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
