import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import { registerSocketHandlers } from './socket/handlers.js';

const PORT = process.env.PORT || 4000;
const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

const io = new Server(httpServer, {
  cors: { origin: true },
  transports: ['websocket', 'polling'],
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Guess the Imposter server running on http://localhost:${PORT}`);
});
