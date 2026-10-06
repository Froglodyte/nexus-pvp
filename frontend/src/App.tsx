import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Layers,
  Shield,
  Zap,
  Globe2,
  RefreshCw,
  Cpu,
  Sparkles,
  AlertOctagon,
  CheckCircle,
} from 'lucide-react';
import { CitiPanel } from './components/CitiPanel.js';
import { NpciPanel } from './components/NpciPanel.js';
import { CorridorTimeline } from './components/CorridorTimeline.js';
import { ProofModal } from './components/ProofModal.js';
import {
  CorridorEvent,
  FXQuote,
  HTLCEscrow,
  SystemStatus,
  VPAResolution,
} from './types.js';

const API_BASE = 'http://localhost:5001';
const WS_URL = 'ws://localhost:5001';

export const App: React.FC = () => {
  // State variables
  const [usdAmount, setUsdAmount] = useState<number>(1000);
  const [senderId, setSenderId] = useState<string>('CITI_NY_TREASURY_CORP_01');
  const [receiverVpa, setReceiverVpa] = useState<string>('priya.sharma@okhdfcbank');
  const [quote, setQuote] = useState<FXQuote | null>(null);
  const [activeEscrow, setActiveEscrow] = useState<HTLCEscrow | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<VPAResolution[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [events, setEvents] = useState<CorridorEvent[]>([]);
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  // Loading states
  const [isInitiating, setIsInitiating] = useState<boolean>(false);
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [isRefunding, setIsRefunding] = useState<boolean>(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState<boolean>(false);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch live FX quote
  const fetchQuote = useCallback(async (amount: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/quote?amount=${amount}&timeLockSeconds=60`);
      if (res.ok) {
        const data = await res.json();
        setQuote(data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch initial beneficiaries and system status
  const fetchInitialData = useCallback(async () => {
    try {
      const [beneficiariesRes, statusRes, eventsRes, escrowsRes] = await Promise.all([
        fetch(`${API_BASE}/api/beneficiaries`),
        fetch(`${API_BASE}/api/system-status`),
        fetch(`${API_BASE}/api/events`),
        fetch(`${API_BASE}/api/escrows`),
      ]);

      if (beneficiariesRes.ok) {
        const bData = await beneficiariesRes.json();
        setBeneficiaries(bData);
      }
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setSystemStatus(sData);
      }
      if (eventsRes.ok) {
        const eData = await eventsRes.json();
        setEvents(eData);
      }
      if (escrowsRes.ok) {
        const escrowsData = await escrowsRes.json();
        if (escrowsData.escrows && escrowsData.escrows.length > 0) {
          // Set latest escrow
          setActiveEscrow(escrowsData.escrows[0]);
        }
      }
    } catch {
      // ignore initial network error
    }
  }, []);

  // Debounced quote fetch on amount change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (usdAmount > 0) {
        fetchQuote(usdAmount);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [usdAmount, fetchQuote]);

  // Initial load
  useEffect(() => {
    fetchInitialData();
    fetchQuote(usdAmount);
  }, [fetchInitialData, fetchQuote]);

  // WebSocket Connection Setup
  useEffect(() => {
    let socket: WebSocket;
    const connectWs = () => {
      try {
        socket = new WebSocket(WS_URL);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'CORRIDOR_EVENT' && data.event) {
              const newEvt: CorridorEvent = data.event;
              setEvents((prev) => [newEvt, ...prev.slice(0, 99)]);

              // If event contains escrow data, update activeEscrow
              if (newEvt.data?.escrow) {
                setActiveEscrow(newEvt.data.escrow);
              }

              // Celebrate on successful atomic settlement
              if (newEvt.type === 'ATOMIC_SETTLED') {
                confetti({
                  particleCount: 120,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#0A84FF', '#10B981', '#F59E0B'],
                });
                fetchInitialData(); // Refresh balances
              }

              if (newEvt.type === 'ESCROW_REFUNDED') {
                fetchInitialData(); // Refresh balances
              }
            } else if (data.type === 'STATE_SYNC') {
              if (data.payload?.recentEvents) {
                setEvents(data.payload.recentEvents);
              }
            }
          } catch {
            // ignore malformed ws message
          }
        };

        socket.onclose = () => {
          setIsWsConnected(false);
          setTimeout(connectWs, 3000); // Auto reconnect
        };

        socket.onerror = () => {
          setIsWsConnected(false);
        };
      } catch {
        setIsWsConnected(false);
      }
    };

    connectWs();

    return () => {
      if (socket) socket.close();
    };
  }, [fetchInitialData]);

  // Handlers
  const handleInitiate = async () => {
    setIsInitiating(true);
    try {
      const res = await fetch(`${API_BASE}/api/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usdAmount,
          receiverVpa,
          senderId,
          timeLockSeconds: 60,
          simulateFailure,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveEscrow(data.escrow);
        fetchInitialData();
      } else {
        alert(data.error || 'Failed to initiate remittance escrow');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsInitiating(false);
    }
  };

  const handleSettle = async () => {
    if (!activeEscrow) return;
    setIsSettling(true);
    try {
      const res = await fetch(`${API_BASE}/api/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId: activeEscrow.escrowId,
          simulateFailure,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveEscrow(data.escrow);
        fetchInitialData();
      } else {
        // Expected in failure simulation mode!
        fetchInitialData();
      }
    } catch (err: any) {
      alert(`Settlement execution error: ${err.message}`);
    } finally {
      setIsSettling(false);
    }
  };

  const handleRefund = async () => {
    if (!activeEscrow) return;
    setIsRefunding(true);
    try {
      const res = await fetch(`${API_BASE}/api/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId: activeEscrow.escrowId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveEscrow(data.escrow);
        fetchInitialData();
      } else {
        alert(data.error || 'Refund rejected: timelock has not expired.');
      }
    } catch (err: any) {
      alert(`Refund error: ${err.message}`);
    } finally {
      setIsRefunding(false);
    }
  };

  const handleFastForward = async () => {
    if (!activeEscrow) return;
    try {
      const res = await fetch(`${API_BASE}/api/fast-forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId: activeEscrow.escrowId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveEscrow(data.escrow);
      }
    } catch {
      // ignore
    }
  };

  // Scenario Presets
  const applyPreset = (preset: 'happy' | 'failure' | 'cbdc') => {
    if (preset === 'happy') {
      setUsdAmount(1000);
      setReceiverVpa('priya.sharma@okhdfcbank');
      setSimulateFailure(false);
      setActiveEscrow(null);
    } else if (preset === 'failure') {
      setUsdAmount(2500);
      setReceiverVpa('aarav.patel@upi');
      setSimulateFailure(true);
      setActiveEscrow(null);
    } else if (preset === 'cbdc') {
      setUsdAmount(25000);
      setReceiverVpa('CBDC-WALLET-IN-9812');
      setSimulateFailure(false);
      setActiveEscrow(null);
    }
  };

  const currentBeneficiary = beneficiaries.find((b) => b.vpa === receiverVpa) || null;
  const isLocked = activeEscrow?.state === 'LOCKED';

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col">
      {/* Top Institutional Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center">
                  <span>NEXUS</span>
                  <span className="text-blue-500 mx-1">-</span>
                  <span className="text-emerald-400">PvP</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-blue-900/60 to-emerald-900/60 border border-blue-500/40 rounded-full text-blue-200">
                  Citi x NPCI Drunix 2026
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Atomic Payment-versus-Payment Cross-Border Remittance Corridor
              </p>
            </div>
          </div>

          {/* Ledger Connectivity & Node Health Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Drunix BFT Status */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-gray-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              <span>Drunix BFT Consensus</span>
              <span className="ml-1.5 text-gray-500">
                #{systemStatus?.drunixLedger.currentBlockHeight || 849204}
              </span>
            </div>

            {/* WebSocket Link */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-gray-300 font-mono">
              <span
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  isWsConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>{isWsConnected ? 'Live WebSocket' : 'Connecting...'}</span>
            </div>

            {/* Clear/Reset button */}
            <button
              onClick={() => {
                setActiveEscrow(null);
                fetchInitialData();
              }}
              title="Reset Corridor State"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Demo Scenario Presets Bar */}
        <div className="bg-slate-950/80 border-t border-slate-800/60 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="font-semibold text-gray-400 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
              Hackathon Demo Scenarios:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => applyPreset('happy')}
                className="px-3 py-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 font-medium transition-all"
              >
                ⚡ Scenario A: Happy Path (Instant UPI Credit & Atomic Settle)
              </button>
              <button
                onClick={() => applyPreset('failure')}
                className="px-3 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 font-medium transition-all"
              >
                🛡️ Scenario B: Rail Outage & Atomic Rollback (Zero Fund Loss)
              </button>
              <button
                onClick={() => applyPreset('cbdc')}
                className="px-3 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 font-medium transition-all"
              >
                💎 Scenario C: Institutional e-Rupee CBDC ($25,000)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split-View Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Two Institutional Portals Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Portal: Citi Wholesale Treasury */}
          <CitiPanel
            usdAmount={usdAmount}
            setUsdAmount={setUsdAmount}
            senderId={senderId}
            setSenderId={setSenderId}
            quote={quote}
            activeEscrow={activeEscrow}
            systemStatus={systemStatus}
            onInitiate={handleInitiate}
            isLoading={isInitiating}
            isLocked={isLocked}
          />

          {/* Right Portal: NPCI Domestic e-Rupee / UPI */}
          <NpciPanel
            receiverVpa={receiverVpa}
            setReceiverVpa={setReceiverVpa}
            beneficiaries={beneficiaries}
            currentBeneficiary={currentBeneficiary}
            activeEscrow={activeEscrow}
            systemStatus={systemStatus}
            simulateFailure={simulateFailure}
            onSettle={handleSettle}
            isSettling={isSettling}
            onViewProofModal={() => setIsProofModalOpen(true)}
          />
        </div>

        {/* Center Console: Protocol Timeline & Consensus Engine */}
        <CorridorTimeline
          events={events}
          activeEscrow={activeEscrow}
          simulateFailure={simulateFailure}
          setSimulateFailure={setSimulateFailure}
          onFastForward={handleFastForward}
          onRefund={handleRefund}
          isRefunding={isRefunding}
          onViewProofModal={() => setIsProofModalOpen(true)}
        />
      </main>

      {/* Cryptographic Proof Inspector Modal */}
      <ProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        escrow={activeEscrow}
      />

      {/* Institutional Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-4 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Nexus-PvP • Citi Foreign Exchange (New York) x National Payments Corporation of India (NPCI)
          </div>
          <div className="font-mono text-[11px] text-gray-400">
            Drunix Chaincode Engine • SHA-256 Hash Time-Locked Contract (HTLC)
          </div>
        </div>
      </footer>
    </div>
  );
};
