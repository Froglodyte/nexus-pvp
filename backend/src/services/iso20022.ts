import { HTLCEscrow } from '../types.js';

export interface Iso20022Bundle {
  pacs008: string; // FI-to-FI Customer Credit Transfer
  pacs002?: string; // Payment Status Report (Settled)
  pacs004?: string; // Payment Return (Refunded)
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

/**
 * ISO 20022 Financial Messaging Engine for Nexus-PvP Corridor
 * Produces compliant SWIFT MX XML messages:
 * - pacs.008.001.10 (Direct Credit Transfer on Escrow Lock)
 * - pacs.002.001.12 (Payment Status Report on Preimage Settlement)
 * - pacs.004.001.11 (Payment Return on Timelock Expiry / Refund)
 */
export class Iso20022Service {
  /**
   * Generates ISO 20022 XML messages corresponding to the HTLC escrow lifecycle
   */
  public generateMessages(escrow: HTLCEscrow): Iso20022Bundle {
    const creationTime = new Date(escrow.createdAt * 1000).toISOString();
    const settledTime = escrow.settledAt ? new Date(escrow.settledAt * 1000).toISOString() : undefined;
    const refundedTime = escrow.refundedAt ? new Date(escrow.refundedAt * 1000).toISOString() : undefined;

    const uetr = `f81d4fae-7dec-11d0-${escrow.escrowId.replace(/[^a-zA-Z0-9]/g, '').slice(-12).padStart(12, '0').toLowerCase()}`;
    const msgId = `CITI/NPCI/PVP/${escrow.escrowId}`;
    const senderBic = 'CITIUS33XXX'; // Citibank N.A. New York
    const receiverBic = escrow.railType === 'CBDC_E_RUPEE' ? 'RBISINBBXXX' : 'HDFCINBBXXX'; // RBI e-Rupee or Domestic HDFC Bank

    // 1. Generate pacs.008.001.10 (FI to FI Customer Credit Transfer)
    const pacs008 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${creationTime}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys>
          <Prtry>DRUNIX_HTLC_PVP</Prtry>
        </ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>${escrow.escrowId}</EndToEndId>
        <UETR>${uetr}</UETR>
        <TxId>${escrow.ledgerTxHash}</TxId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="USD">${escrow.amount.toFixed(2)}</IntrBkSttlmAmt>
      <InstdAmt Ccy="INR">${escrow.inrAmount.toFixed(2)}</InstdAmt>
      <XchgRate>${escrow.fxRate.toFixed(4)}</XchgRate>
      <ChrgBr>DEBT</ChrgBr>
      <Dbtr>
        <Nm>${escrow.senderId}</Nm>
        <PstlAdr>
          <Ctry>US</Ctry>
          <TwnNm>New York</TwnNm>
        </PstlAdr>
      </Dbtr>
      <DbtrAgt>
        <FinInstnId>
          <BICFI>${senderBic}</BICFI>
          <Nm>Citibank N.A. New York</Nm>
        </FinInstnId>
      </DbtrAgt>
      <CdtrAgt>
        <FinInstnId>
          <BICFI>${receiverBic}</BICFI>
          <Nm>${escrow.railType === 'CBDC_E_RUPEE' ? 'Reserve Bank of India (Digital Rupee Node)' : 'NPCI Interbank Clearing Rail'}</Nm>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>Domestic Beneficiary</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>${escrow.receiverVpa}</Id>
              <SchmeNm>
                <Prtry>${escrow.railType === 'CBDC_E_RUPEE' ? 'RBI_E_RUPEE_VAULT' : 'NPCI_UPI_VPA'}</Prtry>
              </SchmeNm>
            </Othr>
          </OrgId>
        </Id>
      </Cdtr>
      <RmtInf>
        <Ustrd>HTLC Locked: HashLock=${escrow.hashLock}; TimelockExpiry=${escrow.timeLock}</Ustrd>
      </RmtInf>
      <SplmtryData>
        <Envlp>
          <DrunixConsensus>
            <BlockHeight>${escrow.blockNumber}</BlockHeight>
            <ContractAddress>nexus-pvp-htlc:v2.6</ContractAddress>
            <AtomicInvariant>SHA256_PAYMENT_VERSUS_PAYMENT</AtomicInvariant>
          </DrunixConsensus>
        </Envlp>
      </SplmtryData>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;

    // 2. Generate pacs.002.001.12 (Payment Status Report - Settled)
    let pacs002: string | undefined;
    if (escrow.state === 'SETTLED' && escrow.secretPreimage) {
      pacs002 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.002.001.12">
  <FIToFIPmtStsRpt>
    <GrpHdr>
      <MsgId>STATUS/${escrow.escrowId}/${Date.now()}</MsgId>
      <CreDtTm>${settledTime || new Date().toISOString()}</CreDtTm>
    </GrpHdr>
    <OrgnlGrpInfAndSts>
      <OrgnlMsgId>${msgId}</OrgnlMsgId>
      <OrgnlMsgNmId>pacs.008.001.10</OrgnlMsgNmId>
      <GrpSts>ACTC</GrpSts>
    </OrgnlGrpInfAndSts>
    <TxInfAndSts>
      <StsId>PVP-SETTLE-OK</StsId>
      <OrgnlEndToEndId>${escrow.escrowId}</OrgnlEndToEndId>
      <OrgnlUETR>${uetr}</OrgnlUETR>
      <TxSts>ACSP</TxSts>
      <StsRsnInf>
        <Rsn>
          <Prtry>PVP_ATOMIC_SETTLED</Prtry>
        </Rsn>
        <AddtlInf>Preimage verified deterministically on Drunix ledger. Domestic credit confirmed (${escrow.utrNumber || escrow.cbdcTxHash}).</AddtlInf>
      </StsRsnInf>
      <SplmtryData>
        <Envlp>
          <CryptographicProof>
            <SecretPreimageR>${escrow.secretPreimage}</SecretPreimageR>
            <VerifiedHashLockH>${escrow.hashLock}</VerifiedHashLockH>
            <DomesticRailReceipt>${escrow.utrNumber || escrow.cbdcTxHash}</DomesticRailReceipt>
          </CryptographicProof>
        </Envlp>
      </SplmtryData>
    </TxInfAndSts>
  </FIToFIPmtStsRpt>
</Document>`;
    }

    // 3. Generate pacs.004.001.11 (Payment Return - Refunded)
    let pacs004: string | undefined;
    if (escrow.state === 'REFUNDED') {
      pacs004 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.004.001.11">
  <PmtRtr>
    <GrpHdr>
      <MsgId>RETURN/${escrow.escrowId}/${Date.now()}</MsgId>
      <CreDtTm>${refundedTime || new Date().toISOString()}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys>
          <Prtry>DRUNIX_ATOMIC_ROLLBACK</Prtry>
        </ClrSys>
      </SttlmInf>
    </GrpHdr>
    <OrgnlGrpInf>
      <OrgnlMsgId>${msgId}</OrgnlMsgId>
      <OrgnlMsgNmId>pacs.008.001.10</OrgnlMsgNmId>
    </OrgnlGrpInf>
    <TxInf>
      <RtrId>REFUND-${escrow.escrowId}</RtrId>
      <OrgnlEndToEndId>${escrow.escrowId}</OrgnlEndToEndId>
      <OrgnlUETR>${uetr}</OrgnlUETR>
      <RtrdIntrBkSttlmAmt Ccy="USD">${escrow.amount.toFixed(2)}</RtrdIntrBkSttlmAmt>
      <RtrRsnInf>
        <Rsn>
          <Cd>TIMO</Cd>
        </Rsn>
        <AddtlInf>HTLC Timelock elapsed without claim. 100% principal refunded to Citi Treasury. Zero Herstatt risk loss.</AddtlInf>
      </RtrRsnInf>
      <SplmtryData>
        <Envlp>
          <RollbackProof>
            <TimelockExpiryTimestamp>${escrow.timeLock}</TimelockExpiryTimestamp>
            <RefundDisbursedTo>${escrow.disbursedTo || escrow.senderId}</RefundDisbursedTo>
          </RollbackProof>
        </Envlp>
      </SplmtryData>
    </TxInf>
  </PmtRtr>
</Document>`;
    }

    return {
      pacs008,
      pacs002,
      pacs004,
      metadata: {
        messageId: msgId,
        uetr,
        clearingChannel: 'DRUNIX_HTLC_PVP',
        senderBic,
        receiverBic,
        instructedAmount: `USD ${escrow.amount.toFixed(2)}`,
        settlementAmount: `INR ${escrow.inrAmount.toFixed(2)}`,
        fxRate: escrow.fxRate,
        status: escrow.state === 'SETTLED' ? 'ACSP (Settled)' : escrow.state === 'REFUNDED' ? 'RJCT/RETURN (Refunded)' : 'PDNG (Locked)',
      },
    };
  }
}

export const iso20022Service = new Iso20022Service();
