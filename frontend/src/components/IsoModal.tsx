import React, { useState, useEffect } from 'react';
import { X, FileCode, CheckCircle, Copy, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
import { HTLCEscrow, Iso20022Bundle } from '../types.js';

interface IsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrow: HTLCEscrow | null;
}

export const IsoModal: React.FC<IsoModalProps> = ({ isOpen, onClose, escrow }) => {
  const [activeTab, setActiveTab] = useState<'pacs008' | 'pacs002' | 'pacs004'>('pacs008');
  const [isoData, setIsoData] = useState<Iso20022Bundle | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !escrow) {
      setIsoData(null);
      return;
    }

    // Default to the appropriate tab depending on escrow state
    if (escrow.state === 'SETTLED') {
      setActiveTab('pacs002');
    } else if (escrow.state === 'REFUNDED') {
      setActiveTab('pacs004');
    } else {
      setActiveTab('pacs008');
    }

    const fetchIso = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5001/api/escrows/${escrow.escrowId}/iso20022`);
        if (res.ok) {
          const data = await res.json();
          setIsoData(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchIso();
  }, [isOpen, escrow]);

  if (!isOpen || !escrow) return null;

  const currentXml =
    activeTab === 'pacs008'
      ? isoData?.pacs008
      : activeTab === 'pacs002'
      ? isoData?.pacs002 || '<!-- pacs.002 Payment Status Report will be generated upon atomic settlement -->'
      : isoData?.pacs004 || '<!-- pacs.004 Payment Return will be generated upon timelock refund -->';

  const copyXml = () => {
    if (currentXml) {
      navigator.clipboard.writeText(currentXml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B1120] border border-blue-500/40 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white shadow-lg">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">ISO 20022 Financial Messaging Engine</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 font-bold uppercase">
                  SWIFT MX Schema
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">
                Citi Fedwire / CHIPS ↔ NPCI Domestic Financial Interoperability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('pacs008')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'pacs008'
                ? 'border-blue-500 text-blue-400 bg-slate-900/90'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>pacs.008.001.10</span>
            <span className="text-[10px] font-mono opacity-80">(Credit Transfer)</span>
          </button>

          <button
            onClick={() => setActiveTab('pacs002')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'pacs002'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/90'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>pacs.002.001.12</span>
            <span className="text-[10px] font-mono opacity-80">(Status: Settled)</span>
          </button>

          <button
            onClick={() => setActiveTab('pacs004')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'pacs004'
                ? 'border-rose-500 text-rose-400 bg-slate-900/90'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>pacs.004.001.11</span>
            <span className="text-[10px] font-mono opacity-80">(Return: Refunded)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Metadata Summary Pill Matrix */}
          {isoData?.metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl p-3 font-mono">
              <div>
                <span className="text-gray-500 text-[10px] block">Message Identifier</span>
                <span className="text-blue-300 font-semibold truncate block" title={isoData.metadata.messageId}>
                  {isoData.metadata.messageId}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Sender BIC (Citi NY)</span>
                <span className="text-white font-semibold block">{isoData.metadata.senderBic}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Receiver BIC (NPCI)</span>
                <span className="text-emerald-300 font-semibold block">{isoData.metadata.receiverBic}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">End-to-End UETR</span>
                <span className="text-purple-300 font-semibold truncate block" title={isoData.metadata.uetr}>
                  {isoData.metadata.uetr}
                </span>
              </div>
            </div>
          )}

          {/* XML Code Viewer */}
          <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-900/80 text-[11px] text-gray-400">
              <span className="font-mono flex items-center">
                <FileCode className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                ISO 20022 XML Schema Payload
              </span>
              <button
                onClick={copyXml}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-gray-200 transition-colors font-medium text-[11px]"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied XML' : 'Copy XML'}</span>
              </button>
            </div>
            <pre className="p-4 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-72 leading-relaxed selection:bg-blue-600 selection:text-white">
              {loading ? '// Loading ISO 20022 message payload...' : currentXml}
            </pre>
          </div>

          {/* Standards Compliance Callout */}
          <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3.5 flex items-start space-x-3 text-gray-300">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-white">Interbank Interoperability: </span>
              In accordance with Swift CBPR+ and RBI RTGS/NEFT ISO 20022 migration mandates, Nexus-PvP maps
              every Drunix HTLC blockchain state transition directly to standard UNIFI XML records. The cryptographic
              SHA-256 HashLock $H$ and revealed Preimage $R$ are embedded in the <code className="text-blue-300">&lt;SplmtryData&gt;</code> envelope.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-between items-center text-xs">
          <span className="text-gray-500 font-mono text-[11px]">
            Target Rail: {escrow.railType === 'CBDC_E_RUPEE' ? 'RBI e-Rupee Token Rail' : 'NPCI UPI 2.0 / IMPS'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors text-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
