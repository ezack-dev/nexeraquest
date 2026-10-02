'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { SUPPORTED_NETWORKS, WITHDRAWAL_LIMITS } from '@nexeraquest/config';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  currency: string;
  onSuccess: () => void;
}

export function WithdrawalModal({
  isOpen,
  onClose,
  availableBalance,
  currency,
  onSuccess,
  trustScore = 100,
}: WithdrawalModalProps & { trustScore?: number }) {
  const TRUST_GATE = 30;
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState(SUPPORTED_NETWORKS[0].id);
  const [address, setAddress] = useState('');
  const [step, setStep] = useState<'INPUT' | 'CONFIRM' | 'SUCCESS'>('INPUT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const fee = Math.max(WITHDRAWAL_LIMITS.minimumFee, Number((numAmount * (WITHDRAWAL_LIMITS.feeRatePercentage / 100)).toFixed(4)));
  const netAmount = Math.max(0, Number((numAmount - fee).toFixed(4)));

  const handleMax = () => {
    setAmount(availableBalance.toString());
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numAmount < WITHDRAWAL_LIMITS.minimumAmount) {
      setError(`Minimum withdrawal is ${WITHDRAWAL_LIMITS.minimumAmount} ${currency}.`);
      return;
    }
    if (numAmount > availableBalance) {
      setError(`Insufficient balance. You have ${availableBalance} ${currency} available.`);
      return;
    }
    if (!address || address.trim().length < 10) {
      setError('Please enter a valid destination crypto wallet address.');
      return;
    }

    setStep('CONFIRM');
  };

  const handleExecuteWithdrawal = async () => {
    setLoading(true);
    setError(null);

    try {
      const idempotencyKey = `wd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const res = await fetch('/api/v1/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          network: network.toUpperCase(),
          destinationAddress: address.trim(),
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit withdrawal request.');
      }

      setStep('SUCCESS');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setStep('INPUT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-obsidian-900 border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-slide-up sm:animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {trustScore < TRUST_GATE ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-quest-amber/10 border border-quest-amber/30 text-quest-amber flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Withdrawals locked</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your Trust Score ({trustScore}) is below the required {TRUST_GATE}. Complete more
              quests honestly to unlock cash-out.
            </p>
          </div>
        ) : step === 'INPUT' && (
          <form onSubmit={handleProceedToConfirm}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-quest-emerald/10 border border-quest-emerald/20 flex items-center justify-center text-quest-emerald font-bold">
                $
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Withdraw Funds</h3>
                <p className="text-xs text-slate-400">Cashout verified balance to external wallet</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Network Selection */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Destination Network
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_NETWORKS.map((net) => (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => setNetwork(net.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      network === net.id
                        ? 'border-quest-violet bg-quest-violet/10 text-white font-semibold'
                        : 'border-white/[0.08] bg-obsidian-850 text-slate-400 hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="font-bold">{net.name.split(' ')[0]}</div>
                    <div className="text-[10px] opacity-75">{net.asset}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300">Amount ({currency})</span>
                <span className="text-slate-400">
                  Available:{' '}
                  <span className="text-quest-emerald font-semibold">
                    {availableBalance.toFixed(2)} {currency}
                  </span>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-quest-violet pr-16"
                  required
                />
                <button
                  type="button"
                  onClick={handleMax}
                  className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-bold text-quest-violet transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Destination Address */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Recipient Wallet Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. EQBvW8... / 0x48f..."
                className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-quest-violet"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Make sure your address matches the selected {network.toUpperCase()} network.
              </p>
            </div>

            {/* Economics Breakdown */}
            <div className="p-3 rounded-xl bg-obsidian-850 border border-white/[0.06] mb-5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Requested Amount</span>
                <span className="text-white font-medium">{numAmount.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Network & Handling Fee (1%)</span>
                <span className="text-slate-300 font-medium">{fee.toFixed(2)} {currency}</span>
              </div>
              <div className="border-t border-white/[0.06] pt-1.5 flex justify-between font-bold">
                <span className="text-slate-200">You Receive</span>
                <span className="text-quest-emerald">{netAmount.toFixed(2)} {currency}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-quest-emerald to-teal-500 text-obsidian-950 font-bold text-sm shadow-lg shadow-quest-emerald/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
            >
              <span>Review Cashout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'CONFIRM' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-quest-amber/10 border border-quest-amber/20 flex items-center justify-center text-quest-amber">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Cashout</h3>
                <p className="text-xs text-slate-400">Please review withdrawal destination</p>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-obsidian-850 border border-white/[0.08] mb-5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Net Payout Amount</span>
                <span className="text-xl font-black text-quest-emerald">
                  {netAmount.toFixed(2)} {currency}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Network</span>
                <span className="text-white font-semibold">{network.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Destination Address</span>
                <span className="text-white font-mono break-all">{address}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-quest-amber/10 border border-quest-amber/20 text-quest-amber text-[11px] mb-5 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                NexeraQuest never asks for your seed phrase or private key. Funds are settled via an immutable on-chain ledger payout.
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('INPUT')}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecuteWithdrawal}
                disabled={loading}
                className="flex-[2] py-2.5 rounded-xl bg-quest-emerald text-obsidian-950 font-bold text-xs shadow-lg shadow-quest-emerald/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm & Cashout</span>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-quest-emerald/10 border border-quest-emerald/20 text-quest-emerald flex items-center justify-center mx-auto mb-3 shadow-lg shadow-quest-emerald/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Cashout Requested!</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto mb-5">
              Your request for <span className="font-bold text-quest-emerald">{netAmount.toFixed(2)} {currency}</span> has been submitted to the ledger pipeline.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-quest-violet text-white font-bold text-xs hover:bg-quest-violet/90 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
