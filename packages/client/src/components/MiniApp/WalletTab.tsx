import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api.js';
import { Wallet, ArrowUpRight, Clock, CheckCircle2, ShieldCheck, X, AlertCircle } from 'lucide-react';

export const WalletTab: React.FC = () => {
  const { user, balance, refreshUser } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [network, setNetwork] = useState<string>('TON');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSubmitting(true);
      setWithdrawError(null);
      const amount = parseFloat(withdrawAmount);

      if (isNaN(amount) || amount < 0.5) {
        throw new Error('Minimum withdrawal amount is 0.50 USDT');
      }

      const trimmedAddr = destinationAddress.trim();
      if (!trimmedAddr) {
        throw new Error('Please enter a valid wallet address');
      }

      const evmRegex = /^0x[a-fA-F0-9]{40}$/;
      const tonRegex = /^((EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}|0:[a-fA-F0-9]{64})$/;

      if (network === 'ARBITRUM' && !evmRegex.test(trimmedAddr)) {
        throw new Error('Invalid Arbitrum address. Expected a 42-character 0x... EVM address.');
      }

      if (network === 'TON' && !tonRegex.test(trimmedAddr)) {
        throw new Error('Invalid TON address. Expected an EQ.../UQ... address (48 characters).');
      }

      const res = await api.requestWithdrawal({
        userId: user.id,
        amount,
        destinationAddress: trimmedAddr,
        network,
      });

      setWithdrawSuccess(res.message);
      await refreshUser();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(null);
        setWithdrawAmount('');
        setDestinationAddress('');
      }, 1600);
    } catch (err: any) {
      setWithdrawError(err.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatEntryType = (type: string) => {
    switch (type) {
      case 'REWARD_EARNED':
        return 'Quest Reward Earned';
      case 'WITHDRAWAL_REQUESTED':
        return 'Withdrawal Reserved';
      case 'WITHDRAWAL_SETTLED':
        return 'Withdrawal Settled';
      case 'REWARD_REVERSED':
        return 'Withdrawal Returned';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Institutional Balance Summary Card */}
      <div className="p-5 bg-[#111216] border border-zinc-800/90 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Wallet className="w-4 h-4 text-[#2AABEE]" />
            <span>Available Balance</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-medium">
            100% Escrow Backed
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-100 font-mono tracking-tight tabular-nums">
              ${balance?.available?.toFixed(2) ?? '0.00'}
            </span>
            <span className="text-xs font-mono font-semibold text-zinc-400">USDT</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Total Earned:{' '}
            <span className="text-zinc-200 font-mono tabular-nums">
              ${balance?.totalEarnings?.toFixed(2) ?? '0.00'} USDT
            </span>
          </p>
        </div>

        {/* Pending & Settled breakdown */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-zinc-800/80">
          <div className="p-3 bg-[#0B0C0F] rounded-xl border border-zinc-800/80">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Pending Cashout</span>
            <p className="text-sm font-bold text-amber-400 font-mono tabular-nums mt-0.5">
              ${balance?.pending?.toFixed(2) ?? '0.00'}
            </p>
          </div>
          <div className="p-3 bg-[#0B0C0F] rounded-xl border border-zinc-800/80">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Settled to Wallet</span>
            <p className="text-sm font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
              ${balance?.withdrawn?.toFixed(2) ?? '0.00'}
            </p>
          </div>
        </div>

        {/* Cash-Out Action */}
        <button
          type="button"
          onClick={() => setShowWithdrawModal(true)}
          disabled={!balance || balance.available < 0.5}
          className="w-full py-3 px-4 bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
        >
          <span>Cash Out to Crypto Wallet</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Ledger History */}
      <div className="space-y-2.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-1">
          Double-Entry Ledger Activity
        </h3>

        {!balance?.ledgerEntries || balance.ledgerEntries.length === 0 ? (
          <div className="p-6 bg-[#111216] border border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
            No transactions recorded yet. Complete your first quest to earn.
          </div>
        ) : (
          <div className="space-y-2">
            {balance.ledgerEntries.map((entry) => {
              const isCredit = entry.direction === 'CREDIT';
              return (
                <div
                  key={entry.id}
                  className="p-3.5 bg-[#111216] border border-zinc-800/90 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {isCredit ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-200 truncate">
                        {formatEntryType(entry.type)}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums shrink-0">
                    <span className={`font-semibold ${isCredit ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {isCredit ? '+' : '-'}${entry.amount.toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cash Out Modal (Mobile Bottom-Sheet / Desktop Dialog) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#111216] border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between border-b border-zinc-800/90 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2AABEE]" />
                <h3 className="text-sm sm:text-base font-bold text-zinc-100">Withdraw to Wallet</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                aria-label="Close withdraw modal"
                className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4 text-xs">
              <div>
                <span className="block text-zinc-400 mb-1.5 font-medium">Settlement Network</span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Settlement network">
                  {[
                    { id: 'TON', label: 'TON (Native)' },
                    { id: 'ARBITRUM', label: 'Arbitrum (EVM)' },
                  ].map((net) => (
                    <button
                      type="button"
                      key={net.id}
                      onClick={() => setNetwork(net.id)}
                      className={`py-2.5 px-3 rounded-xl border text-center font-semibold transition min-h-[42px] ${
                        network === net.id
                          ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                          : 'bg-[#0B0C0F] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {net.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-zinc-400 mb-1.5">
                  <label htmlFor="withdraw-amount" className="font-medium">
                    Withdrawal Amount
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount((balance?.available ?? 0).toFixed(2))}
                    className="font-mono text-[11px] text-[#2AABEE] hover:underline tabular-nums"
                  >
                    Max: ${balance?.available?.toFixed(2)} USDT
                  </button>
                </div>
                <input
                  id="withdraw-amount"
                  name="withdrawAmount"
                  type="number"
                  step="0.01"
                  min="0.5"
                  max={balance?.available ?? 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.50"
                  className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 font-mono tabular-nums placeholder-zinc-600 focus:outline-none focus:border-[#2AABEE]"
                  required
                />
              </div>

              <div>
                <label htmlFor="withdraw-address" className="block text-zinc-400 mb-1.5 font-medium">
                  Destination Wallet Address
                </label>
                <input
                  id="withdraw-address"
                  name="destinationAddress"
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder={network === 'TON' ? 'EQ... (TON Address)' : '0x... (EVM Address)'}
                  className="w-full bg-[#0B0C0F] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-[#2AABEE]"
                  required
                />
              </div>

              <div className="p-3 bg-[#0B0C0F] rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                <p>• Zero platform withdrawal fees applied.</p>
                <p>• Payouts are authorized and settled via non-custodial batch transfer.</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center min-h-[46px]"
              >
                {submitting ? 'Submitting Request...' : 'Confirm Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
