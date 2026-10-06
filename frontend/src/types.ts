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
  fxRate: number;
  grossInr: number;
  citiFeePercent: number;
  citiFeeUsd: number;
  netInrRecipient: number;
  traditionalFeeUsd: number;
  traditionalInrRecipient: number;
  savingsUsd: number;
  savingsPercent: number;
  timeLockSeconds: number;
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

export interface SystemStatus {
  drunixLedger: {
    status: 'ONLINE';
    activeNodes: string[];
    currentBlockHeight: number;
    chaincodeVersion: string;
    consensus: string;
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

export interface Iso20022Bundle {
  pacs008: string;
  pacs002?: string;
  pacs004?: string;
  metadata: {
    messageId: string;
    uetr: string;
    clearingChannel: string;
    senderBic: string;
    receiverBic: string;
    instructedAmount: string;
    settlementAmount: string;
    fxRate: number;
    status: string;
  };
}

export interface CorridorMetrics {
  totalEscrows: number;
  settledCount: number;
  refundedCount: number;
  lockedCount: number;
  totalSettledUsd: number;
  totalSettledInr: number;
  totalSavingsUsd: number;
  averageSettlementLatencyMs: number;
  herstattRiskIncidents: number;
  atomicRollbackSuccessRate: string;
  timestamp: number;
}

