import React from 'react';
import {
  Building2,
  DollarSign,
  TrendingDown,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { FXQuote, HTLCEscrow, SystemStatus } from '../types.js';

interface CitiPanelProps {
  usdAmount: number;
  setUsdAmount: (val: number) => void;
  senderId: string;
  setSenderId: (val: string) => void;
  quote: FXQuote | null;
  activeEscrow: HTLCEscrow | null;
  systemStatus: SystemStatus | null;
  onInitiate: () => void;
  isLoading: boolean;
  isLocked: boolean;
}

export const CitiPanel: React.FC<CitiPanelProps> = ({
  usdAmount,
  setUsdAmount,
  senderId,
  setSenderId,
  quote,
  activeEscrow,
  systemStatus,
  onInitiate,
  isLoading,
  isLocked,
}) => {
  const quickAmounts = [500, 1000, 5000, 25000];

  return (
    <div className="glass-panel-citi rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-blue-500/30">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-blue-500/20 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Citi Overseas Treasury Portal</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 uppercase">
                  New York / USD
                </span>
              </div>
              <p className="text-xs text-blue-200/60 font-mono">Node ID: CITI-NY-WHOLESALE-01</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Wholesale FX Ready
            </div>
          </div>
        </div>

        {/* Sender Identity & Amount Inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Sender Institutional Corporate Account
            </label>
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors mono"
              placeholder="CITI_NY_TREASURY_CORP_01"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-300">
                Remittance Principal (USD)
              </label>
              <span className="text-xs text-blue-300 font-mono">
                1 USD = ₹{quote?.fxRate.toFixed(2) || '86.40'} INR
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <DollarSign className="w-4 h-4 text-blue-400" />
              </div>
              <input
                type="number"
                min="10"
                step="100"
                value={usdAmount}
                onChange={(e) => setUsdAmount(Math.max(1, Number(e.target.value)))}
                disabled={isLocked}
                className="w-full pl-9 pr-24 bg-slate-900/90 border border-slate-700 rounded-xl py-2.5 text-base font-semibold text-white focus:outline-none focus:border-blue-500 transition-colors mono"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                  USD
                </span>
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-2 mt-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setUsdAmount(amt)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    usdAmount === amt
                      ? 'bg-blue-600 text-white border-blue-400 font-semibold'
                      : 'bg-slate-800/60 hover:bg-slate-700/60 text-gray-300 border-slate-700'
                  }`}
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time FX & Cost Comparison Calculator */}
        {quote && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-gray-400 flex items-center">
                <Zap className="w-3.5 h-3.5 text-yellow-400 mr-1.5" />
                Dynamic Wholesale Rate
              </span>
              <span className="font-mono font-semibold text-white">
                1 USD = ₹{quote.fxRate.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-2.5">
                <div className="text-blue-300 font-medium flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-400" />
                  Nexus-PvP Rate
                </div>
                <div className="mt-1 text-sm font-bold text-white font-mono">
                  ${quote.citiFeeUsd.toFixed(2)}{' '}
                  <span className="text-[10px] font-normal text-blue-300">({quote.citiFeePercent}%)</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">Zero intermediary wire fee</div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5">
                <div className="text-gray-400 font-medium">Traditional SWIFT Wire</div>
                <div className="mt-1 text-sm font-bold text-gray-300 font-mono">
                  ${quote.traditionalFeeUsd.toFixed(2)}{' '}
                  <span className="text-[10px] font-normal text-gray-400">(4.5% + $45)</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">3-5 days delivery delay</div>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-2.5 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center">
                <TrendingDown className="w-4 h-4 mr-1.5 text-emerald-400" />
                <span>Institutional PvP Savings</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">
                +${quote.savingsUsd.toFixed(2)} ({quote.savingsPercent}%)
              </span>
            </div>
          </div>
        )}

        {/* Treasury Liquidity Status Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 mb-6 text-xs space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span>Citi NY Available Liquidity Pool:</span>
            <span className="font-mono font-semibold text-white">
              ${(systemStatus?.citiTreasury.availableUsdLiquidity || 25000000).toLocaleString()} USD
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-400">
            <span>Currently Locked in Escrows:</span>
            <span className="font-mono font-semibold text-amber-400">
              ${(systemStatus?.citiTreasury.lockedInEscrowUsd || 0).toLocaleString()} USD
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '92%' }} />
          </div>
        </div>

        {/* Active Escrow State Card (If an escrow exists) */}
        {activeEscrow && (
          <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-4 mb-6 shadow-inner space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-white flex items-center">
                <Lock className="w-3.5 h-3.5 mr-1 text-blue-400" />
                {activeEscrow.escrowId}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  activeEscrow.state === 'SETTLED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : activeEscrow.state === 'REFUNDED'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'
                }`}
              >
                {activeEscrow.state}
              </span>
            </div>

            <div className="text-gray-400 font-mono text-[11px] truncate">
              <span className="text-gray-500">HashLock H: </span>
              {activeEscrow.hashLock}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-gray-400 flex items-center">
                <Clock className="w-3 h-3 mr-1 text-gray-500" />
                Block Height
              </span>
              <span className="text-white font-mono">#{activeEscrow.blockNumber}</span>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div>
        <button
          type="button"
          onClick={onInitiate}
          disabled={isLoading || isLocked}
          className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
            isLocked
              ? 'bg-slate-800 text-gray-400 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-600/30 border border-blue-400/40 active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Locking Escrow on Drunix...</span>
            </div>
          ) : isLocked ? (
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>USD Locked in Escrow</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>Lock USD Liquidity & Initiate PvP</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
