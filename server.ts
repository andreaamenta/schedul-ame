/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // In-memory store for sessions
  const sessions = new Map<string, any>();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-session', (sessionId) => {
      socket.join(sessionId);
      const sessionData = sessions.get(sessionId);
      if (sessionData) {
        socket.emit('session-update', sessionData);
      }
    });

    socket.on('update-session', ({ sessionId, data }) => {
      sessions.set(sessionId, data);
      socket.to(sessionId).emit('session-update', data);
    });

    socket.on('start-simulation', ({ sessionId, algorithm, processes, quantum }) => {
      // Server-side calculation trigger
      // In a real app, the server might run the algorithm and broadcast steps
      io.to(sessionId).emit('simulation-started', { algorithm, processes, quantum });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
