import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import connectDB from './config/db.js';
import app from './app.js';
import { initTerminalWs } from './services/terminalWs.js';

const PORT = process.env.PORT || 5000;

connectDB();

const httpServer = http.createServer(app);

// Attach terminal WebSocket (socket.io) to the same HTTP server
initTerminalWs(httpServer);

httpServer
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in .env`);
      process.exit(1);
    }
    throw err;
  });
