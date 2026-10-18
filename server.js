'use strict';

const http = require('node:http');
const { randomUUID } = require('node:crypto');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  maxPayload: 1024 * 1024,
});
const placedObjects = [];
const playerPositions = new Map();
let activePlayers = 0;

function normalizePlayerColor(color) {
  if (Number.isInteger(color) && color >= 0 && color <= 0xffffff) {
    return color;
  }
  if (typeof color === 'string' && /^#?[0-9a-f]{6}$/i.test(color)) {
    return Number.parseInt(color.replace(/^#/, ''), 16);
  }
  return 0xff5555;
}

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
  socket.playerId = randomUUID();
  activePlayers += 1;
  socket.isAlive = true;
  console.log(`Player joined (${activePlayers} connected); sending ${placedObjects.length} saved objects`);
  socket.send(JSON.stringify({ type: 'worldState', objects: placedObjects }));
  socket.send(JSON.stringify({
    type: 'playerState',
    players: Array.from(playerPositions, ([playerId, state]) => ({ playerId, ...state })),
  }));
  broadcastPresence({ type: 'playerJoined', playerId: socket.playerId, playerCount: activePlayers }, socket);

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
    if (packet.type === 'kickAll') {
      let kickedPlayers = 0;
      for (const client of wss.clients) {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          kickedPlayers += 1;
          client.send(
            JSON.stringify({ type: 'kicked', message: 'You have been kicked by another player.' }),
            (error) => {
              if (error) {
                client.terminate();
                return;
              }
              client.close(4001, 'Kicked by another player');
            }
          );
        }
      }
      console.log(`Kicking ${kickedPlayers} player(s) at the request of ${socket.playerId}`);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'kickAllResult', kickedPlayers }));
      }
      return;
    } else if (packet.type === 'playerPosition') {
      const { position, rotation } = packet;
      if (
        !position ||
        ![position.x, position.y, position.z].every(Number.isFinite) ||
        (rotation !== undefined && !Number.isFinite(rotation))
      ) {
        socket.send(JSON.stringify({ type: 'error', message: 'Player position must contain finite coordinates.' }));
        return;
      }

      const state = {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: Number.isFinite(rotation) ? rotation : 0,
        username: typeof packet.username === 'string' ? packet.username.trim().slice(0, 20) : '',
        playerColor: normalizePlayerColor(packet.playerColor ?? packet.color),
      };
      state.color = state.playerColor;
      playerPositions.set(socket.playerId, state);
      broadcastPresence({ type: 'playerPosition', playerId: socket.playerId, ...state }, socket);
      return;
    } else if (packet.type === 'deleteObject') {
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
    playerPositions.delete(socket.playerId);
    activePlayers -= 1;
    console.log(`Player left (${activePlayers} connected)`);
    broadcastPresence({ type: 'playerLeft', playerId: socket.playerId, playerCount: activePlayers });
    if (activePlayers === 0) {
      console.log(`Last player left; clearing ${placedObjects.length} saved objects`);
      placedObjects.length = 0;
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