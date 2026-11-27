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
import { TelegramBotService } from './services/telegramBot.js';

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

  // Health checks (supports GET & HEAD for Render and external uptime monitors)
  const handleHealthCheck = async (req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const startedAt = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const dbLatencyMs = Date.now() - startedAt;
      if (req.method === 'HEAD') {
        res.status(200).end();
        return;
      }
      res.json({
        status: 'ok',
        service: 'nexeraquest',
        database: 'connected',
        dbLatencyMs,
        uptimeSeconds: Math.floor(process.uptime()),
        uptime: process.uptime(),
        telegramBot: TelegramBotService.isLive() ? 'live' : 'mock',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (req.method === 'HEAD') {
        res.status(503).end();
        return;
      }
      res.status(503).json({
        status: 'unhealthy',
        service: 'nexeraquest',
        database: 'disconnected',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  for (const healthPath of ['/health', '/healthz', '/api/health']) {
    app.get(healthPath, handleHealthCheck);
    app.head(healthPath, handleHealthCheck);
  }

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
      if (req.path.startsWith('/api') || req.path === '/health' || req.path === '/healthz') {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
