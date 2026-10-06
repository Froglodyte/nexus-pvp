import React from 'react';
import { X, ShieldCheck, Key, Hash, FileCode, CheckCircle, Copy } from 'lucide-react';
import { HTLCEscrow } from '../types.js';

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrow: HTLCEscrow | null;
  onOpenIso?: () => void;
}

export const ProofModal: React.FC<ProofModalProps> = ({ isOpen, onClose, escrow, onOpenIso }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!isOpen || !escrow) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0F172A] border border-blue-500/40 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cryptographic Verification Proof</h3>
              <p className="text-xs text-gray-400 font-mono">Drunix Permissioned Ledger • HTLC Consensus Layer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Status Bar */}
          <div className="grid grid-cols-3 gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div>
              <div className="text-gray-400">Escrow State</div>
              <div className="font-bold text-sm text-emerald-400 uppercase mt-0.5">{escrow.state}</div>
            </div>
            <div>
              <div className="text-gray-400">Drunix Block Height</div>
              <div className="font-bold text-sm text-white font-mono mt-0.5">#{escrow.blockNumber}</div>
            </div>
            <div>
              <div className="text-gray-400">Ledger Protocol</div>
              <div className="font-bold text-sm text-blue-400 mt-0.5">HTLC (Go Chaincode)</div>
            </div>
          </div>

          {/* HashLock Proof */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-gray-300">
              <span className="font-medium flex items-center">
                <Hash className="w-3.5 h-3.5 mr-1 text-blue-400" />
                HashLock H (SHA-256 Digest):
              </span>
              <button
                onClick={() => copyToClipboard(escrow.hashLock, 'hashLock')}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                {copiedField === 'hashLock' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedField === 'hashLock' ? 'Copied' : 'Copy Hex'}</span>
              </button>
            </div>
            <div className="p-3 bg-black/60 border border-slate-800 rounded-xl font-mono text-blue-300 text-[11px] break-all select-all">
              {escrow.hashLock}
            </div>
          </div>

          {/* Secret Preimage Proof */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-gray-300">
              <span className="font-medium flex items-center">
                <Key className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Secret Preimage R (Plaintext 256-bit Seed):
              </span>
              {escrow.secretPreimage && (
                <button
                  onClick={() => copyToClipboard(escrow.secretPreimage!, 'preimage')}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  {copiedField === 'preimage' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedField === 'preimage' ? 'Copied' : 'Copy Hex'}</span>
                </button>
              )}
            </div>
            <div
              className={`p-3 rounded-xl font-mono text-[11px] break-all border select-all ${
                escrow.secretPreimage
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-bold'
                  : 'bg-black/60 border-slate-800 text-gray-500 italic'
              }`}
            >
              {escrow.secretPreimage ||
                'Preimage currently securely withheld inside the NPCI Hardware Security Module (HSM) Enclave.'}
            </div>
          </div>

          {/* Mathematical Invariant */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-gray-300 space-y-1.5">
            <div className="font-semibold text-white flex items-center">
              <FileCode className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
              Deterministic Cryptographic Invariant:
            </div>
            <p className="text-[11px] text-gray-400">
              The chaincode computes <code className="text-purple-300">SHA256(R)</code>. If and only if the digest
              identically matches <code className="text-blue-300">HashLock H</code> and{' '}
              <code className="text-amber-300">CurrentTimestamp &lt; TimeLock T</code>, the contract atomically
              transfers USD {escrow.amount} to Citi Domestic Node and records the settlement on-chain.
            </p>
          </div>

          {/* Transaction Metadata */}
          <div className="space-y-1 text-[11px] text-gray-400 font-mono">
            <div>
              <span className="text-gray-500">Ledger Tx Hash: </span>
              <span className="text-slate-300">{escrow.ledgerTxHash}</span>
            </div>
            <div>
              <span className="text-gray-500">Timelock Expiry (T): </span>
              <span className="text-slate-300">
                {new Date(escrow.timeLock * 1000).toISOString()} (Unix: {escrow.timeLock})
              </span>
            </div>
            <div>
              <span className="text-gray-500">Receiver Beneficiary: </span>
              <span className="text-emerald-400">{escrow.receiverVpa}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-between items-center">
          {onOpenIso ? (
            <button
              onClick={() => {
                onClose();
                onOpenIso();
              }}
              className="px-3.5 py-1.5 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>View ISO 20022 XML</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close Proof
          </button>
        </div>
      </div>
    </div>
  );
};
