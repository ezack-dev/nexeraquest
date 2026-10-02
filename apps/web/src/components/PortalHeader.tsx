'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Smartphone,
  LayoutDashboard,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export function PortalHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Inside Telegram WebView: hide the desktop portal chrome so the
    // Mini App gets full viewport. Telegram provides its own nav.
    try {
      const tg = (window as any)?.Telegram?.WebApp;
      if (tg?.initData && tg.initData.length > 0) {
        setIsTelegram(true);
        tg.ready?.();
        tg.expand?.();
      }
    } catch {
      // ignore — browser mode
    }
  }, []);

  if (!mounted) return null;
  if (isTelegram) return null;

  const isMiniApp = pathname === '/' || pathname.startsWith('/quest');
  const isProject = pathname.startsWith('/project');
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 bg-obsidian-900/90 backdrop-blur-md border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between">
      {/* Brand & Wordmark */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-quest-violet to-quest-cyan p-0.5 shadow-lg shadow-quest-violet/20 flex items-center justify-center">
            <span className="text-white font-black text-sm tracking-tighter">NQ</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-wide text-white group-hover:text-quest-violet transition-colors">
              Nexera<span className="text-quest-cyan">Quest</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-widest hidden sm:inline">
              QUEST. CONTRIBUTE. EARN.
            </span>
          </div>
        </Link>

        {/* Live Escrow Invariant Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-quest-emerald/10 border border-quest-emerald/20 text-quest-emerald text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-quest-emerald animate-pulse" />
          <span>Escrow & Ledger Active</span>
        </div>
      </div>

      {/* Experience Switcher Tabs */}
      <nav className="flex items-center gap-1 sm:gap-1.5 bg-obsidian-850 p-1 rounded-xl border border-white/[0.06]">
        <Link
          href="/"
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isMiniApp
              ? 'bg-quest-violet text-white shadow-md shadow-quest-violet/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Mini App</span>
        </Link>

        <Link
          href="/project"
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isProject
              ? 'bg-quest-cyan text-obsidian-950 font-bold shadow-md shadow-quest-cyan/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Project Portal</span>
        </Link>

        <Link
          href="/admin"
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isAdmin
              ? 'bg-quest-amber text-obsidian-950 font-bold shadow-md shadow-quest-amber/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Admin Console</span>
        </Link>
      </nav>

      {/* Sandbox & Quick Links */}
      <div className="flex items-center gap-2">
        <a
          href="/api/v1/openapi.json"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.06] transition-colors"
          title="View OpenAPI / Swagger Specification"
        >
          <span>OpenAPI</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <div className="px-2.5 py-1 rounded-lg bg-obsidian-800 border border-white/[0.08] text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="hidden sm:inline">Sandbox Mode</span>
        </div>
      </div>
    </header>
  );
}
