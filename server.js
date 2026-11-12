import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Serve static build assets
app.use(express.static(distPath));

// Healthcheck endpoint for Coolify / Docker
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// SPA fallback: all unmatched routes serve index.html
app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Multiplayer WebSocket Server
const clients = new Map();
const persistentProperties = new Map();

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  if (url.pathname === '/ws/multiplayer') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  let clientId = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'join') {
        clientId = msg.player.id;
        clients.set(clientId, { ws, player: { ...msg.player, lastActive: Date.now() } });

        // Send existing peers to newly joined player
        const existingPeers = Array.from(clients.entries())
          .filter(([id]) => id !== clientId)
          .map(([_, c]) => c.player);

        ws.send(JSON.stringify({
          type: 'lobby-state',
          peers: existingPeers,
          count: clients.size
        }));

        // Send existing claimed properties in this world instance
        if (persistentProperties.size > 0) {
          ws.send(JSON.stringify({
            type: 'properties-state',
            properties: Array.from(persistentProperties.values())
          }));
        }

        // Broadcast new player joined to all peers
        broadcastExcept(clientId, {
          type: 'player-joined',
          player: msg.player,
          count: clients.size
        });
      } else if (msg.type === 'move') {
        if (clientId && clients.has(clientId)) {
          const entry = clients.get(clientId);
          if (entry) {
            entry.player = { ...entry.player, ...msg.player, lastActive: Date.now() };
            broadcastExcept(clientId, {
              type: 'peer-update',
              player: entry.player
            });
          }
        }
      } else if (msg.type === 'chat') {
        if (clientId && clients.has(clientId)) {
          const entry = clients.get(clientId);
          if (entry) {
            const sender = entry.player;
            broadcast({
              type: 'chat-message',
              id: clientId,
              senderName: sender.name,
              text: msg.text,
              timestamp: Date.now()
            });
          }
        }
      } else if (msg.type === 'update-property') {
        if (msg.property && msg.property.id) {
          persistentProperties.set(msg.property.id, msg.property);
          broadcast({
            type: 'property-updated',
            property: msg.property
          });
        }
      }
    } catch (e) {
      console.warn('[MultiplayerServer] Message error:', e);
    }
  });

  ws.on('close', () => {
    if (clientId && clients.has(clientId)) {
      clients.delete(clientId);
      broadcast({
        type: 'player-left',
        id: clientId,
        count: clients.size
      });
    }
  });
});

function broadcast(obj) {
  const payload = JSON.stringify(obj);
  for (const { ws } of clients.values()) {
    if (ws.readyState === 1) { // 1 = OPEN
      ws.send(payload);
    }
  }
}

function broadcastExcept(excludeId, obj) {
  const payload = JSON.stringify(obj);
  for (const [id, { ws }] of clients.entries()) {
    if (id !== excludeId && ws.readyState === 1) {
      ws.send(payload);
    }
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Street Explorer Mobile Server running on http://0.0.0.0:${PORT}`);
  console.log(`👥 Real-time Multiplayer WebSocket active at ws://0.0.0.0:${PORT}/ws/multiplayer`);
  console.log(`📦 Ready for Coolify deployment!`);
});
