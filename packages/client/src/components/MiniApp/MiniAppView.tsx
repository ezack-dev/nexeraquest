import React, { useState } from 'react';
import { DiscoverTab } from './DiscoverTab.js';
import { MyTasksTab } from './MyTasksTab.js';
import { WalletTab } from './WalletTab.js';
import { ProfileTab } from './ProfileTab.js';
import { Compass, CheckSquare, Wallet, UserCircle } from 'lucide-react';

export const MiniAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'tasks' | 'wallet' | 'profile'>('discover');

  const navItems = [
    { id: 'discover' as const, label: 'Discover', icon: Compass },
    { id: 'tasks' as const, label: 'My Quests', icon: CheckSquare },
    { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
    { id: 'profile' as const, label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="max-w-lg mx-auto min-h-[calc(100vh-6.5rem)] md:min-h-[calc(100vh-3.5rem)] flex flex-col px-4 pt-4 pb-28">
      {/* Active Tab View */}
      <div className="flex-1">
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'tasks' && <MyTasksTab />}
        {activeTab === 'wallet' && <WalletTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>

      {/* Fixed Bottom Navigation Bar with Safe Area & Clear Separation */}
      <nav
        aria-label="Contributor navigation"
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#09090B]/95 backdrop-blur-xl border-t border-zinc-800/90"
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
                  active ? 'text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {active && (
                  <span className="absolute top-0 w-6 h-0.5 rounded-full bg-[#2AABEE]" />
                )}
                <Icon className={`w-5 h-5 ${active ? 'text-[#2AABEE]' : ''}`} />
                <span className="text-[11px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
