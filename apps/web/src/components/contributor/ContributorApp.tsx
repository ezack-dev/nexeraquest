'use client';

import React, { useState, useEffect } from 'react';
import {
  Home,
  Compass,
  CheckSquare,
  Wallet,
  User,
  Bell,
  Smartphone,
  Monitor,
  Loader2
} from 'lucide-react';
import { HomeTab } from './HomeTab';
import { ExploreTab } from './ExploreTab';
import { MyQuestsTab } from './MyQuestsTab';
import { WalletTab } from './WalletTab';
import { ProfileTab } from './ProfileTab';
import { InboxTab } from './InboxTab';
import { QuestExecutionModal } from './QuestExecutionModal';

export function ContributorApp() {
  const [tab, setTab] = useState<'home' | 'explore' | 'quests' | 'wallet' | 'profile' | 'inbox'>('home');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [trustHistory, setTrustHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cRes, wRes, pRes, nRes] = await Promise.all([
        fetch('/api/v1/campaigns?status=LIVE'),
        fetch('/api/v1/wallet'),
        fetch('/api/v1/profile'),
        fetch('/api/v1/notifications?unread=true').catch(() => null),
      ]);

      const [cData, wData, pData] = await Promise.all([
        cRes.json(),
        wRes.json(),
        pRes.json(),
      ]);

      if (cData.success) setCampaigns(cData.data);
      if (wData.success) {
        setBalance(wData.data.balance);
        setTransactions(wData.data.transactions);
      }
      if (pData.success) {
        setProfile(pData.data.profile);
        setTrustHistory(pData.data.trustHistory);
      }
      if (nRes) {
        const nData = await nRes.json().catch(() => null);
        if (nData?.success) setUnreadCount(nData.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load contributor data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start bg-obsidian-950 p-2 sm:p-4">
      {/* Phone Frame Toggle for Desktop */}
      <div className="hidden md:flex items-center gap-2 mb-3 bg-obsidian-900 border border-white/[0.08] px-3 py-1.5 rounded-full text-xs text-slate-400">
        <span>Telegram Mini App Viewport:</span>
        <button
          onClick={() => setIsPhoneFrame(true)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-all ${
            isPhoneFrame ? 'bg-quest-violet text-white' : 'hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile Frame</span>
        </button>
        <button
          onClick={() => setIsPhoneFrame(false)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-all ${
            !isPhoneFrame ? 'bg-quest-violet text-white' : 'hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Expanded View</span>
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full bg-obsidian-900 border border-white/[0.08] transition-all relative flex flex-col ${
          isPhoneFrame
            ? 'max-w-[420px] rounded-[36px] shadow-2xl shadow-quest-violet/10 overflow-hidden min-h-[820px] border-white/[0.12]'
            : 'max-w-4xl rounded-2xl p-4 sm:p-6 shadow-xl'
        }`}
      >
        {/* Simulated Telegram Mobile Status Bar (visible in Phone Frame mode) */}
        {isPhoneFrame && (
          <div className="bg-obsidian-950 px-6 pt-3 pb-2 flex items-center justify-between text-xs text-slate-400 border-b border-white/[0.04]">
            <span className="font-semibold text-white font-mono text-[11px]">9:41</span>
            {/* Simulated Dynamic Island / Notch */}
            <div className="w-20 h-4 bg-obsidian-900 rounded-full border border-white/[0.06]" />
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <span>5G</span>
              <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                <div className="w-3 h-1.5 bg-quest-emerald rounded-2xs" />
              </div>
            </div>
          </div>
        )}

        {/* Telegram Header Pill */}
        {isPhoneFrame && (
          <div className="bg-obsidian-900 px-4 py-2 border-b border-white/[0.04] flex items-center justify-between">
            <span className="text-xs font-bold text-white tracking-wide">NexeraQuest</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] text-slate-300 font-mono">
              <span>Mini App</span>
            </div>
          </div>
        )}

        {/* Tab Content Container */}
        <div key={tab} className="flex-1 p-3.5 sm:p-4 overflow-y-auto tab-enter">
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-quest-violet" />
              <span>Connecting to NexeraQuest Engine...</span>
            </div>
          ) : (
            <>
              {tab === 'home' && (
                <HomeTab
                  user={profile}
                  balance={balance}
                  campaigns={campaigns}
                  onSelectCampaign={setSelectedCampaign}
                  onExploreClick={() => setTab('explore')}
                  onWalletClick={() => setTab('wallet')}
                  activeCategory={activeCategory}
                  onSelectCategory={setActiveCategory}
                />
              )}

              {tab === 'explore' && (
                <ExploreTab
                  campaigns={campaigns}
                  onSelectCampaign={setSelectedCampaign}
                />
              )}

              {tab === 'quests' && <MyQuestsTab />}

              {tab === 'wallet' && (
                <WalletTab
                  balance={balance}
                  transactions={transactions}
                  trustScore={profile?.trustScore ?? 100}
                  onRefresh={loadAllData}
                />
              )}

              {tab === 'profile' && (
                <ProfileTab profile={profile} trustHistory={trustHistory} />
              )}

              {tab === 'inbox' && <InboxTab />}
            </>
          )}
        </div>

        {/* Fixed Mobile Bottom Navigation Bar */}
        <div
          className={`sticky bottom-0 z-40 bg-obsidian-950/95 backdrop-blur-md border-t border-white/[0.08] px-2 py-2 flex items-center justify-around ${
            isPhoneFrame ? 'rounded-b-[36px]' : 'rounded-b-2xl'
          }`}
        >
          <button
            onClick={() => setTab('home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              tab === 'home' ? 'text-quest-violet font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => setTab('explore')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              tab === 'explore' ? 'text-quest-violet font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px]">Explore</span>
          </button>

          <button
            onClick={() => setTab('quests')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              tab === 'quests' ? 'text-quest-violet font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-[10px]">My Quests</span>
          </button>

          <button
            onClick={() => setTab('wallet')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              tab === 'wallet' ? 'text-quest-violet font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[10px]">Wallet</span>
          </button>

          <button
            onClick={() => { setTab('inbox'); setUnreadCount(0); }}
            className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              tab === 'inbox' ? 'text-quest-violet font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="text-[10px]">Inbox</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-1 min-w-[16px] h-4 px-1 rounded-full bg-quest-rose text-white text-[9px] font-black flex items-center justify-center tabular-nums">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              tab === 'profile' ? 'text-quest-violet font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </div>

      {/* Quest Execution Modal */}
      <QuestExecutionModal
        campaign={selectedCampaign}
        isOpen={Boolean(selectedCampaign)}
        onClose={() => setSelectedCampaign(null)}
        onRewardClaimed={loadAllData}
      />
    </div>
  );
}
