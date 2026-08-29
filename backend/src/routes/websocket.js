const { WebSocketServer } = require('ws');

let wss = null;
const subscriptions = new Map(); // projectId -> Set<ws>

function setupWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'subscribe' && data.projectId) {
          if (!subscriptions.has(data.projectId)) {
            subscriptions.set(data.projectId, new Set());
          }
          subscriptions.get(data.projectId).add(ws);
          ws.send(JSON.stringify({ type: 'subscribed', projectId: data.projectId }));
        } else if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      subscriptions.forEach((clientSet) => {
        clientSet.delete(ws);
      });
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('WebSocket server initialized on /ws');
  return wss;
}

function broadcastProgress(projectId, payload) {
  const message = JSON.stringify({
    type: 'pipeline_progress',
    projectId,
    timestamp: new Date().toISOString(),
    ...payload,
  });

  // Send to subscribed clients
  if (subscriptions.has(projectId)) {
    subscriptions.get(projectId).forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }

  // Also broadcast to global clients
  if (wss) {
    wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }
}

module.exports = { setupWebSocket, broadcastProgress };
