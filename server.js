'use strict';

const http = require('node:http');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  maxPayload: 1024 * 1024,
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'packet-server' });
});

wss.on('connection', (socket) => {
  socket.isAlive = true;

  socket.on('pong', () => {
    socket.isAlive = true;
  });

  socket.on('message', (data, isBinary) => {
    if (isBinary) {
      socket.send(JSON.stringify({ type: 'error', message: 'Binary packets are not supported.' }));
      return;
    }

    let packet;

    try {
      packet = JSON.parse(data.toString());
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'Packet must be valid JSON.' }));
      return;
    }

    // Relay packets to all connected clients, including the sender.
    const outgoing = JSON.stringify(packet);

    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(outgoing);
      }
    }
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
});

const heartbeat = setInterval(() => {
  for (const socket of wss.clients) {
    if (!socket.isAlive) {
      socket.terminate();
      continue;
    }

    socket.isAlive = false;
    socket.ping();
  }
}, 30_000);

const port = Number(process.env.PORT) || 3000;

server.listen(port, '0.0.0.0', () => {
  console.log(`Packet server listening on port ${port}`);
});

function shutdown() {
  clearInterval(heartbeat);
  wss.close();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);