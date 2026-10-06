import React, { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  RotateCcw,
  FileCode,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { HTLCEscrow } from '../types.js';

interface LedgerExplorerProps {
  escrows: HTLCEscrow[];
  activeEscrowId?: string;
  onSelectEscrow: (escrow: HTLCEscrow) => void;
  onViewProof: (escrow: HTLCEscrow) => void;
  onViewIso: (escrow: HTLCEscrow) => void;
}

export const LedgerExplorer: React.FC<LedgerExplorerProps> = ({
  escrows,
  activeEscrowId,
  onSelectEscrow,
  onViewProof,
  onViewIso,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SETTLED' | 'LOCKED' | 'REFUNDED'>('ALL');
  const [railFilter, setRailFilter] = useState<'ALL' | 'UPI' | 'CBDC_E_RUPEE'>('ALL');

  // Filter logic
  const filteredEscrows = escrows.filter((e) => {
    const matchesSearch =
      e.escrowId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.receiverVpa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.senderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.utrNumber && e.utrNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.cbdcTxHash && e.cbdcTxHash.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || e.state === statusFilter;
    const matchesRail = railFilter === 'ALL' || e.railType === railFilter;

    return matchesSearch && matchesStatus && matchesRail;
  });

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-2xl border border-slate-800 space-y-4">
      {/* Explorer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">Drunix Ledger State Explorer & Audit Log</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {escrows.length} Total Escrows
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Immutable Distributed World State • Complete HTLC Settlement History
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Escrow ID, VPA, UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900/90 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors w-52 sm:w-60 font-mono"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700/80 rounded-xl p-1 text-xs font-medium">
            {(['ALL', 'SETTLED', 'LOCKED', 'REFUNDED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Rail Filter */}
          <select
            value={railFilter}
            onChange={(e) => setRailFilter(e.target.value as any)}
            className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-[11px] text-gray-300 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">All Rails</option>
            <option value="UPI">UPI 2.0</option>
            <option value="CBDC_E_RUPEE">e-Rupee CBDC</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-gray-400 uppercase tracking-wider font-mono">
              <th className="py-3 px-4">Escrow ID / Block</th>
              <th className="py-3 px-4">Sender ➔ Beneficiary</th>
              <th className="py-3 px-4">Principal (USD)</th>
              <th className="py-3 px-4">Settlement (INR)</th>
              <th className="py-3 px-4">Rail</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredEscrows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 text-xs italic">
                  No escrows found matching the current filters.
                </td>
              </tr>
            ) : (
              filteredEscrows.map((escrow) => {
                const isActive = escrow.escrowId === activeEscrowId;

                return (
                  <tr
                    key={escrow.escrowId}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      isActive ? 'bg-blue-950/20 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    {/* Escrow ID & Block */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <span>{escrow.escrowId}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" title="Active in portal" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Block #{escrow.blockNumber} • {new Date(escrow.createdAt * 1000).toLocaleTimeString()}
                      </div>
                    </td>

                    {/* Sender & Recipient */}
                    <td className="py-3 px-4">
                      <div className="text-gray-300 truncate max-w-[140px] text-[11px]" title={escrow.senderId}>
                        {escrow.senderId.replace('_CORP_01', '')}
                      </div>
                      <div className="text-emerald-400 truncate max-w-[150px] font-semibold text-[11px]" title={escrow.receiverVpa}>
                        ➔ {escrow.receiverVpa}
                      </div>
                    </td>

                    {/* USD Amount */}
                    <td className="py-3 px-4">
                      <div className="text-white font-bold">
                        ${escrow.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-sans">
                        Save ${escrow.savingsUsd.toFixed(2)}
                      </div>
                    </td>

                    {/* INR Amount */}
                    <td className="py-3 px-4">
                      <div className="text-emerald-300 font-bold">
                        ₹{escrow.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        @ ₹{escrow.fxRate.toFixed(2)}
                      </div>
                    </td>

                    {/* Rail Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          escrow.railType === 'CBDC_E_RUPEE'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {escrow.railType === 'CBDC_E_RUPEE' ? 'e-Rupee' : 'UPI 2.0'}
                      </span>
                    </td>

                    {/* State Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          escrow.state === 'SETTLED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : escrow.state === 'LOCKED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {escrow.state === 'SETTLED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {escrow.state === 'LOCKED' && <Lock className="w-3 h-3 mr-1" />}
                        {escrow.state === 'REFUNDED' && <RotateCcw className="w-3 h-3 mr-1" />}
                        {escrow.state}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5 font-sans">
                        {/* Select as active */}
                        <button
                          onClick={() => onSelectEscrow(escrow)}
                          title="Focus in Portal"
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white text-[11px] transition-colors"
                        >
                          Focus
                        </button>

                        {/* View Proof */}
                        <button
                          onClick={() => onViewProof(escrow)}
                          title="Inspect SHA-256 Proof"
                          className="p-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-400 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>

                        {/* View ISO 20022 */}
                        <button
                          onClick={() => onViewIso(escrow)}
                          title="View ISO 20022 XML"
                          className="p-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-400 transition-colors"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
