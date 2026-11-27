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

    (window as any).onNexeraTelegramAuth = async (tgUser: any) => {
      try {
        setError(null);
        await loginWithTelegramWidget(tgUser);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Telegram sign-in failed');
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
    script.setAttribute('data-userpic', 'true');
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
      <div className="relative w-full max-w-md bg-[#13151B] border-t sm:border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3390EC]" />
            <h3 className="text-base font-semibold text-white">Sign in with Telegram</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Telegram sign-in modal"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[13px] text-zinc-400 leading-relaxed">
          Verify your Telegram account to save quest progress, build your Trust Score, and withdraw rewards directly.
        </p>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center gap-2 text-[13px] text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {authConfig.botUsername ? (
          <div className="space-y-3">
            <div
              ref={widgetContainerRef}
              className="min-h-[48px] flex items-center justify-center p-4 bg-[#0E1015] border border-white/[0.07] rounded-xl"
            />
            <a
              href={`https://t.me/${authConfig.botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-[#191C24] hover:bg-white/[0.09] border border-white/[0.09] text-zinc-200 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5"
            >
              <span>Open @{authConfig.botUsername} in Telegram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="p-4 bg-[#0E1015] border border-white/[0.07] rounded-xl space-y-1.5 text-[13px]">
            <p className="font-semibold text-zinc-200">Telegram Bot Not Connected</p>
            <p className="text-zinc-400 leading-relaxed">
              This local preview is using sandbox accounts. Set <span className="font-mono text-zinc-300">TELEGRAM_BOT_TOKEN</span> on your host to enable real Telegram sign-in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
