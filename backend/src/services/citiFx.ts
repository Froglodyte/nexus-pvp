import crypto from 'node:crypto';
import { FXQuote } from '../types.js';

export class CitiFxService {
  private baseRate: number = 86.40;
  private availableUsdLiquidity: number = 25000000.0; // $25M USD initial pool
  private lockedInEscrowUsd: number = 0.0;
  private settledVolumeUsd: number = 142500.0; // pre-seeded demo volume

  constructor() {
    // Slight live micro-jitter simulation
    setInterval(() => {
      const jitter = (Math.random() - 0.5) * 0.04;
      this.baseRate = Math.round((86.40 + jitter) * 100) / 100;
    }, 5000);
  }

  /**
   * Generates a real-time institutional FX quote with dynamic fee calculation
   * Citi PvP Fee: 0.25% (vs legacy Swift/Correspondent 4.5% + $45 flat wire)
   */
  public generateQuote(usdAmount: number, timeLockSeconds: number = 60): FXQuote {
    const rate = this.baseRate;
    const grossInr = usdAmount * rate;

    // Citi PvP atomic fee: 0.25%
    const citiFeePercent = 0.25;
    const citiFeeUsd = Math.round((usdAmount * (citiFeePercent / 100)) * 100) / 100;
    const netUsd = usdAmount - citiFeeUsd;
    const netInrRecipient = Math.round(netUsd * rate * 100) / 100;

    // Traditional correspondent banking calculation (4.5% spread markup + $45 flat wire fee)
    const traditionalFeeUsd = Math.round((usdAmount * 0.045 + 45.0) * 100) / 100;
    const traditionalNetUsd = Math.max(0, usdAmount - traditionalFeeUsd);
    const traditionalInrRecipient = Math.round(traditionalNetUsd * rate * 100) / 100;

    const savingsUsd = Math.max(0, Math.round((traditionalFeeUsd - citiFeeUsd) * 100) / 100);
    const savingsPercent = Math.round(((traditionalFeeUsd - citiFeeUsd) / traditionalFeeUsd) * 1000) / 10;

    const now = Math.floor(Date.now() / 1000);

    return {
      quoteId: `CITI-FX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      usdAmount,
      fxRate: rate,
      grossInr: Math.round(grossInr * 100) / 100,
      citiFeePercent,
      citiFeeUsd,
      netInrRecipient,
      traditionalFeeUsd,
      traditionalInrRecipient,
      savingsUsd,
      savingsPercent,
      timeLockSeconds,
      expiresAt: now + timeLockSeconds,
      guaranteedRateTimestamp: now,
    };
  }

  /**
   * Reserves liquidity from Citi Treasury for escrow locking
   */
  public reserveLiquidity(amountUsd: number): boolean {
    if (this.availableUsdLiquidity < amountUsd) {
      return false;
    }
    this.availableUsdLiquidity -= amountUsd;
    this.lockedInEscrowUsd += amountUsd;
    return true;
  }

  /**
   * Finalizes liquidity when escrow is settled
   */
  public commitSettlement(amountUsd: number): void {
    this.lockedInEscrowUsd = Math.max(0, this.lockedInEscrowUsd - amountUsd);
    this.settledVolumeUsd += amountUsd;
  }

  /**
   * Releases reserved liquidity back to available pool on refund
   */
  public releaseRefund(amountUsd: number): void {
    this.lockedInEscrowUsd = Math.max(0, this.lockedInEscrowUsd - amountUsd);
    this.availableUsdLiquidity += amountUsd;
  }

  public getTreasuryStatus() {
    return {
      nodeId: 'CITI-NY-WHOLESALE-01',
      location: 'New York, USA (Fedwire & CHIPS Gateway)',
      currentFxRate: this.baseRate,
      availableUsdLiquidity: Math.round(this.availableUsdLiquidity * 100) / 100,
      lockedInEscrowUsd: Math.round(this.lockedInEscrowUsd * 100) / 100,
      settledVolumeUsd: Math.round(this.settledVolumeUsd * 100) / 100,
    };
  }
}

export const citiFxService = new CitiFxService();
