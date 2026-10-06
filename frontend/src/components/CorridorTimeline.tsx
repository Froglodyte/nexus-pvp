import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FastForward,
  Cpu,
  Radio,
  Flame,
  ChevronDown,
  ChevronUp,
  FileCheck2,
} from 'lucide-react';
import { CorridorEvent, HTLCEscrow } from '../types.js';

interface CorridorTimelineProps {
  events: CorridorEvent[];
  activeEscrow: HTLCEscrow | null;
  simulateFailure: boolean;
  setSimulateFailure: (val: boolean) => void;
  onFastForward: () => void;
  onRefund: () => void;
  isRefunding: boolean;
  onViewProofModal: () => void;
}

export const CorridorTimeline: React.FC<CorridorTimelineProps> = ({
  events,
  activeEscrow,
  simulateFailure,
  setSimulateFailure,
  onFastForward,
  onRefund,
  isRefunding,
  onViewProofModal,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Live Timelock Countdown Timer
  useEffect(() => {
    if (!activeEscrow || activeEscrow.state !== 'LOCKED') {
      setSecondsRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = activeEscrow.timeLock - now;
      setSecondsRemaining(Math.max(0, diff));
    }, 1000);

    // Initial calculation
    const now = Math.floor(Date.now() / 1000);
    setSecondsRemaining(Math.max(0, activeEscrow.timeLock - now));

    return () => clearInterval(interval);
  }, [activeEscrow]);

  // Determine current stage for visual step tracker
  const getStageStatus = (stageNum: number) => {
    if (!activeEscrow) return 'idle';
    if (stageNum === 1) return 'completed';
    if (stageNum === 2) return activeEscrow.state === 'LOCKED' || activeEscrow.state === 'SETTLED' || activeEscrow.state === 'REFUNDED' ? 'completed' : 'active';
    if (stageNum === 3) {
      if (simulateFailure) return 'error';
      if (activeEscrow.state === 'SETTLED') return 'completed';
      if (activeEscrow.state === 'REFUNDED') return 'error';
      return 'active';
    }
    if (stageNum === 4) {
      if (activeEscrow.state === 'SETTLED') return 'completed';
      if (activeEscrow.state === 'REFUNDED') return 'refunded';
      return 'pending';
    }
    return 'idle';
  };

  const isLocked = activeEscrow?.state === 'LOCKED';
  const isTimelockExpired = isLocked && secondsRemaining === 0;

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-2xl border border-slate-800 flex flex-col justify-between relative overflow-hidden">
      <div>
        {/* Top Header & Fault Tolerance Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-5 gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center">
                <span>Drunix HTLC Orchestrator</span>
                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Consensus Core
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-mono">Atomic PvP Liquidity Bridge (Hyperledger Chaincode)</p>
            </div>
          </div>

          {/* Fault-Tolerance Outage Simulation Toggle */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 px-3 shadow-inner">
            <div className="flex flex-col mr-3 text-right">
              <span className="text-xs font-bold text-gray-200">Simulate Rail Outage</span>
              <span className="text-[10px] text-gray-400">Test Atomic Rollback</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
            </label>
          </div>
        </div>

        {/* 4-Stage Atomic PvP Protocol Diagram */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Atomic Protocol Execution Stages</span>
            {activeEscrow && (
              <button
                onClick={onViewProofModal}
                className="text-blue-400 hover:text-blue-300 normal-case font-medium text-xs flex items-center"
              >
                <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                Inspect Chaincode Proof
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            {/* Stage 1 */}
            <div
              className={`p-3 rounded-xl border text-xs transition-all ${
                getStageStatus(1) === 'completed'
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                  : 'bg-slate-900/50 border-slate-800 text-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-blue-400">STAGE 01</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="font-bold text-white mb-0.5">FX & Preimage Gen</div>
              <div className="text-[11px] text-gray-400 leading-snug">
                NPCI creates 256-bit secret R and computes HashLock H.
              </div>
            </div>

            {/* Stage 2 */}
            <div
              className={`p-3 rounded-xl border text-xs transition-all ${
                getStageStatus(2) === 'completed'
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                  : getStageStatus(2) === 'active'
                  ? 'bg-blue-950/20 border-blue-400 text-blue-300 animate-pulse'
                  : 'bg-slate-900/50 border-slate-800 text-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-blue-400">STAGE 02</span>
                <Lock className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="font-bold text-white mb-0.5">USD Escrow Lock</div>
              <div className="text-[11px] text-gray-400 leading-snug">
                Citi locks USD on Drunix HTLC chaincode with timelock T.
              </div>
            </div>

            {/* Stage 3 */}
            <div
              className={`p-3 rounded-xl border text-xs transition-all ${
                getStageStatus(3) === 'completed'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : getStageStatus(3) === 'error'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : getStageStatus(3) === 'active'
                  ? 'bg-emerald-950/20 border-emerald-400 text-emerald-300 animate-pulse'
                  : 'bg-slate-900/50 border-slate-800 text-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-emerald-400">STAGE 03</span>
                {getStageStatus(3) === 'error' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="font-bold text-white mb-0.5">Domestic Rail Leg</div>
              <div className="text-[11px] text-gray-400 leading-snug">
                {getStageStatus(3) === 'error'
                  ? 'Rail outage simulated: R withheld in enclave.'
                  : 'UPI / e-Rupee credits local INR beneficiary.'}
              </div>
            </div>

            {/* Stage 4 */}
            <div
              className={`p-3 rounded-xl border text-xs transition-all ${
                getStageStatus(4) === 'completed'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : getStageStatus(4) === 'refunded'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-slate-900/50 border-slate-800 text-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-purple-400">STAGE 04</span>
                {getStageStatus(4) === 'refunded' ? (
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="font-bold text-white mb-0.5">
                {getStageStatus(4) === 'refunded' ? 'Atomic Rollback' : 'PvP Settlement'}
              </div>
              <div className="text-[11px] text-gray-400 leading-snug">
                {getStageStatus(4) === 'refunded'
                  ? 'Timelock elapsed: 100% USD principal refunded.'
                  : 'R published: USD unlocks to Citi. Zero leg risk.'}
              </div>
            </div>
          </div>
        </div>

        {/* Timelock Countdown & Rollback Controls (Active when Escrow is Locked) */}
        {isLocked && (
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 mb-6 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                <span className="text-xs font-semibold text-gray-200">
                  Active HTLC Escrow Timelock Window
                </span>
              </div>
              <div className="font-mono text-sm font-bold text-white">
                {secondsRemaining > 0 ? (
                  <span className="text-blue-400">{secondsRemaining}s remaining</span>
                ) : (
                  <span className="text-amber-400 animate-pulse">TIMELOCK EXPIRED</span>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  secondsRemaining > 0 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{
                  width: `${activeEscrow ? Math.min(100, (secondsRemaining / 60) * 100) : 0}%`,
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={onFastForward}
                disabled={secondsRemaining === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-600/60 font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-400" />
                <span>Fast-Forward Virtual Clock (Test Rollback)</span>
              </button>

              <button
                type="button"
                onClick={onRefund}
                disabled={!isTimelockExpired || isRefunding}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                  isTimelockExpired
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 animate-bounce'
                    : 'bg-slate-800 text-gray-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {isRefunding
                    ? 'Executing Chaincode Refund...'
                    : isTimelockExpired
                    ? 'Execute Atomic Refund Now'
                    : 'Refund Locked (Awaiting T Expiry)'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Live WebSocket Event Stream */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            <span className="flex items-center">
              <Radio className="w-3.5 h-3.5 text-blue-400 mr-1.5 animate-pulse" />
              Live Consensus Event Stream (Drunix WebSocket)
            </span>
            <span className="font-mono text-gray-500 text-[10px]">{events.length} events logged</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-gray-500">
                Awaiting transaction activity on Nexus corridor...
              </div>
            ) : (
              events.map((evt) => {
                const isExpanded = expandedEventId === evt.id;
                return (
                  <div
                    key={evt.id}
                    className={`rounded-xl border p-2.5 text-xs transition-all ${
                      evt.status === 'failed'
                        ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                        : evt.status === 'warning'
                        ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                        : evt.status === 'success'
                        ? 'bg-slate-900/80 border-slate-700/80 text-gray-200'
                        : 'bg-slate-900/50 border-slate-800 text-gray-400'
                    }`}
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                    >
                      <div className="flex items-start space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            evt.status === 'failed'
                              ? 'bg-rose-500'
                              : evt.status === 'warning'
                              ? 'bg-amber-500'
                              : evt.status === 'success'
                              ? 'bg-emerald-400'
                              : 'bg-blue-400'
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-white flex items-center">
                            <span>{evt.title}</span>
                            <span className="ml-2 font-mono text-[10px] text-gray-400">
                              Stage 0{evt.stage}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{evt.details}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 text-gray-400 text-[10px] font-mono">
                        <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        {evt.data && (
                          isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>

                    {/* Expandable JSON Data Inspector */}
                    {isExpanded && evt.data && (
                      <div className="mt-2 pt-2 border-t border-slate-800 font-mono text-[10px] bg-black/60 p-2 rounded-lg text-blue-300 overflow-x-auto select-all">
                        <pre>{JSON.stringify(evt.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
