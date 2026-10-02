'use client';

import React, { useState, useEffect } from 'react';
import { Save, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export function SettingsView() {
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feePct, setFeePct] = useState('15.0');
  const [minFee, setMinFee] = useState('25.0');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/settings');
      const data = await res.json();
      if (data.success) {
        setPricingRules(data.data.pricingRules);
        setFeatureFlags(data.data.featureFlags);
        if (data.data.pricingRules?.[0]) {
          setFeePct(data.data.pricingRules[0].feePercentage.toString());
          setMinFee(data.data.pricingRules[0].minimumFee.toString());
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSavePricing = async () => {
    if (!pricingRules[0]) return;
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricingRule: {
            id: pricingRules[0].id,
            feePercentage: Number(feePct),
            minimumFee: Number(minFee),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Update failed');
      alert('Platform pricing rules updated and logged in security audit.');
      fetchSettings();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleFlag = async (key: string, current: boolean) => {
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureFlagToggle: {
            key,
            isEnabled: !current,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Toggle failed');
      fetchSettings();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Fee & Commercial Engine */}
      <div className="p-5 rounded-2xl bg-obsidian-850 border border-white/[0.08] space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Commercial Pricing Engine Configuration
          </h3>
          <p className="text-xs text-slate-400">
            Dynamically adjust the platform fee model without rewriting contracts or code
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Platform Fee Percentage (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={feePct}
              onChange={(e) => setFeePct(e.target.value)}
              className="w-full bg-obsidian-900 border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-quest-amber"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Minimum Floor Fee (USDT)
            </label>
            <input
              type="number"
              step="1"
              value={minFee}
              onChange={(e) => setMinFee(e.target.value)}
              className="w-full bg-obsidian-900 border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-quest-amber"
            />
          </div>
        </div>

        <button
          onClick={handleSavePricing}
          className="py-2.5 px-4 rounded-xl bg-quest-amber text-obsidian-950 font-bold text-xs shadow-md shadow-quest-amber/20 hover:opacity-95 transition-opacity flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save & Audit Pricing Update</span>
        </button>
      </div>

      {/* Feature Flags */}
      <div className="p-5 rounded-2xl bg-obsidian-850 border border-white/[0.08] space-y-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Feature Flags & Rollout</h3>
          <p className="text-xs text-slate-400">Enable or disable experimental adapters and features in runtime</p>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {featureFlags.map((flag) => (
            <div key={flag.key} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">{flag.name}</span>
                <span className="text-slate-400 text-[11px]">{flag.description}</span>
              </div>
              <button
                onClick={() => handleToggleFlag(flag.key, flag.isEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  flag.isEnabled ? 'bg-quest-emerald' : 'bg-obsidian-950 border border-white/[0.1]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    flag.isEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
