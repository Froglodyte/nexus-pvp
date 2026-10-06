export type EscrowState = 'LOCKED' | 'SETTLED' | 'REFUNDED';

export type RailType = 'UPI' | 'CBDC_E_RUPEE';

export interface HTLCEscrow {
  escrowId: string;
  senderId: string;
  receiverVpa: string;
  amount: number;
  tokenSymbol: string;
  hashLock: string; // 64-char hex SHA-256
  timeLock: number; // Unix timestamp in seconds
  state: EscrowState;
  secretPreimage?: string;
  createdAt: number;
  settledAt?: number;
  refundedAt?: number;
  disbursedTo?: string;

  // Remittance Corridor Metadata
  fxRate: number;
  inrAmount: number;
  feeUsd: number;
  savingsUsd: number;
  railType: RailType;
  utrNumber?: string;
  cbdcTxHash?: string;
  blockNumber: number;
  ledgerTxHash: string;
}

export interface FXQuote {
  quoteId: string;
  usdAmount: number;
  fxRate: number; // e.g., 86.40 INR/USD
  grossInr: number;
  citiFeePercent: number; // 0.25%
  citiFeeUsd: number;
  netInrRecipient: number;
  traditionalFeeUsd: number; // 4.5% + $45 wire fee
  traditionalInrRecipient: number;
  savingsUsd: number;
  savingsPercent: number;
  timeLockSeconds: number; // Default 60 seconds
  expiresAt: number;
  guaranteedRateTimestamp: number;
}

export interface VPAResolution {
  vpa: string;
  recipientName: string;
  bankName: string;
  ifsc: string;
  railType: RailType;
  status: 'ACTIVE' | 'INVALID';
  accountType: string;
  walletBalanceInr?: number;
}

export interface PreimageBundle {
  preimage: string; // 64 hex characters (32 bytes)
  hashLock: string; // SHA-256(preimage)
  generatedAt: number;
}

export type CorridorEventType =
  | 'QUOTE_REQUESTED'
  | 'PREIMAGE_GENERATED'
  | 'ESCROW_LOCKED'
  | 'NPCI_ROUTING_STARTED'
  | 'NPCI_CREDIT_SUCCESS'
  | 'NPCI_CREDIT_FAILED'
  | 'SECRET_REVEALED'
  | 'ATOMIC_SETTLED'
  | 'TIMELOCK_EXPIRED'
  | 'ESCROW_REFUNDED'
  | 'STATE_SYNC';

export interface CorridorEvent {
  id: string;
  type: CorridorEventType;
  timestamp: number;
  escrowId?: string;
  title: string;
  details: string;
  data?: any;
  stage: 1 | 2 | 3 | 4;
  status: 'pending' | 'success' | 'failed' | 'warning';
}

export interface RemittanceRequest {
  usdAmount: number;
  receiverVpa: string;
  senderId?: string;
  timeLockSeconds?: number;
  simulateFailure?: boolean;
}

export interface SystemStatus {
  drunixLedger: {
    status: 'ONLINE';
    activeNodes: string[];
    currentBlockHeight: number;
    chaincodeVersion: string;
    consensus: 'Raft / PBFT Enterprise BFT';
  };
  citiTreasury: {
    nodeId: string;
    location: string;
    availableUsdLiquidity: number;
    lockedInEscrowUsd: number;
    settledVolumeUsd: number;
  };
  npciGateway: {
    nodeId: string;
    location: string;
    railsConnected: string[];
    domesticSwitchStatus: 'ONLINE' | 'SIMULATED_OUTAGE';
    availableInrLiquidity: number;
    settledVolumeInr: number;
  };
}
