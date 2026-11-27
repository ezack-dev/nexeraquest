import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import {
  Activity,
  Check,
  Clock,
  Copy,
  Database,
  Pause,
  Play,
  RefreshCw,
  Server,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface MonitorViewProps {
  embedded?: boolean;
  onBackToApp?: () => void;
}

interface PingRecord {
  id: string;
  checkedAt: string;
  trigger: 'Initial' | 'Auto (5m)' | 'Manual';
  httpStatus: number;
  ok: boolean;
  latencyMs: number;
  dbStatus: string;
}

const PING_INTERVAL_SEC = 300; // 5 minutes

function formatUptime(seconds?: number): string {
  if (seconds === undefined || Number.isNaN(seconds)) return '—';
  if (seconds < 60) return `${seconds}s`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m ${seconds % 60}s`;
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const MonitorView: React.FC<MonitorViewProps> = ({ embedded = false, onBackToApp }) => {
  const [autoPing, setAutoPing] = useState(true);
  const [countdownSec, setCountdownSec] = useState(PING_INTERVAL_SEC);
  const [checking, setChecking] = useState(false);
  const [copiedUri, setCopiedUri] = useState<string | null>(null);
  const [latest, setLatest] = useState<{
    ok: boolean;
    httpStatus: number;
    database: string;
    dbLatencyMs?: number;
    latencyMs: number;
    uptimeSeconds?: number;
    telegramBot?: string;
    timestamp?: string;
  } | null>(null);
  const [history, setHistory] = useState<PingRecord[]>([]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const primaryHealthUri = `${origin}/health`;
  const apiHealthUri = `${origin}/api/health`;

  const runPing = useCallback(async (trigger: 'Initial' | 'Auto (5m)' | 'Manual') => {
    setChecking(true);
    try {
      const res = await api.getHealth();
      setLatest({
        ok: res.ok,
        httpStatus: res.statusCode,
        database: res.data?.database || (res.ok ? 'connected' : 'disconnected'),
        dbLatencyMs: res.data?.dbLatencyMs,
        latencyMs: res.latencyMs,
        uptimeSeconds: res.data?.uptimeSeconds,
        telegramBot: res.data?.telegramBot,
        timestamp: res.data?.timestamp,
      });

      const entry: PingRecord = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        trigger,
        httpStatus: res.statusCode,
        ok: res.ok,
        latencyMs: res.latencyMs,
        dbStatus: res.data?.database || (res.ok ? 'connected' : 'error'),
      };

      setHistory((prev) => [entry, ...prev].slice(0, 15));
      setCountdownSec(PING_INTERVAL_SEC);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    runPing('Initial');
  }, [runPing]);

  useEffect(() => {
    if (!autoPing) return;

    const timer = window.setInterval(() => {
      setCountdownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [autoPing]);

  useEffect(() => {
    if (autoPing && countdownSec === 0 && !checking) {
      runPing('Auto (5m)');
    }
  }, [autoPing, countdownSec, checking, runPing]);

  const copyUri = (uri: string, label: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedUri(label);
    setTimeout(() => setCopiedUri(null), 2000);
  };

  const body = (
    <div className="space-y-5">
      {/* Standalone Header */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-[#13151B] border border-white/[0.08] rounded-2xl">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-white tracking-[-0.02em]">
                System Health & Uptime Monitor
              </h1>
              <p className="text-[13px] text-zinc-400 mt-0.5">
                Live health check endpoints and 5-minute keep-alive pinger.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-3.5 py-2 bg-[#191C24] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-200 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 min-h-[38px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to App</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => runPing('Manual')}
              disabled={checking}
              className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 min-h-[38px] disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>Ping Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Action Header */}
      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Health & Uptime Monitor</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pings <span className="font-mono text-zinc-300">/api/health</span> every 5 minutes while open and provides your public monitor URI.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/monitor"
              className="px-3 py-2 bg-[#191C24] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-200 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 min-h-[36px]"
            >
              <span>Open /monitor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => runPing('Manual')}
              disabled={checking}
              className="px-3 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 min-h-[36px] disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>Ping Now</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 Telemetry KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-[#0E1015] border border-white/[0.07] rounded-xl">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Service</span>
          </span>
          <p
            className={`text-lg font-bold mt-1.5 ${
              latest === null ? 'text-zinc-300' : latest.ok ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {latest === null ? 'Checking...' : latest.ok ? 'Online' : 'Unhealthy'}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono tabular-nums">
            {latest ? `HTTP ${latest.httpStatus} · ${latest.latencyMs}ms` : 'Waiting for ping'}
          </p>
        </div>

        <div className="p-4 bg-[#0E1015] border border-white/[0.07] rounded-xl">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#3390EC]" />
            <span>Database</span>
          </span>
          <p
            className={`text-lg font-bold mt-1.5 capitalize ${
              latest?.database === 'connected' ? 'text-white' : 'text-amber-400'
            }`}
          >
            {latest?.database || '—'}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono tabular-nums">
            {latest?.dbLatencyMs !== undefined ? `Query ${latest.dbLatencyMs}ms` : 'PostgreSQL / SQLite'}
          </p>
        </div>

        <div className="p-4 bg-[#0E1015] border border-white/[0.07] rounded-xl">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-zinc-300" />
            <span>Process Uptime</span>
          </span>
          <p className="text-lg font-bold text-white font-mono tabular-nums mt-1.5">
            {formatUptime(latest?.uptimeSeconds)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">
            Bot: {latest?.telegramBot || '—'}
          </p>
        </div>

        <div className="p-4 bg-[#0E1015] border border-white/[0.07] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>5-Min Loop</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAutoPing((prev) => !prev);
                setCountdownSec(PING_INTERVAL_SEC);
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border inline-flex items-center gap-1 ${
                autoPing
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-white/[0.04] border-white/[0.08] text-zinc-400'
              }`}
            >
              {autoPing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{autoPing ? 'Active' : 'Paused'}</span>
            </button>
          </div>
          <p className="text-lg font-bold text-white font-mono tabular-nums mt-1.5">
            {autoPing ? formatCountdown(countdownSec) : 'Paused'}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Next browser ping
          </p>
        </div>
      </div>

      {/* Health Check URI Card for External Monitors */}
      <div className="p-4 sm:p-5 bg-[#0E1015] border border-white/[0.07] rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-white">Public Health Check URIs</h3>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
            GET / HEAD · 200 OK
          </span>
        </div>

        <div className="space-y-2">
          {[
            { label: 'primary', uri: primaryHealthUri },
            { label: 'api', uri: apiHealthUri },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                aria-label={`${item.label} health check URL`}
                value={item.uri}
                className="flex-1 min-w-0 bg-[#13151B] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyUri(item.uri, item.label)}
                className="px-3 py-2 bg-[#191C24] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-100 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 shrink-0 min-h-[36px]"
              >
                {copiedUri === item.label ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URI</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Keeping this Monitor page open pings the server every 5 minutes from your browser. To keep a free Render service awake 24/7 even when your browser is closed, add the <span className="font-mono text-zinc-200">/health</span> URI above to an external uptime monitor (such as UptimeRobot, Better Stack, or cron-job.org) on a 5-minute interval.
        </p>
      </div>

      {/* Recent Ping History */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <h3 className="font-semibold text-white">Recent Health Checks</h3>
          <span className="font-mono text-[11px] tabular-nums">{history.length} recorded</span>
        </div>

        {history.length === 0 ? (
          <div className="p-5 bg-[#0E1015] border border-white/[0.07] rounded-xl text-center text-xs text-zinc-500">
            Waiting for first health check...
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06] bg-[#0E1015] border border-white/[0.07] rounded-xl overflow-hidden">
            {history.map((item) => (
              <div
                key={item.id}
                className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.ok ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span className="font-mono text-zinc-300 tabular-nums shrink-0">{item.checkedAt}</span>
                  <span className="text-zinc-400 truncate">{item.trigger}</span>
                </div>
                <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                  <span className={item.ok ? 'text-emerald-400' : 'text-rose-400'}>
                    {item.httpStatus || 'ERR'}
                  </span>
                  <span className="text-zinc-400">{item.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8">
      <div className="bg-[#13151B] border border-white/[0.07] rounded-2xl p-4 sm:p-6">
        {body}
      </div>
    </div>
  );
};
