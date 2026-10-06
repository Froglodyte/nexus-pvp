package main

import (
	"crypto/sha256"
	"encoding/hex"
	"testing"
	"time"
)

func TestHTLC_Lifecycle_HappyPath(t *testing.T) {
	ledger := NewMemoryLedger()
	contract := NewHTLCContract()

	// 1. Generate preimage and SHA-256 hash
	preimage := "drunix_secret_preimage_nexus_pvp_2026_citi_npci_rail"
	hash := sha256.Sum256([]byte(preimage))
	hashLock := hex.EncodeToString(hash[:])

	now := time.Now().Unix()
	timelock := now + 120 // 2 minutes in future

	escrowID := "ESCROW-USD-INR-001"
	senderID := "CITI_NY_TREASURY_01"
	receiverVPA := "priya.sharma@okhdfcbank"
	amount := 1000.00
	symbol := "USD"

	// 2. Create Escrow
	escrow, err := contract.CreateEscrow(ledger, escrowID, senderID, receiverVPA, amount, symbol, hashLock, timelock, now)
	if err != nil {
		t.Fatalf("CreateEscrow failed: %v", err)
	}

	if escrow.State != StateLocked {
		t.Fatalf("expected state %s, got %s", StateLocked, escrow.State)
	}
	if escrow.HashLock != hashLock {
		t.Fatalf("hashLock mismatch: expected %s, got %s", hashLock, escrow.HashLock)
	}

	// 3. Claim Funds with correct preimage before timelock
	claimTime := now + 30
	settled, err := contract.ClaimFunds(ledger, escrowID, preimage, claimTime)
	if err != nil {
		t.Fatalf("ClaimFunds failed: %v", err)
	}

	if settled.State != StateSettled {
		t.Fatalf("expected settled state %s, got %s", StateSettled, settled.State)
	}
	if settled.SecretPreimage != preimage {
		t.Fatalf("expected preimage %s, got %s", preimage, settled.SecretPreimage)
	}
	if settled.DisbursedTo != receiverVPA {
		t.Fatalf("expected disbursedTo %s, got %s", receiverVPA, settled.DisbursedTo)
	}

	// 4. Double claim should fail
	_, err = contract.ClaimFunds(ledger, escrowID, preimage, claimTime+5)
	if err != ErrAlreadySettled {
		t.Fatalf("expected ErrAlreadySettled, got %v", err)
	}
}

func TestHTLC_InvalidPreimage_Rejected(t *testing.T) {
	ledger := NewMemoryLedger()
	contract := NewHTLCContract()

	validPreimage := "legitimate_preimage_secret_12345"
	hash := sha256.Sum256([]byte(validPreimage))
	hashLock := hex.EncodeToString(hash[:])

	now := time.Now().Unix()
	timelock := now + 60
	escrowID := "ESCROW-USD-INR-BAD-HASH"

	_, err := contract.CreateEscrow(ledger, escrowID, "CITI_NY", "beneficiary@upi", 500, "USD", hashLock, timelock, now)
	if err != nil {
		t.Fatalf("failed to create escrow: %v", err)
	}

	// Attempt claim with incorrect preimage
	wrongPreimage := "malicious_or_wrong_preimage_54321"
	_, err = contract.ClaimFunds(ledger, escrowID, wrongPreimage, now+10)
	if err == nil {
		t.Fatalf("expected claim to fail with invalid preimage, but succeeded")
	}
}

func TestHTLC_ClaimAfterTimelock_Rejected(t *testing.T) {
	ledger := NewMemoryLedger()
	contract := NewHTLCContract()

	preimage := "valid_secret_key"
	hash := sha256.Sum256([]byte(preimage))
	hashLock := hex.EncodeToString(hash[:])

	now := time.Now().Unix()
	timelock := now + 60
	escrowID := "ESCROW-USD-INR-TIMEOUT"

	_, err := contract.CreateEscrow(ledger, escrowID, "CITI_NY", "beneficiary@upi", 250, "USD", hashLock, timelock, now)
	if err != nil {
		t.Fatalf("failed to create escrow: %v", err)
	}

	// Attempt claim after timelock expired
	expiredTime := timelock + 1
	_, err = contract.ClaimFunds(ledger, escrowID, preimage, expiredTime)
	if err != ErrTimelockExpired {
		t.Fatalf("expected ErrTimelockExpired, got %v", err)
	}
}

func TestHTLC_Refund_Premature_Rejected(t *testing.T) {
	ledger := NewMemoryLedger()
	contract := NewHTLCContract()

	preimage := "secret_preimage"
	hash := sha256.Sum256([]byte(preimage))
	hashLock := hex.EncodeToString(hash[:])

	now := time.Now().Unix()
	timelock := now + 60
	escrowID := "ESCROW-REFUND-EARLY"
	senderID := "CITI_NY_SENDER"

	_, err := contract.CreateEscrow(ledger, escrowID, senderID, "beneficiary@upi", 100, "USD", hashLock, timelock, now)
	if err != nil {
		t.Fatalf("failed to create escrow: %v", err)
	}

	// Try refund before timelock expires
	_, err = contract.Refund(ledger, escrowID, senderID, now+10)
	if err == nil {
		t.Fatalf("expected refund to fail before timelock, but succeeded")
	}
}

func TestHTLC_Refund_AfterTimelock_Success(t *testing.T) {
	ledger := NewMemoryLedger()
	contract := NewHTLCContract()

	preimage := "secret_preimage"
	hash := sha256.Sum256([]byte(preimage))
	hashLock := hex.EncodeToString(hash[:])

	now := time.Now().Unix()
	timelock := now + 60
	escrowID := "ESCROW-REFUND-SUCCESS"
	senderID := "CITI_NY_SENDER"

	_, err := contract.CreateEscrow(ledger, escrowID, senderID, "beneficiary@upi", 100, "USD", hashLock, timelock, now)
	if err != nil {
		t.Fatalf("failed to create escrow: %v", err)
	}

	// Refund after timelock expires
	refundTime := timelock + 5
	refunded, err := contract.Refund(ledger, escrowID, senderID, refundTime)
	if err != nil {
		t.Fatalf("expected refund to succeed, got %v", err)
	}

	if refunded.State != StateRefunded {
		t.Fatalf("expected state %s, got %s", StateRefunded, refunded.State)
	}
	if refunded.DisbursedTo != senderID {
		t.Fatalf("expected disbursedTo %s, got %s", senderID, refunded.DisbursedTo)
	}

	// Cannot refund again
	_, err = contract.Refund(ledger, escrowID, senderID, refundTime+10)
	if err != ErrAlreadyRefunded {
		t.Fatalf("expected ErrAlreadyRefunded, got %v", err)
	}
}

func TestHTLC_UnauthorizedRefund_Rejected(t *testing.T) {
	ledger := NewMemoryLedger()
	contract := NewHTLCContract()

	preimage := "secret_preimage"
	hash := sha256.Sum256([]byte(preimage))
	hashLock := hex.EncodeToString(hash[:])

	now := time.Now().Unix()
	timelock := now + 60
	escrowID := "ESCROW-REFUND-UNAUTH"
	senderID := "CITI_NY_SENDER"

	_, err := contract.CreateEscrow(ledger, escrowID, senderID, "beneficiary@upi", 100, "USD", hashLock, timelock, now)
	if err != nil {
		t.Fatalf("failed to create escrow: %v", err)
	}

	// Attacker tries to trigger refund
	attacker := "ATTACKER_WALLET"
	_, err = contract.Refund(ledger, escrowID, attacker, timelock+10)
	if err == nil {
		t.Fatalf("expected unauthorized refund to fail, but succeeded")
	}
}
