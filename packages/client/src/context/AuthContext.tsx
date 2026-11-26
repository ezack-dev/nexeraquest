import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api.js';
import { User, BalanceAccount } from '../types.js';

export type AuthMode = 'telegram_miniapp' | 'telegram_widget' | 'demo';

export interface AuthConfig {
  botUsername: string | null;
  telegramAuthConfigured: boolean;
  demoModeEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  balance: BalanceAccount | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  switchUser: (mockData: { telegramId: string; username: string; firstName: string }) => Promise<void>;
  loginWithTelegramWidget: (widgetData: any) => Promise<void>;
  logoutToDemo: () => Promise<void>;
  isTelegram: boolean;
  authMode: AuthMode;
  authConfig: AuthConfig;
}

const SESSION_KEY = 'nexera_tg_session';

const AuthContext = createContext<AuthContextType>({
  user: null,
  balance: null,
  loading: true,
  refreshUser: async () => {},
  switchUser: async () => {},
  loginWithTelegramWidget: async () => {},
  logoutToDemo: async () => {},
  isTelegram: false,
  authMode: 'demo',
  authConfig: { botUsername: null, telegramAuthConfigured: false, demoModeEnabled: true },
});

function getReferralParam(): string | undefined {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const urlRef = searchParams.get('ref');
    if (urlRef) return urlRef.replace(/^ref_/, '');

    const tgStartParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (tgStartParam) return String(tgStartParam).replace(/^ref_/, '');
  } catch {
    return undefined;
  }
  return undefined;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<BalanceAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTelegram, setIsTelegram] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>('demo');
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    botUsername: null,
    telegramAuthConfigured: false,
    demoModeEnabled: true,
  });

  const loadUserBalance = async (userId: string) => {
    const balRes = await api.getUserBalance(userId);
    setBalance(balRes);
  };

  const initAuth = async (mock?: { telegramId: string; username: string; firstName: string }) => {
    try {
      setLoading(true);

      // Load public auth config (botUsername, demo flag)
      let config: AuthConfig = { botUsername: null, telegramAuthConfigured: false, demoModeEnabled: true };
      try {
        config = await api.getAuthConfig();
        setAuthConfig(config);
      } catch {
        // Fallback to defaults if config fetch fails
      }

      const referralCode = getReferralParam();
      const tg = (window as any).Telegram?.WebApp;
      let initData = '';

      if (tg && tg.initData && tg.initData.length > 0) {
        setIsTelegram(true);
        initData = tg.initData;
        tg.ready();
        tg.expand();
      }

      // 1. Real Telegram Mini App session takes priority
      if (initData) {
        const res = await api.authTelegram({ initData, referralCode });
        setUser(res.user);
        setAuthMode('telegram_miniapp');
        if (res.user?.id) await loadUserBalance(res.user.id);
        return;
      }

      // 2. If switching explicitly to a demo identity
      if (mock) {
        localStorage.removeItem(SESSION_KEY);
        const res = await api.authTelegram({ mockUser: mock, referralCode });
        setUser(res.user);
        setAuthMode('demo');
        if (res.user?.id) await loadUserBalance(res.user.id);
        return;
      }

      // 3. Try restoring real Telegram Widget browser session
      const savedToken = localStorage.getItem(SESSION_KEY);
      if (savedToken) {
        try {
          const sessRes = await api.authSession(savedToken);
          setUser(sessRes.user);
          setAuthMode((sessRes.authMode as AuthMode) || 'telegram_widget');
          if (sessRes.user?.id) await loadUserBalance(sessRes.user.id);
          return;
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }

      // 4. Hybrid fallback to sandbox demo account if enabled
      if (config.demoModeEnabled) {
        const res = await api.authTelegram({
          mockUser: { telegramId: '987654321', username: 'alex_web3', firstName: 'Alex' },
          referralCode,
        });
        setUser(res.user);
        setAuthMode('demo');
        if (res.user?.id) await loadUserBalance(res.user.id);
      }
    } catch (err) {
      console.error('Failed to initialize user session:', err);
    } finally {
      setLoading(false);
    }
  };

  const loginWithTelegramWidget = async (widgetData: any) => {
    setLoading(true);
    try {
      const referralCode = getReferralParam();
      const res = await api.authTelegramWidget({ widgetData, referralCode });
      localStorage.setItem(SESSION_KEY, res.sessionToken);
      setUser(res.user);
      setAuthMode('telegram_widget');
      if (res.user?.id) await loadUserBalance(res.user.id);
    } finally {
      setLoading(false);
    }
  };

  const logoutToDemo = async () => {
    localStorage.removeItem(SESSION_KEY);
    await initAuth({ telegramId: '987654321', username: 'alex_web3', firstName: 'Alex' });
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const prof = await api.getUserProfile(user.id);
      setUser(prof.user);
      await loadUserBalance(user.id);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const switchUser = async (mockData: { telegramId: string; username: string; firstName: string }) => {
    await initAuth(mockData);
  };

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        balance,
        loading,
        refreshUser,
        switchUser,
        loginWithTelegramWidget,
        logoutToDemo,
        isTelegram,
        authMode,
        authConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
