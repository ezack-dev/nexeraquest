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
        throw new Error('Minimum withdrawal is 0.50 USDT');
      }

      const trimmedAddr = destinationAddress.trim();
      if (!trimmedAddr) {
        throw new Error('Please enter your wallet address');
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
        return 'Quest reward credited';
      case 'WITHDRAWAL_REQUESTED':
        return 'Withdrawal pending';
      case 'WITHDRAWAL_SETTLED':
        return 'Withdrawal paid';
      case 'REWARD_REVERSED':
        return 'Withdrawal returned';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white tracking-[-0.02em]">Wallet</h2>
        <p className="text-[13px] text-zinc-400">Your earnings and crypto payouts</p>
      </div>

      {/* Fintech Balance Card */}
      <div className="p-5 bg-[#13151B] border border-white/[0.08] rounded-2xl space-y-5">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Wallet className="w-4 h-4 text-[#3390EC]" />
            <span>Available Balance</span>
          </span>
          <span className="text-[11px] font-medium text-emerald-400">Guaranteed Payout</span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono tracking-tight tabular-nums">
              ${balance?.available?.toFixed(2) ?? '0.00'}
            </span>
            <span className="text-xs font-mono font-medium text-zinc-400">USDT</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Lifetime earnings:{' '}
            <span className="text-zinc-200 font-mono tabular-nums">
              ${balance?.totalEarnings?.toFixed(2) ?? '0.00'} USDT
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/[0.06]">
          <div className="p-3 bg-[#0E1015] rounded-xl border border-white/[0.06]">
            <span className="text-[11px] text-zinc-500 block">Pending</span>
            <p className="text-sm font-semibold text-amber-400 font-mono tabular-nums mt-0.5">
              ${balance?.pending?.toFixed(2) ?? '0.00'}
            </p>
          </div>
          <div className="p-3 bg-[#0E1015] rounded-xl border border-white/[0.06]">
            <span className="text-[11px] text-zinc-500 block">Withdrawn</span>
            <p className="text-sm font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
              ${balance?.withdrawn?.toFixed(2) ?? '0.00'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowWithdrawModal(true)}
          disabled={!balance || balance.available < 0.5}
          className="w-full py-3 px-4 bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white text-zinc-950 font-semibold rounded-xl transition text-sm flex items-center justify-center gap-1.5 min-h-[46px]"
        >
          <span>Withdraw Funds</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Transactions */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-zinc-400 px-0.5">Transactions</h3>

        {!balance?.ledgerEntries || balance.ledgerEntries.length === 0 ? (
          <div className="p-6 bg-[#13151B] border border-white/[0.07] rounded-2xl text-center text-[13px] text-zinc-500">
            No transactions yet. Complete a quest to earn USDT.
          </div>
        ) : (
          <div className="space-y-2">
            {balance.ledgerEntries.map((entry) => {
              const isCredit = entry.direction === 'CREDIT';
              return (
                <div
                  key={entry.id}
                  className="p-3.5 bg-[#13151B] border border-white/[0.07] rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-white/[0.04] text-zinc-400 border-white/[0.07]'
                      }`}
                    >
                      {isCredit ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-zinc-100 truncate">
                        {formatEntryType(entry.type)}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums shrink-0 text-[13px]">
                    <span className={`font-semibold ${isCredit ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {isCredit ? '+' : '-'}${entry.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWithdrawModal(false);
          }}
        >
          <div className="relative w-full max-w-md bg-[#13151B] border-t sm:border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#3390EC]" />
                <h3 className="text-base font-semibold text-white">Withdraw USDT</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                aria-label="Close withdraw modal"
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center gap-2 text-[13px] text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2 text-[13px] text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4 text-[13px]">
              <div>
                <span className="block text-xs text-zinc-400 mb-1.5 font-medium">Network</span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Settlement network">
                  {[
                    { id: 'TON', label: 'TON Network' },
                    { id: 'ARBITRUM', label: 'Arbitrum One' },
                  ].map((net) => (
                    <button
                      type="button"
                      key={net.id}
                      onClick={() => setNetwork(net.id)}
                      className={`py-2.5 px-3 rounded-xl border text-center font-medium transition min-h-[42px] text-xs ${
                        network === net.id
                          ? 'bg-white text-zinc-950 border-white font-semibold'
                          : 'bg-[#0E1015] text-zinc-400 border-white/[0.08] hover:text-zinc-200'
                      }`}
                    >
                      {net.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs text-zinc-400 mb-1.5">
                  <label htmlFor="withdraw-amount" className="font-medium">
                    Amount (USDT)
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount((balance?.available ?? 0).toFixed(2))}
                    className="font-mono text-[#3390EC] hover:underline tabular-nums"
                  >
                    Max: ${balance?.available?.toFixed(2)}
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
                  className="w-full bg-[#0E1015] border border-white/[0.08] rounded-xl p-3 text-sm text-white font-mono tabular-nums placeholder-zinc-600 focus:outline-none focus:border-[#3390EC]"
                  required
                />
              </div>

              <div>
                <label htmlFor="withdraw-address" className="block text-xs text-zinc-400 mb-1.5 font-medium">
                  Recipient Wallet Address
                </label>
                <input
                  id="withdraw-address"
                  name="destinationAddress"
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder={network === 'TON' ? 'EQ... (TON Address)' : '0x... (Arbitrum Address)'}
                  className="w-full bg-[#0E1015] border border-white/[0.08] rounded-xl p-3 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-[#3390EC]"
                  required
                />
              </div>

              <p className="text-xs text-zinc-500">
                No withdrawal fees · Minimum 0.50 USDT · Sent directly to your address.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center min-h-[46px]"
              >
                {submitting ? 'Submitting...' : 'Confirm Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
