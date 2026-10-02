'use client';

import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { WithdrawalModal } from './WithdrawalModal';

interface WalletTabProps {
  balance: any;
  transactions: any[];
  trustScore?: number;
  onRefresh: () => void;
}

export function WalletTab({ balance, transactions, trustScore = 100, onRefresh }: WalletTabProps) {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  return (
    <div className="space-y-4 pb-20">
      {/* Wallet Balance Hero Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-obsidian-850 via-obsidian-900 to-obsidian-800 border border-white/[0.08] shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-slate-400">Total Account Balance</span>
          <span className="font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
            Audit Grade
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {(balance?.available || 48.5).toFixed(2)}
            </span>
            <span className="text-sm font-bold text-quest-emerald">USDT</span>
          </div>
          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="px-4 py-2 rounded-xl bg-quest-emerald text-obsidian-950 text-xs font-bold shadow-md shadow-quest-emerald/20 hover:opacity-95 transition-opacity"
          >
            Cashout
          </button>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06] text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block mb-0.5">Available</span>
            <span className="font-bold text-white">
              {(balance?.available || 48.5).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block mb-0.5">Pending Cashout</span>
            <span className="font-bold text-quest-amber">
              {(balance?.pending || 5.0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block mb-0.5">Paid to Wallet</span>
            <span className="font-bold text-quest-cyan">
              {(balance?.paid || 120.0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Ledger Journal History
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Immutable</span>
        </div>

        <div className="space-y-2">
          {transactions.map((tx) => {
            const isCredit = tx.amount > 0;
            return (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-obsidian-850 border border-white/[0.06] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCredit
                        ? 'bg-quest-emerald/10 text-quest-emerald'
                        : 'bg-quest-amber/10 text-quest-amber'
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">{tx.type}</span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                      {tx.referenceNote}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-black font-mono block ${
                      isCredit ? 'text-quest-emerald' : 'text-slate-300'
                    }`}
                  >
                    {isCredit ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} {tx.currency}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={balance?.available || 48.5}
        currency={balance?.currency || 'USDT'}
        trustScore={trustScore}
        onSuccess={() => {
          onRefresh();
          setIsWithdrawOpen(false);
        }}
      />
    </div>
  );
}
