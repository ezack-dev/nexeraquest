import React, { useState } from 'react';
import { DiscoverTab } from './DiscoverTab.js';
import { MyTasksTab } from './MyTasksTab.js';
import { WalletTab } from './WalletTab.js';
import { ProfileTab } from './ProfileTab.js';
import { Compass, CheckCircle2, Wallet, User } from 'lucide-react';

export const MiniAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'tasks' | 'wallet' | 'profile'>('discover');

  const navItems = [
    { id: 'discover' as const, label: 'Discover', icon: Compass },
    { id: 'tasks' as const, label: 'My Quests', icon: CheckCircle2 },
    { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <div className="max-w-lg mx-auto min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-3.5rem)] flex flex-col px-4 pt-4 pb-28">
      <div className="flex-1">
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'tasks' && <MyTasksTab />}
        {activeTab === 'wallet' && <WalletTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>

      {/* Fixed Bottom Navigation */}
      <nav
        aria-label="Contributor navigation"
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0B0E]/92 backdrop-blur-xl border-t border-white/[0.07]"
      >
        <div className="max-w-lg mx-auto grid grid-cols-4 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-colors min-h-[48px] ${
                  active ? 'text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {active && <span className="absolute top-0 w-5 h-0.5 rounded-full bg-[#3390EC]" />}
                <Icon className={`w-[19px] h-[19px] ${active ? 'text-[#3390EC]' : ''}`} />
                <span className="text-[11px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
