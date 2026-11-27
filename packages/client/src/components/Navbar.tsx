import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { TelegramLoginModal } from './TelegramLoginModal.js';
import { UserAvatar } from './UserAvatar.js';
import { Shield, User, Building2, ShieldAlert, Wallet, ChevronDown, Check, LogIn, LogOut } from 'lucide-react';

interface NavbarProps {
  currentSurface: 'miniapp' | 'portal' | 'admin';
  setSurface: (surface: 'miniapp' | 'portal' | 'admin') => void;
}

const NexeraLogo: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M12 2.5L20 7.1V16.9L12 21.5L4 16.9V7.1L12 2.5Z"
      stroke="#3390EC"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path
      d="M8.75 14.75V9.25L15.25 14.75V9.25"
      stroke="#F4F4F5"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ currentSurface, setSurface }) => {
  const { user, balance, switchUser, logoutToDemo, authMode, authConfig } = useAuth();
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
    { id: 'miniapp' as const, label: 'Quests', fullLabel: 'Mini App', icon: User },
    { id: 'portal' as const, label: 'Sponsors', fullLabel: 'Project Portal', icon: Building2 },
    { id: 'admin' as const, label: 'Admin', fullLabel: 'Admin Ops', icon: ShieldAlert },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0A0B0E]/85 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          {/* Primary Row */}
          <div className="flex items-center justify-between h-14 gap-2">
            {/* Brand */}
            <button
              type="button"
              onClick={() => setSurface('miniapp')}
              className="flex items-center gap-2.5 text-left focus:outline-none shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-[#13151B] border border-white/[0.08] flex items-center justify-center">
                <NexeraLogo />
              </div>
              <span className="font-semibold text-[15px] tracking-[-0.02em] text-white">
                NexeraQuest
              </span>
            </button>

            {/* Desktop Workspace Switcher */}
            <nav
              aria-label="Workspace surface"
              className="hidden md:flex items-center p-0.5 bg-[#13151B] rounded-lg border border-white/[0.07]"
            >
              {surfaceTabs.map((tab) => {
                const Icon = tab.icon;
                const active = currentSurface === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSurface(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                      active
                        ? 'bg-white/[0.09] text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.fullLabel}</span>
                  </button>
                );
              })}
            </nav>

            {/* Account & Balance Summary */}
            <div className="flex items-center gap-2 shrink-0">
              {user && (
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#13151B] border border-white/[0.07] rounded-lg font-mono font-medium tabular-nums text-emerald-400">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
                    <span>${balance?.available?.toFixed(2) ?? '0.00'}</span>
                    <span className="hidden sm:inline text-zinc-500 text-[11px]">USDT</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#13151B] border border-white/[0.07] rounded-lg text-zinc-300 text-xs tabular-nums">
                    <Shield className="w-3.5 h-3.5 text-[#3390EC]" />
                    <span className="font-mono text-[12px]">{user.trustScore}/100</span>
                  </div>
                </div>
              )}

              {/* Account Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 bg-[#13151B] hover:bg-[#191C24] border border-white/[0.08] rounded-lg text-xs text-zinc-200 transition min-h-[34px]"
                >
                  <UserAvatar
                    user={user}
                    sizeClass="w-5 h-5"
                    roundedClass="rounded-full"
                    textClass="text-[9px]"
                  />
                  <span className="font-medium max-w-[68px] sm:max-w-[120px] truncate">
                    @{user?.username || 'Guest'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 bg-[#13151B] border border-white/[0.1] rounded-xl shadow-2xl p-1.5 z-50"
                  >
                    <div className="px-2.5 py-2 mb-1 flex items-center gap-2.5 bg-[#0E1015] border border-white/[0.06] rounded-lg">
                      <UserAvatar
                        user={user}
                        sizeClass="w-8 h-8"
                        roundedClass="rounded-lg"
                        textClass="text-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Contributor'}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono truncate">
                          @{user?.username || 'guest'}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                          authMode === 'demo'
                            ? 'bg-white/[0.05] text-zinc-400'
                            : 'bg-[#3390EC]/15 text-[#3390EC]'
                        }`}
                      >
                        {authMode === 'telegram_miniapp'
                          ? 'Mini App'
                          : authMode === 'telegram_widget'
                          ? 'Verified'
                          : 'Sandbox'}
                      </span>
                    </div>

                    {authMode === 'demo' && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          setShowTgLoginModal(true);
                        }}
                        className="w-full text-left px-2.5 py-2 mb-1 rounded-lg text-xs bg-[#3390EC] hover:bg-[#2481CC] text-white font-semibold flex items-center justify-center gap-2 transition"
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
                        className="w-full text-left px-2.5 py-2 mb-1 rounded-lg text-xs hover:bg-white/[0.05] text-zinc-300 font-medium flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Return to Preview Account</span>
                      </button>
                    )}

                    {authConfig.demoModeEnabled && (
                      <>
                        <div className="my-1 border-t border-white/[0.06]" />
                        <p className="text-[11px] font-medium text-zinc-500 px-2.5 py-1">
                          Switch Preview Account
                        </p>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            switchUser({ telegramId: '987654321', username: 'alex_web3', firstName: 'Alex' });
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-white/[0.05] text-zinc-200 flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1.5">
                            {authMode === 'demo' && user?.username === 'alex_web3' && (
                              <Check className="w-3.5 h-3.5 text-[#3390EC]" />
                            )}
                            <span>@alex_web3</span>
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono tabular-nums">Pioneer</span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            switchUser({ telegramId: '123456789', username: 'cryptosam', firstName: 'Sam' });
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-white/[0.05] text-zinc-200 flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1.5">
                            {authMode === 'demo' && user?.username === 'cryptosam' && (
                              <Check className="w-3.5 h-3.5 text-[#3390EC]" />
                            )}
                            <span>@cryptosam</span>
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono tabular-nums">Member</span>
                        </button>
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
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-white/[0.05] text-[#3390EC] font-medium"
                        >
                          + New Contributor Account
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Compact Surface Tabs */}
          <nav aria-label="Mobile workspace surface" className="md:hidden grid grid-cols-3 gap-1 pb-2">
            {surfaceTabs.map((tab) => {
              const Icon = tab.icon;
              const active = currentSurface === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSurface(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-white/[0.09] text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
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
