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
const placedObjects = [];
let activePlayers = 0;
let emptyWorldTimer;
const emptyWorldGraceMs = 15_000;

function broadcastPresence(packet, excludedSocket) {
  const message = JSON.stringify(packet);
  for (const client of wss.clients) {
    if (client !== excludedSocket && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'packet-server' });
});

wss.on('connection', (socket) => {
  if (emptyWorldTimer) {
    clearTimeout(emptyWorldTimer);
    emptyWorldTimer = undefined;
  }
  activePlayers += 1;
  socket.isAlive = true;
  console.log(`Player joined (${activePlayers} connected); sending ${placedObjects.length} saved objects`);
  socket.send(JSON.stringify({ type: 'worldState', objects: placedObjects }));
  broadcastPresence({ type: 'playerJoined', playerCount: activePlayers }, socket);

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

    if (packet.type === 'deleteObject') {
      if (typeof packet.id !== 'string') {
        console.warn('Ignored deleteObject packet without an object ID');
        return;
      }
      const objectIndex = placedObjects.findIndex((object) => object.id === packet.id);
      if (objectIndex === -1) {
        console.warn(`Ignored deleteObject for unknown ID: ${packet.id}`);
        return;
      }
      placedObjects.splice(objectIndex, 1);
      console.log(`Deleted object ${packet.id}; ${placedObjects.length} saved`);
    } else if (packet.type === 'placeObject') {
      if (typeof packet.id !== 'string') {
        console.warn('Ignored placeObject packet without an object ID');
        return;
      }
      placedObjects.push(packet);
      console.log(`Stored ${packet.objectType || 'object'} ${packet.id}; ${placedObjects.length} saved`);
    } else {
      return;
    }

    // Relay packets to every client except the sender, which already applied its local action.
    const outgoing = JSON.stringify(packet);

    for (const client of wss.clients) {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(outgoing);
      }
    }
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });

  socket.on('close', () => {
    activePlayers -= 1;
    console.log(`Player left (${activePlayers} connected)`);
    broadcastPresence({ type: 'playerLeft', playerCount: activePlayers });
    if (activePlayers === 0) {
      emptyWorldTimer = setTimeout(() => {
        if (activePlayers === 0) {
          console.log(`No players rejoined; clearing ${placedObjects.length} saved objects`);
          placedObjects.length = 0;
        }
        emptyWorldTimer = undefined;
      }, emptyWorldGraceMs);
    }
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