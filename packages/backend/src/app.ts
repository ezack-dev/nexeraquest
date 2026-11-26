import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { authRouter } from './routes/authRoutes.js';
import { campaignRouter } from './routes/campaignRoutes.js';
import { taskRouter } from './routes/taskRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { prisma } from './prisma.js';

function resolveClientDistPath(): string | null {
  const candidates = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(process.cwd(), 'packages/client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
}

export function createApp() {
  const app = express();
  const allowedOrigins = [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    process.env.WEB_APP_URL,
    process.env.RENDER_EXTERNAL_URL,
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(null, true); // Same-origin & Telegram WebView origins vary by client platform
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.originalUrl.startsWith('/api') && process.env.NODE_ENV !== 'test') {
        console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Health check
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
    } catch (err: any) {
      res.status(500).json({ status: 'unhealthy', error: err.message });
    }
  });

  // Mount API routes
  app.use('/api/auth', authRouter);
  app.use('/api/campaigns', campaignRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/user', userRouter);
  app.use('/api/admin', adminRouter);

  // Serve built React frontend in single-service production deployments (e.g. Render)
  const clientDist = resolveClientDistPath();
  if (clientDist && process.env.NODE_ENV !== 'test') {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
