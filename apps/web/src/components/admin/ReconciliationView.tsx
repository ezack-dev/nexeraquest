'use client';

import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ReconciliationViewProps {
  latestRun?: any;
}

export function ReconciliationView({ latestRun }: ReconciliationViewProps) {
  const [report, setReport] = useState<any>(latestRun);
  const [running, setRunning] = useState(false);

  const handleRunReconciliation = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/v1/admin/reconciliation/run', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Reconciliation failed');
      setReport(data.data);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Ledger Balance Reconciliation Runner
          </h2>
          <p className="text-xs text-slate-400">
            Automated verification comparing double-entry journal sums against balance accounts
          </p>
        </div>

        <button
          onClick={handleRunReconciliation}
          disabled={running}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-quest-amber text-obsidian-950 font-bold text-xs shadow-md shadow-quest-amber/20 hover:opacity-95 transition-opacity"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Accounts...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Execute Reconciliation Check</span>
            </>
          )}
        </button>
      </div>

      {/* Reconciliation Mathematical Invariant Explainer */}
      <div className="p-4 rounded-xl bg-obsidian-850 border border-white/[0.06] text-xs space-y-1.5 font-mono text-slate-300">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">
          Accounting Invariant Formula
        </span>
        <div className="text-quest-cyan font-bold">
          SUM(Ledger Credits) - SUM(Ledger Debits) == BalanceAccount.Available + BalanceAccount.Pending
        </div>
        <p className="text-slate-400 font-sans text-[11px]">
          If any discrepancy is detected, the run is flagged as DISCREPANCY_DETECTED without modifying balances silently.
        </p>
      </div>

      {/* Latest Report Display */}
      {report && (
        <div className="p-5 rounded-2xl bg-obsidian-850 border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {report.status === 'PASSED' ? (
                <CheckCircle2 className="w-5 h-5 text-quest-emerald" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              <span className="text-sm font-bold text-white">Status: {report.status}</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Checked: {report.totalChecked || report.totalAccountsChecked || 0} Accounts
            </span>
          </div>

          <p className="text-xs text-slate-300">{report.summary}</p>

          {report.discrepanciesFound > 0 && report.discrepancies && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 space-y-1">
              <span className="font-bold block">Discrepancy Details:</span>
              <pre className="text-[11px] overflow-x-auto">
                {JSON.stringify(report.discrepancies, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
