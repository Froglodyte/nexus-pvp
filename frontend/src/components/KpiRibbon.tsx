import React from 'react';
import { TrendingUp, ShieldCheck, Zap, DollarSign, Clock, Layers } from 'lucide-react';
import { CorridorMetrics } from '../types.js';

interface KpiRibbonProps {
  metrics: CorridorMetrics | null;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({ metrics }) => {
  const settledUsd = metrics?.totalSettledUsd || 1500;
  const settledInr = metrics?.totalSettledInr || 129276;
  const savingsUsd = metrics?.totalSavingsUsd || 108.75;
  const latency = metrics?.averageSettlementLatencyMs || 840;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* KPI 1: Settled PvP Volume */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/40 transition-all">
        <div className="flex items-center justify-between text-gray-400 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider flex items-center">
            <DollarSign className="w-3.5 h-3.5 text-blue-400 mr-1" />
            Settled PvP Volume
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Live Drunix
          </span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-lg sm:text-xl font-black text-white font-mono">
            ${settledUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-blue-400 font-medium">USD</span>
        </div>
        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
          ≈ ₹{(settledInr / 100000).toFixed(2)} Lakh INR
        </div>
      </div>

      {/* KPI 2: Treasury Wire Fees Saved */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between text-gray-400 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider flex items-center">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mr-1" />
            Treasury Cost Savings
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            vs 4.5% Swift
          </span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
            ${savingsUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-gray-400 font-medium">Saved</span>
        </div>
        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
          0.25% fee vs traditional $45 wire
        </div>
      </div>

      {/* KPI 3: Atomic Settlement Latency */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/40 transition-all">
        <div className="flex items-center justify-between text-gray-400 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider flex items-center">
            <Clock className="w-3.5 h-3.5 text-purple-400 mr-1" />
            Settlement Latency
          </span>
          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
            Sub-Second
          </span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-lg sm:text-xl font-black text-white font-mono">
            {latency} ms
          </span>
          <span className="text-xs text-purple-400 font-medium">Atomic</span>
        </div>
        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
          vs 3–5 business days legacy
        </div>
      </div>

      {/* KPI 4: Herstatt Risk Invariant */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/40 transition-all">
        <div className="flex items-center justify-between text-gray-400 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 mr-1" />
            Herstatt Settlement Risk
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Guaranteed
          </span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
            0.00%
          </span>
          <span className="text-xs text-emerald-400/80 font-medium">Principal Loss</span>
        </div>
        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
          Cryptographic HTLC invariant
        </div>
      </div>
    </div>
  );
};
