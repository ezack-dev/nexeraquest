import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { TelegramLoginModal } from './TelegramLoginModal.js';
import { Shield, User, Building, Lock, Wallet, RefreshCw, ChevronDown, Check, LogIn, LogOut } from 'lucide-react';

interface NavbarProps {
  currentSurface: 'miniapp' | 'portal' | 'admin';
  setSurface: (surface: 'miniapp' | 'portal' | 'admin') => void;
}

const NexeraMark: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M12 2.5L20 7.1V16.9L12 21.5L4 16.9V7.1L12 2.5Z"
      stroke="#2AABEE"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 15V9L15.5 15V9"
      stroke="#F4F4F5"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ currentSurface, setSurface }) => {
  const { user, balance, refreshUser, switchUser, logoutToDemo, authMode, authConfig } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTgLoginModal, setShowTgLoginModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, []);

  const surfaceTabs = [
    { id: 'miniapp' as const, label: 'Mini App', icon: User },
    { id: 'portal' as const, label: 'Project Portal', icon: Building },
    { id: 'admin' as const, label: 'Admin Ops', icon: Lock },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#09090B]/90 backdrop-blur-xl border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Primary Top Row */}
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => setSurface('miniapp')}
            className="flex items-center gap-2.5 text-left focus:outline-none shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[#111216] border border-zinc-800 flex items-center justify-center">
              <NexeraMark />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-[-0.02em] text-zinc-100">
                  NexeraQuest
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  v0.1
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-wider text-zinc-500 hidden lg:block">
                QUEST · CONTRIBUTE · EARN
              </p>
            </div>
          </button>

          {/* Desktop Surface Switcher */}
          <nav
            aria-label="Workspace surface"
            className="hidden md:flex items-center p-1 bg-[#111216] rounded-xl border border-zinc-800/90"
          >
            {surfaceTabs.map((tab) => {
              const Icon = tab.icon;
              const active = currentSurface === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSurface(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Live Balance, Trust & Touch-Friendly Account Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {user && (
              <div className="flex items-center gap-1.5 text-xs">
                {/* Compact Balance Pill (visible on all screen sizes) */}
                <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-[#111216] border border-zinc-800 rounded-lg text-emerald-400 font-mono font-medium tabular-nums">
                  <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>${balance?.available?.toFixed(2) ?? '0.00'}</span>
                  <span className="hidden sm:inline text-zinc-500 text-[10px]">USDT</span>
                </div>

                {/* Trust Score Pill (sm+) */}
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-[#111216] border border-zinc-800 rounded-lg text-zinc-200 font-medium tabular-nums">
                  <Shield className="w-3.5 h-3.5 text-[#2AABEE]" />
                  <span className="font-mono text-[11px]">Trust: {user.trustScore}/100</span>
                </div>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={() => refreshUser()}
                  className="hidden sm:inline-flex p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800 transition"
                  title="Refresh Balance"
                  aria-label="Refresh Balance"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Click/Tap Account Switcher */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111216] hover:bg-[#171920] border border-zinc-800 rounded-lg text-xs text-zinc-200 transition min-h-[34px]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-medium max-w-[74px] sm:max-w-[120px] truncate">
                  @{user?.username || 'Guest'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 bg-[#111216] border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50"
                >
                  {/* Active Session Badge */}
                  <div className="px-2.5 py-1.5 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
                      {authMode === 'demo' ? 'Hybrid Sandbox' : 'Telegram Verified'}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        authMode === 'demo'
                          ? 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          : 'bg-[#2AABEE]/10 text-[#2AABEE] border border-[#2AABEE]/25'
                      }`}
                    >
                      {authMode === 'telegram_miniapp'
                        ? 'Mini App'
                        : authMode === 'telegram_widget'
                        ? 'Widget'
                        : 'Demo'}
                    </span>
                  </div>

                  {/* Real Telegram Login Option (in Browser outside Mini App) */}
                  {authMode === 'demo' && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowTgLoginModal(true);
                      }}
                      className="w-full text-left px-2.5 py-2 mb-1 rounded-lg text-xs bg-[#2481CC]/15 hover:bg-[#2481CC]/25 text-[#2AABEE] border border-[#2481CC]/30 font-semibold flex items-center gap-2"
                    >
                      <LogIn className="w-3.5 h-3.5 shrink-0" />
                      <span>Sign in with Telegram</span>
                    </button>
                  )}

                  {authMode === 'telegram_widget' && authConfig.demoModeEnabled && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        logoutToDemo();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 mb-1 rounded-lg text-xs hover:bg-zinc-900 text-zinc-300 font-medium flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Switch back to Demo Mode</span>
                    </button>
                  )}

                  {authConfig.demoModeEnabled && (
                    <>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 px-2.5 pt-1.5 pb-1">
                        Demo Contributor Identities
                      </p>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          switchUser({ telegramId: '987654321', username: 'alex_web3', firstName: 'Alex' });
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-zinc-900 text-zinc-200 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          {authMode === 'demo' && user?.username === 'alex_web3' && (
                            <Check className="w-3.5 h-3.5 text-[#2AABEE]" />
                          )}
                          <span>@alex_web3 (Pioneer)</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono tabular-nums">Trust 78+</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          switchUser({ telegramId: '123456789', username: 'cryptosam', firstName: 'Sam' });
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-zinc-900 text-zinc-200 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          {authMode === 'demo' && user?.username === 'cryptosam' && (
                            <Check className="w-3.5 h-3.5 text-[#2AABEE]" />
                          )}
                          <span>@cryptosam (Novice)</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono tabular-nums">Trust 62+</span>
                      </button>
                      <div className="my-1 border-t border-zinc-800/80" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          switchUser({
                            telegramId: `user_${Date.now()}`,
                            username: `contributor_${Math.floor(Math.random() * 900 + 100)}`,
                            firstName: 'New',
                          });
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-zinc-900 text-[#2AABEE] font-medium"
                      >
                        + Create Fresh Test Account
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Segmented Surface Switcher (cleanly prevents crowding at 375px) */}
        <nav
          aria-label="Mobile workspace surface"
          className="md:hidden pb-2.5 pt-0.5 grid grid-cols-3 gap-1"
        >
          {surfaceTabs.map((tab) => {
            const Icon = tab.icon;
            const active = currentSurface === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSurface(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors border ${
                  active
                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                    : 'bg-[#111216] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      </header>

      {showTgLoginModal && <TelegramLoginModal onClose={() => setShowTgLoginModal(false)} />}
    </>
  );
};
