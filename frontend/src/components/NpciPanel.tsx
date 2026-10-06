import React from 'react';
import {
  Wallet,
  CheckCircle2,
  AlertOctagon,
  Key,
  ShieldCheck,
  CreditCard,
  QrCode,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { HTLCEscrow, SystemStatus, VPAResolution } from '../types.js';

interface NpciPanelProps {
  receiverVpa: string;
  setReceiverVpa: (vpa: string) => void;
  beneficiaries: VPAResolution[];
  currentBeneficiary: VPAResolution | null;
  activeEscrow: HTLCEscrow | null;
  systemStatus: SystemStatus | null;
  simulateFailure: boolean;
  onSettle: () => void;
  isSettling: boolean;
  onViewProofModal: () => void;
}

export const NpciPanel: React.FC<NpciPanelProps> = ({
  receiverVpa,
  setReceiverVpa,
  beneficiaries,
  currentBeneficiary,
  activeEscrow,
  systemStatus,
  simulateFailure,
  onSettle,
  isSettling,
  onViewProofModal,
}) => {
  const isSettled = activeEscrow?.state === 'SETTLED';
  const isLocked = activeEscrow?.state === 'LOCKED';
  const isRefunded = activeEscrow?.state === 'REFUNDED';

  return (
    <div className="glass-panel-npci rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-emerald-500/30">
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-tight text-white">NPCI e-Rupee / UPI Domestic Wallet</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 uppercase">
                  India / INR
                </span>
              </div>
              <p className="text-xs text-emerald-200/60 font-mono">Node ID: NPCI-BLR-SWITCH-01</p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                simulateFailure
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  simulateFailure ? 'bg-rose-400 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              {simulateFailure ? 'Rail Outage (Simulated)' : 'UPI & CBDC Online'}
            </div>
          </div>
        </div>

        {/* Recipient VPA / Wallet Selector */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Select Domestic Beneficiary VPA or CBDC Enclave
            </label>
            <div className="relative">
              <select
                value={receiverVpa}
                onChange={(e) => setReceiverVpa(e.target.value)}
                disabled={isLocked}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors mono"
              >
                {beneficiaries.map((b) => (
                  <option key={b.vpa} value={b.vpa} className="bg-slate-900 text-white">
                    {b.recipientName} ({b.vpa}) - {b.railType === 'UPI' ? 'UPI 2.0' : 'e-Rupee CBDC'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VPA Resolution Card */}
          {currentBeneficiary && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Resolved Beneficiary:</span>
                <span className="font-semibold text-white flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                  {currentBeneficiary.recipientName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Routing Institution & IFSC:</span>
                <span className="font-mono text-emerald-300">
                  {currentBeneficiary.bankName} ({currentBeneficiary.ifsc})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Domestic Settlement Rail:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    currentBeneficiary.railType === 'CBDC_E_RUPEE'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {currentBeneficiary.railType === 'CBDC_E_RUPEE' ? 'Reserve Bank e-Rupee (CBDC)' : 'NPCI UPI 2.0 (IMPS)'}
                </span>
              </div>
            </div>
          )}

          {/* Live Wallet Balance */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900/90 border border-emerald-500/30 rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span className="flex items-center">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                Beneficiary Available Balance
              </span>
              <span className="text-[10px] text-emerald-400 uppercase font-mono">Real-Time Core Banking</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-white font-mono">
                ₹{(currentBeneficiary?.walletBalanceInr || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs font-semibold text-emerald-300">INR</span>
            </div>

            {/* Incoming Credit Alert */}
            {isLocked && activeEscrow && (
              <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="text-amber-300 flex items-center animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  Incoming PvP Credit Pending:
                </span>
                <span className="font-mono font-bold text-amber-300">
                  +₹{activeEscrow.inrAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cryptographic Verification Card (Enclave & Preimage Status) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-1.5 text-emerald-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>NPCI HSM Enclave Status</span>
            </div>
            <button
              onClick={onViewProofModal}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center underline"
            >
              Inspect Cryptographic Proof
              <ExternalLink className="w-3 h-3 ml-1" />
            </button>
          </div>

          {/* HashLock H */}
          <div>
            <div className="text-[11px] text-gray-400 mb-1">
              Published HashLock <span className="font-mono text-gray-300">H = SHA-256(R)</span>:
            </div>
            <div className="bg-black/50 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-blue-300 truncate select-all">
              {activeEscrow?.hashLock || '0x4f89b2c89012a45e7810bcf28192019482910482910294829104829104829104'}
            </div>
          </div>

          {/* Secret Preimage R */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
              <span>Secret Preimage (R) [256-bit Random]:</span>
              <span className="text-[10px] uppercase font-mono">
                {isSettled ? (
                  <span className="text-emerald-400 font-bold">REVEALED ON-CHAIN</span>
                ) : (
                  <span className="text-amber-400">WITHHELD IN HSM ENCLAVE</span>
                )}
              </span>
            </div>
            <div
              className={`p-2 rounded-lg font-mono text-[11px] border truncate transition-all ${
                isSettled
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold select-all'
                  : 'bg-black/50 border-slate-800 text-gray-500'
              }`}
            >
              {isSettled && activeEscrow?.secretPreimage
                ? activeEscrow.secretPreimage
                : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
            </div>
          </div>

          {/* Domestic Receipt UTR / CBDC Hash */}
          {isSettled && (
            <div className="pt-2 border-t border-slate-800 text-[11px] flex items-center justify-between">
              <span className="text-gray-400">Domestic Clearing Reference:</span>
              <span className="text-emerald-300 font-mono font-semibold">
                {activeEscrow?.utrNumber || activeEscrow?.cbdcTxHash || 'NPCI-CONFIRMED-OK'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Settle Action / Status Button */}
      <div>
        {isLocked ? (
          <button
            type="button"
            onClick={onSettle}
            disabled={isSettling}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
              simulateFailure
                ? 'bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/40 shadow-rose-600/30'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 shadow-emerald-600/30'
            }`}
          >
            {isSettling ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>
                  {simulateFailure ? 'Triggering Simulated Rail Drop...' : 'Verifying & Disbursing INR...'}
                </span>
              </div>
            ) : simulateFailure ? (
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4" />
                <span>Simulate Domestic Rail Outage (Withhold Preimage)</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Credit INR & Reveal Preimage R (Atomic Settle)</span>
              </div>
            )}
          </button>
        ) : isSettled ? (
          <div className="w-full py-3 px-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Domestic INR Credit Confirmed & USD Released</span>
          </div>
        ) : isRefunded ? (
          <div className="w-full py-3 px-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center justify-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <span>Escrow Timelock Elapsed - Zero Domestic Credit</span>
          </div>
        ) : (
          <div className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-gray-500 font-medium text-xs flex items-center justify-center space-x-2">
            <span>Awaiting USD Escrow Lock from Citi Treasury</span>
          </div>
        )}
      </div>
    </div>
  );
};
