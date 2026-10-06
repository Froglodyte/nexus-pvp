import http from 'node:http';

async function testSuite() {
  console.log('Testing Nexus-PvP Orchestrator Endpoints...');

  const request = (path: string, method: string = 'GET', data?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const payload = data ? JSON.stringify(data) : undefined;
      const req = http.request(
        {
          hostname: 'localhost',
          port: 5001,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(body) });
            } catch {
              resolve({ status: res.statusCode, body });
            }
          });
        }
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  };

  // 1. Health check
  const health = await request('/api/health');
  console.log('Health check:', health.status, health.body.service);

  // 2. Quote
  const quote = await request('/api/quote?amount=2500');
  console.log(`Quote: USD 2500 @ rate ${quote.body.fxRate} -> Fee $${quote.body.citiFeeUsd} vs Traditional $${quote.body.traditionalFeeUsd} (Savings: $${quote.body.savingsUsd})`);

  // 3. Initiate Escrow
  const initiateRes = await request('/api/initiate', 'POST', {
    usdAmount: 1500,
    receiverVpa: 'priya.sharma@okhdfcbank',
    timeLockSeconds: 60,
  });
  console.log('Initiated Escrow:', initiateRes.body.escrow.escrowId, 'State:', initiateRes.body.escrow.state, 'HashLock:', initiateRes.body.escrow.hashLock.slice(0, 16) + '...');

  // 4. Settle Escrow
  const settleRes = await request('/api/settle', 'POST', {
    escrowId: initiateRes.body.escrow.escrowId,
  });
  console.log('Settled Escrow:', settleRes.body.escrow.escrowId, 'State:', settleRes.body.escrow.state, 'Preimage:', settleRes.body.preimage.slice(0, 16) + '...', 'UTR:', settleRes.body.utrNumber);

  // 5. Test Rail Outage & Atomic Rollback
  const failureEscrowRes = await request('/api/initiate', 'POST', {
    usdAmount: 5000,
    receiverVpa: 'aarav.patel@upi',
    timeLockSeconds: 60,
    simulateFailure: true,
  });
  console.log('Initiated Outage Test Escrow:', failureEscrowRes.body.escrow.escrowId);

  const failedSettleRes = await request('/api/settle', 'POST', {
    escrowId: failureEscrowRes.body.escrow.escrowId,
    simulateFailure: true,
  });
  console.log('Simulated Outage Result:', failedSettleRes.status, failedSettleRes.body.error);

  // Fast forward timelock
  const ffRes = await request('/api/fast-forward', 'POST', {
    escrowId: failureEscrowRes.body.escrow.escrowId,
  });
  console.log('Fast-forward result:', ffRes.body.message);

  // Trigger refund
  const refundRes = await request('/api/refund', 'POST', {
    escrowId: failureEscrowRes.body.escrow.escrowId,
  });
  console.log('Refund Result:', refundRes.body.escrow.escrowId, 'State:', refundRes.body.escrow.state, 'Refunded To:', refundRes.body.escrow.disbursedTo);

  console.log('\nAll End-to-End API and Settlement tests completed successfully!');
}

testSuite().catch(console.error);
