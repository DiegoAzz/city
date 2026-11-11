import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { WebSocketServer } from 'ws';

function multiplayerDevPlugin() {
  return {
    name: 'multiplayer-dev-server',
    configureServer(server: any) {
      if (!server.httpServer) return;
      const wss = new WebSocketServer({ noServer: true });
      const clients = new Map<string, { ws: any; player: any }>();

      server.httpServer.on('upgrade', (req: any, socket: any, head: any) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        if (url.pathname === '/ws/multiplayer') {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
          });
        }
      });

      wss.on('connection', (ws) => {
        let clientId: string | null = null;
        ws.on('message', (raw) => {
          try {
            const msg = JSON.parse(raw.toString());
            if (msg.type === 'join') {
              clientId = msg.player.id;
              clients.set(clientId, { ws, player: msg.player });
              const existingPeers = Array.from(clients.entries())
                .filter(([id]) => id !== clientId)
                .map(([_, c]) => c.player);
              ws.send(JSON.stringify({ type: 'lobby-state', peers: existingPeers, count: clients.size }));
              broadcastExcept(clientId, { type: 'player-joined', player: msg.player, count: clients.size });
            } else if (msg.type === 'move') {
              if (clientId && clients.has(clientId)) {
                clients.get(clientId).player = { ...clients.get(clientId).player, ...msg.player };
                broadcastExcept(clientId, { type: 'peer-update', player: clients.get(clientId).player });
              }
            } else if (msg.type === 'chat') {
              if (clientId && clients.has(clientId)) {
                const sender = clients.get(clientId).player;
                broadcast({
                  type: 'chat-message',
                  id: clientId,
                  senderName: sender.name,
                  text: msg.text,
                  timestamp: Date.now()
                });
              }
            }
          } catch (e) {}
        });

        ws.on('close', () => {
          if (clientId && clients.has(clientId)) {
            clients.delete(clientId);
            broadcast({ type: 'player-left', id: clientId, count: clients.size });
          }
        });
      });

      function broadcast(obj: any) {
        const payload = JSON.stringify(obj);
        for (const { ws } of clients.values()) {
          if (ws.readyState === 1) ws.send(payload);
        }
      }

      function broadcastExcept(excludeId: string, obj: any) {
        const payload = JSON.stringify(obj);
        for (const [id, { ws }] of clients.entries()) {
          if (id !== excludeId && ws.readyState === 1) ws.send(payload);
        }
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const isHttps = mode === 'https' || process.env.HTTPS === 'true';

  return {
    server: {
      host: '0.0.0.0',
      port: 5173
    },
    plugins: [
      isHttps ? basicSsl() : null,
      multiplayerDevPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
        manifest: {
          name: 'Street Explorer Mobile',
          short_name: 'StreetExplorer',
          description: 'Exploración 3D de ciudades reales sobre OpenStreetMap',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,json}']
        }
      })
    ].filter(Boolean)
  };
});
