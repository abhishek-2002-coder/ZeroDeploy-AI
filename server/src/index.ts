import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import deployRouter from './routes/deploy.js';
import githubRouter from './routes/github.js';
import { DeployerService } from './services/deployer.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

const PORT = Number(process.env.PORT) || 4010;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-github-event'],
}));
app.use(express.json());

// Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/deploy', deployRouter);
app.use('/api/github', githubRouter);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('deploy:start', async ({ projectId }) => {
    console.log(`Socket Event: deploy:start for project ${projectId}`);
    const deploymentPath = path.join(process.cwd(), 'deployments', projectId);
    try {
      await DeployerService.deploy(deploymentPath, socket);
    } catch (err) {
      console.error('Deployment error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Basic Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ZeroDeploy AI Backend is running' });
});

const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
