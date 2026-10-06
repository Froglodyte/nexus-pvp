import crypto from 'node:crypto';
export class NpciRailService {
    // Enclave storing secret preimages indexed by hashLock until credit confirmation
    secretEnclave = new Map();
    // Mock beneficiary accounts with persistent balances for demonstration
    domesticBeneficiaries = new Map([
        [
            'priya.sharma@okhdfcbank',
            {
                vpa: 'priya.sharma@okhdfcbank',
                recipientName: 'Priya Sharma',
                bankName: 'HDFC Bank Ltd',
                ifsc: 'HDFC0001234',
                railType: 'UPI',
                status: 'ACTIVE',
                accountType: 'Savings Account (Retail UPI)',
                walletBalanceInr: 45200.0,
            },
        ],
        [
            'aarav.patel@upi',
            {
                vpa: 'aarav.patel@upi',
                recipientName: 'Aarav Patel',
                bankName: 'State Bank of India',
                ifsc: 'SBIN0000456',
                railType: 'UPI',
                status: 'ACTIVE',
                accountType: 'Savings Account (Instant IMPS/UPI)',
                walletBalanceInr: 18450.0,
            },
        ],
        [
            'CBDC-WALLET-IN-9812',
            {
                vpa: 'CBDC-WALLET-IN-9812',
                recipientName: 'Vikram Mehta Enterprises',
                bankName: 'Reserve Bank of India (Digital Rupee Rail)',
                ifsc: 'RBIS0CBDC01',
                railType: 'CBDC_E_RUPEE',
                status: 'ACTIVE',
                accountType: 'Wholesale e-Rupee CBDC Token Wallet',
                walletBalanceInr: 320000.0,
            },
        ],
        [
            'ERUPEE-IND-88492041',
            {
                vpa: 'ERUPEE-IND-88492041',
                recipientName: 'Ananya Deshmukh',
                bankName: 'ICICI Bank (Digital Rupee Node)',
                ifsc: 'ICIC0000884',
                railType: 'CBDC_E_RUPEE',
                status: 'ACTIVE',
                accountType: 'Retail CBDC Digital Rupee e₹ Vault',
                walletBalanceInr: 6540.0,
            },
        ],
    ]);
    availableInrLiquidity = 2150000000.0; // ₹2.15 Billion INR NPCI Settlement Pool
    settledVolumeInr = 12312000.0;
    railStatus = 'ONLINE';
    /**
     * Resolves a UPI VPA or e-Rupee CBDC wallet address
     */
    resolveVPA(vpa) {
        const clean = vpa.trim().toLowerCase();
        for (const [key, val] of this.domesticBeneficiaries.entries()) {
            if (key.toLowerCase() === clean) {
                return { ...val };
            }
        }
        // Auto-detect or mock new VPAs dynamically
        const isCbdc = clean.includes('cbdc') || clean.includes('erupee') || clean.includes('e-rupee');
        const railType = isCbdc ? 'CBDC_E_RUPEE' : 'UPI';
        const newRecord = {
            vpa,
            recipientName: isCbdc ? 'Institutional CBDC Holder' : 'Domestic UPI Beneficiary',
            bankName: isCbdc ? 'RBI Digital Rupee Infrastructure' : 'NPCI Interbank Switch',
            ifsc: isCbdc ? 'RBIS0CBDC99' : 'NPCI0001999',
            railType,
            status: 'ACTIVE',
            accountType: isCbdc ? 'Digital Rupee e₹ Enclave' : 'UPI Verified Account',
            walletBalanceInr: 10000.0,
        };
        this.domesticBeneficiaries.set(vpa, newRecord);
        return newRecord;
    }
    /**
     * Generates a 32-byte cryptographic secret Preimage (R) and computes H = SHA256(R)
     * The preimage R remains locked in the NPCI HSM Enclave until local INR disbursement occurs.
     */
    generatePreimageBundle(escrowId) {
        // 32 cryptographically secure random bytes
        const randomBytes = crypto.randomBytes(32);
        const preimageHex = randomBytes.toString('hex'); // 64 hex characters
        // Compute H = SHA-256(R)
        const hashLockHex = crypto.createHash('sha256').update(randomBytes).digest('hex');
        this.secretEnclave.set(hashLockHex, {
            preimage: preimageHex,
            escrowId,
            createdAt: Date.now(),
        });
        return {
            preimage: preimageHex,
            hashLock: hashLockHex,
            generatedAt: Math.floor(Date.now() / 1000),
        };
    }
    /**
     * Simulates domestic INR settlement on UPI / e-Rupee rails.
     * If simulateFailure is TRUE: simulates rail outage / timeout, intentionally withholding Preimage R!
     * If simulateFailure is FALSE: credits local beneficiary, generates UTR / CBDC mint tx, reveals Preimage R.
     */
    processDomesticCredit(params) {
        const { hashLock, vpa, inrAmount, simulateFailure } = params;
        // Outage Simulation Branch
        if (simulateFailure) {
            this.railStatus = 'SIMULATED_OUTAGE';
            // In outage mode, the secret R is strictly WITHHELD inside the enclave
            return {
                success: false,
                error: 'NPCI Rail Failure: UPI Interbank Switch connection timeout (Bank CBS unreachable). Secret Preimage R WITHHELD by hardware security module.',
            };
        }
        this.railStatus = 'ONLINE';
        // Verify secret bundle exists in enclave
        const secretRecord = this.secretEnclave.get(hashLock);
        if (!secretRecord) {
            return {
                success: false,
                error: 'Security Alert: Preimage for this hashLock was not found in NPCI hardware enclave.',
            };
        }
        // Resolve beneficiary and credit funds
        const beneficiary = this.resolveVPA(vpa);
        const currentBalance = beneficiary.walletBalanceInr || 0;
        const newBalance = Math.round((currentBalance + inrAmount) * 100) / 100;
        beneficiary.walletBalanceInr = newBalance;
        this.domesticBeneficiaries.set(vpa, beneficiary);
        // Update global NPCI volume
        this.settledVolumeInr += inrAmount;
        // Generate authentic transaction receipts
        const utr = `NPCI${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
        const cbdcHash = `0x${crypto.randomBytes(24).toString('hex')}`;
        // Domestic credit verified -> Reveal Preimage R to coordinator
        return {
            success: true,
            preimage: secretRecord.preimage,
            utrNumber: beneficiary.railType === 'UPI' ? utr : undefined,
            cbdcTxHash: beneficiary.railType === 'CBDC_E_RUPEE' ? cbdcHash : undefined,
            newBalance,
            beneficiaryName: beneficiary.recipientName,
        };
    }
    getBeneficiary(vpa) {
        return this.domesticBeneficiaries.get(vpa);
    }
    getAllBeneficiaries() {
        return Array.from(this.domesticBeneficiaries.values());
    }
    getRailStatus() {
        return {
            nodeId: 'NPCI-BLR-SWITCH-01',
            location: 'Bengaluru / Mumbai, India (National Financial Switch)',
            railsConnected: ['UPI 2.0 (IMPS/AutoPay)', 'RBI e-Rupee CBDC Wholesale/Retail Node'],
            domesticSwitchStatus: this.railStatus,
            availableInrLiquidity: Math.round(this.availableInrLiquidity * 100) / 100,
            settledVolumeInr: Math.round(this.settledVolumeInr * 100) / 100,
        };
    }
}
export const npciRailService = new NpciRailService();
