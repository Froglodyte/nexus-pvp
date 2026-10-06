import http from 'node:http';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { drunixLedger, remitController } from './controllers/remit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// REST Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Nexus-PvP Cross-Border Orchestration Node',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/quote', remitController.getQuote);
app.post('/api/initiate', remitController.initiateRemittance);
app.post('/api/settle', remitController.settleRemittance);
app.post('/api/refund', remitController.refundRemittance);
app.post('/api/fast-forward', remitController.fastForwardTimelock);
app.get('/api/escrows', remitController.listEscrows);
app.get('/api/escrows/:id', remitController.getEscrowById);
app.get('/api/beneficiaries', remitController.listBeneficiaries);
app.get('/api/events', remitController.getRecentEvents);
app.get('/api/system-status', remitController.getSystemStatus);

// Create HTTP server & WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket client management
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);

  // Send initial state synchronization snapshot
  const initialSync = {
    type: 'STATE_SYNC',
    timestamp: Date.now(),
    payload: {
      recentEvents: drunixLedger.getEvents().slice(0, 10),
      escrows: drunixLedger.getEscrows(),
      blockHeight: drunixLedger.getBlockHeight(),
    },
  };
  ws.send(JSON.stringify(initialSync));

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch {
      // ignore
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast ledger events to all connected WebSocket clients
drunixLedger.onEvent((event) => {
  const payload = JSON.stringify({
    type: 'CORRIDOR_EVENT',
    event,
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Nexus-PvP Cross-Border Settlement Gateway`);
  console.log(`  Citi Wholesale FX x NPCI UPI / e-Rupee Rail (2026)`);
  console.log(`  HTTP API Server: http://localhost:${PORT}`);
  console.log(`  WebSocket Server: ws://localhost:${PORT}`);
  console.log(`====================================================`);
});
