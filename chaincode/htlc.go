package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"
)

// EscrowState represents the lifecycle status of an HTLC escrow
type EscrowState string

const (
	StateLocked   EscrowState = "LOCKED"
	StateSettled  EscrowState = "SETTLED"
	StateRefunded EscrowState = "REFUNDED"
)

// Common errors
var (
	ErrEscrowNotFound       = errors.New("escrow does not exist on ledger")
	ErrEscrowAlreadyExists   = errors.New("escrow with this ID already exists")
	ErrInvalidAmount         = errors.New("amount must be greater than zero")
	ErrInvalidHashLock       = errors.New("invalid hash lock: must be a valid 64-char hex SHA-256 string")
	ErrInvalidTimeLock       = errors.New("timelock must be in the future relative to creation time")
	ErrInvalidPreimage       = errors.New("cryptographic verification failed: SHA-256(preimage) does not match HashLock")
	ErrTimelockExpired       = errors.New("cannot claim: timelock has expired; escrow is eligible for refund")
	ErrTimelockNotExpired    = errors.New("cannot refund: timelock has not expired yet")
	ErrAlreadySettled        = errors.New("cannot operate on escrow: already settled")
	ErrAlreadyRefunded       = errors.New("cannot operate on escrow: already refunded")
	ErrInvalidState          = errors.New("escrow is not in LOCKED state")
	ErrUnauthorizedRefund    = errors.New("unauthorized: only original sender can trigger refund")
)

// HTLCEscrow represents the state of a Hash Time-Locked Contract on the Drunix / Fabric Ledger
type HTLCEscrow struct {
	EscrowID       string      `json:"escrowId"`
	SenderID       string      `json:"senderId"`
	ReceiverVPA    string      `json:"receiverVpa"`
	Amount         float64     `json:"amount"`
	AmountCents    int64       `json:"amountCents"`    // Fixed-point integer fractional units (cents) to avoid IEEE 754 drift
	TokenSymbol    string      `json:"tokenSymbol"`
	HashLock       string      `json:"hashLock"`       // Hex-encoded SHA-256 hash (64 hex characters)
	TimeLock       int64       `json:"timeLock"`       // Unix timestamp in seconds
	State          EscrowState `json:"state"`          // LOCKED, SETTLED, REFUNDED
	SecretPreimage string      `json:"secretPreimage"` // Plaintext secret preimage revealed on claim
	CreatedAt      int64       `json:"createdAt"`
	SettledAt      int64       `json:"settledAt,omitempty"`
	RefundedAt     int64       `json:"refundedAt,omitempty"`
	DisbursedTo    string      `json:"disbursedTo,omitempty"`
}

// GetAmountCents returns the integer value in lowest fractional currency units (e.g. cents/paise)
// to prevent floating-point rounding errors in financial ledgers.
func (e *HTLCEscrow) GetAmountCents() int64 {
	if e.AmountCents != 0 {
		return e.AmountCents
	}
	return int64(math.Round(e.Amount * 100))
}

// LedgerState represents the key-value ledger interface (abstracting Fabric stub / Drunix world state)
type LedgerState interface {
	PutState(key string, value []byte) error
	GetState(key string) ([]byte, error)
	DeleteState(key string) error
}

// MemoryLedger provides an in-memory implementation of LedgerState for testing and runtime execution
type MemoryLedger struct {
	mu    sync.RWMutex
	state map[string][]byte
}

// NewMemoryLedger initializes an in-memory ledger
func NewMemoryLedger() *MemoryLedger {
	return &MemoryLedger{
		state: make(map[string][]byte),
	}
}

func (m *MemoryLedger) PutState(key string, value []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.state[key] = value
	return nil
}

func (m *MemoryLedger) GetState(key string) ([]byte, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	val, ok := m.state[key]
	if !ok {
		return nil, nil
	}
	return val, nil
}

func (m *MemoryLedger) DeleteState(key string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.state, key)
	return nil
}

// HTLCContract encapsulates chaincode operations
type HTLCContract struct{}

// NewHTLCContract creates a new contract instance
func NewHTLCContract() *HTLCContract {
	return &HTLCContract{}
}

// Helper to compute SHA-256 hash
func computeSHA256Hex(preimage string) string {
	// If preimage is a 64-char hex string, decode hex bytes first
	clean := strings.TrimSpace(preimage)
	if len(clean) == 64 {
		if rawBytes, err := hex.DecodeString(clean); err == nil {
			h := sha256.Sum256(rawBytes)
			return hex.EncodeToString(h[:])
		}
	}
	// Otherwise hash the UTF-8 bytes directly
	h := sha256.Sum256([]byte(clean))
	return hex.EncodeToString(h[:])
}

// CreateEscrow locks funds into the HTLC escrow with a SHA-256 hashlock and expiry timelock
func (c *HTLCContract) CreateEscrow(
	ledger LedgerState,
	escrowID string,
	senderID string,
	receiverVPA string,
	amount float64,
	tokenSymbol string,
	hashLock string,
	timeLock int64,
	currentTime int64,
) (*HTLCEscrow, error) {
	if escrowID == "" {
		return nil, errors.New("escrowID cannot be empty")
	}
	if senderID == "" {
		return nil, errors.New("senderID cannot be empty")
	}
	if receiverVPA == "" {
		return nil, errors.New("receiverVPA cannot be empty")
	}
	if amount <= 0 {
		return nil, ErrInvalidAmount
	}

	cleanHashLock := strings.ToLower(strings.TrimSpace(hashLock))
	if len(cleanHashLock) != 64 {
		return nil, ErrInvalidHashLock
	}
	if _, err := hex.DecodeString(cleanHashLock); err != nil {
		return nil, ErrInvalidHashLock
	}

	if currentTime == 0 {
		currentTime = time.Now().Unix()
	}

	if timeLock <= currentTime {
		return nil, ErrInvalidTimeLock
	}

	// Check if already exists
	existingBytes, err := ledger.GetState(escrowID)
	if err != nil {
		return nil, fmt.Errorf("ledger read error: %w", err)
	}
	if existingBytes != nil && len(existingBytes) > 0 {
		return nil, ErrEscrowAlreadyExists
	}

	escrow := &HTLCEscrow{
		EscrowID:       escrowID,
		SenderID:       senderID,
		ReceiverVPA:    receiverVPA,
		Amount:         amount,
		AmountCents:    int64(math.Round(amount * 100)),
		TokenSymbol:    strings.ToUpper(tokenSymbol),
		HashLock:       cleanHashLock,
		TimeLock:       timeLock,
		State:          StateLocked,
		SecretPreimage: "",
		CreatedAt:      currentTime,
	}

	payload, err := json.Marshal(escrow)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize escrow: %w", err)
	}

	if err := ledger.PutState(escrowID, payload); err != nil {
		return nil, fmt.Errorf("failed to write escrow to ledger: %w", err)
	}

	return escrow, nil
}

// ClaimFunds allows the receiver (or clearing gateway) to claim funds by presenting the secret preimage R
// The contract verifies SHA-256(R) == HashLock and checks currentTime < TimeLock.
func (c *HTLCContract) ClaimFunds(
	ledger LedgerState,
	escrowID string,
	secretPreimage string,
	currentTime int64,
) (*HTLCEscrow, error) {
	if currentTime == 0 {
		currentTime = time.Now().Unix()
	}

	escrow, err := c.GetEscrow(ledger, escrowID)
	if err != nil {
		return nil, err
	}

	// State check
	if escrow.State == StateSettled {
		return nil, ErrAlreadySettled
	}
	if escrow.State == StateRefunded {
		return nil, ErrAlreadyRefunded
	}
	if escrow.State != StateLocked {
		return nil, ErrInvalidState
	}

	// Timelock expiration check: claim must be submitted strictly BEFORE timelock
	if currentTime >= escrow.TimeLock {
		return nil, ErrTimelockExpired
	}

	// Deterministic cryptographic hash verification
	computedHash := computeSHA256Hex(secretPreimage)
	if !strings.EqualFold(computedHash, escrow.HashLock) {
		return nil, fmt.Errorf("%w: computed %s != expected %s", ErrInvalidPreimage, computedHash, escrow.HashLock)
	}

	// Settle escrow and record preimage on-chain
	escrow.State = StateSettled
	escrow.SecretPreimage = secretPreimage
	escrow.SettledAt = currentTime
	escrow.DisbursedTo = escrow.ReceiverVPA

	payload, err := json.Marshal(escrow)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize updated escrow: %w", err)
	}

	if err := ledger.PutState(escrowID, payload); err != nil {
		return nil, fmt.Errorf("failed to update escrow state on ledger: %w", err)
	}

	return escrow, nil
}

// Refund enables the original sender to reclaim funds if the timelock has elapsed without a valid claim
func (c *HTLCContract) Refund(
	ledger LedgerState,
	escrowID string,
	callerID string,
	currentTime int64,
) (*HTLCEscrow, error) {
	if currentTime == 0 {
		currentTime = time.Now().Unix()
	}

	escrow, err := c.GetEscrow(ledger, escrowID)
	if err != nil {
		return nil, err
	}

	// State check
	if escrow.State == StateSettled {
		return nil, ErrAlreadySettled
	}
	if escrow.State == StateRefunded {
		return nil, ErrAlreadyRefunded
	}
	if escrow.State != StateLocked {
		return nil, ErrInvalidState
	}

	// Check caller authorization
	if callerID != "" && callerID != escrow.SenderID {
		return nil, fmt.Errorf("%w: caller '%s' is not sender '%s'", ErrUnauthorizedRefund, callerID, escrow.SenderID)
	}

	// Timelock check: refund can ONLY be triggered after timelock has elapsed
	if currentTime < escrow.TimeLock {
		return nil, fmt.Errorf("%w: current time %d < timelock %d (remaining %d seconds)",
			ErrTimelockNotExpired, currentTime, escrow.TimeLock, escrow.TimeLock-currentTime)
	}

	// Update state to REFUNDED
	escrow.State = StateRefunded
	escrow.RefundedAt = currentTime
	escrow.DisbursedTo = escrow.SenderID

	payload, err := json.Marshal(escrow)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize refunded escrow: %w", err)
	}

	if err := ledger.PutState(escrowID, payload); err != nil {
		return nil, fmt.Errorf("failed to write refunded escrow to ledger: %w", err)
	}

	return escrow, nil
}

// GetEscrow retrieves an escrow by its ID from the ledger state
func (c *HTLCContract) GetEscrow(ledger LedgerState, escrowID string) (*HTLCEscrow, error) {
	data, err := ledger.GetState(escrowID)
	if err != nil {
		return nil, fmt.Errorf("ledger read error: %w", err)
	}
	if data == nil || len(data) == 0 {
		return nil, ErrEscrowNotFound
	}

	var escrow HTLCEscrow
	if err := json.Unmarshal(data, &escrow); err != nil {
		return nil, fmt.Errorf("failed to deserialize escrow: %w", err)
	}
	return &escrow, nil
}

func main() {
	fmt.Println("Nexus-PvP HTLC Smart Contract Module (Citi x NPCI Drunix Chaincode 2026)")
	fmt.Println("Deterministic SHA-256 cryptographic verification ready.")
}
