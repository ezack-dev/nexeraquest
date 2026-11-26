import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { X, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

interface TelegramLoginModalProps {
  onClose: () => void;
}

export const TelegramLoginModal: React.FC<TelegramLoginModalProps> = ({ onClose }) => {
  const { authConfig, loginWithTelegramWidget } = useAuth();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const botUsername = authConfig.botUsername;
    if (!botUsername || !widgetContainerRef.current) return;

    // Register global callback for Telegram Login Widget
    (window as any).onNexeraTelegramAuth = async (tgUser: any) => {
      try {
        setError(null);
        await loginWithTelegramWidget(tgUser);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Telegram login failed');
      }
    };

    const container = widgetContainerRef.current;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'onNexeraTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    container.appendChild(script);

    return () => {
      delete (window as any).onNexeraTelegramAuth;
      container.innerHTML = '';
    };
  }, [authConfig.botUsername]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[#111216] border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between border-b border-zinc-800/90 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2AABEE]" />
            <h3 className="text-sm sm:text-base font-bold text-zinc-100">Sign in with Telegram</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Telegram sign-in modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Connect your real Telegram account using Telegram&apos;s cryptographic authentication. No passwords, email, or wallet seed phrases required.
        </p>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {authConfig.botUsername ? (
          <div className="space-y-3">
            <div
              ref={widgetContainerRef}
              className="min-h-[48px] flex items-center justify-center p-4 bg-[#0B0C0F] border border-zinc-800 rounded-xl"
            />
            <p className="text-[11px] text-zinc-500 text-center">
              Requires this domain to be registered via <span className="font-mono text-zinc-300">/setdomain</span> in{' '}
              <span className="font-mono text-zinc-300">@BotFather</span> for <span className="font-mono text-[#2AABEE]">@{authConfig.botUsername}</span>.
            </p>
            <a
              href={`https://t.me/${authConfig.botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-[#171920] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <span>Open @{authConfig.botUsername} inside Telegram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="p-4 bg-[#0B0C0F] border border-zinc-800 rounded-xl space-y-2 text-xs">
            <p className="font-semibold text-zinc-200">Bot Token Not Configured Yet</p>
            <p className="text-zinc-400 leading-relaxed">
              This instance is currently running in Hybrid Demo mode because a live <span className="font-mono text-zinc-300">TELEGRAM_BOT_TOKEN</span> has not been set yet.
            </p>
            <p className="text-[11px] text-zinc-500">
              Once deployed to Render with your <span className="font-mono text-zinc-300">@BotFather</span> token, the live Telegram Sign-In widget renders automatically here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
