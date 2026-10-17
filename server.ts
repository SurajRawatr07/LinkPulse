import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Database & Seed
import { connectDB, getDbStatus } from './server/src/config/db.ts';
import { seedMongoDatabase } from './server/src/seed/mongoSeed.ts';

// Middlewares
import { requestIdMiddleware } from './server/src/middleware/requestId.ts';

// Routes
import { authRoutes } from './server/src/routes/authRoutes.ts';
import { linksRoutes } from './server/src/routes/linksRoutes.ts';
import { redirectRoutes } from './server/src/routes/redirectRoutes.ts';
import { analyticsRoutes } from './server/src/routes/analyticsRoutes.ts';
import { campaignsRoutes } from './server/src/routes/campaignsRoutes.ts';
import { foldersTagsRoutes } from './server/src/routes/foldersTagsRoutes.ts';
import { adminRoutes } from './server/src/routes/adminRoutes.ts';
import { importsRoutes } from './server/src/routes/importsRoutes.ts';
import { policyLabRoutes } from './server/src/routes/policyLabRoutes.ts';
import { trustCenterRoutes } from './server/src/routes/trustCenterRoutes.ts';
import { lifecycleRoutes } from './server/src/routes/lifecycleRoutes.ts';
import { experimentsRoutes } from './server/src/routes/experimentsRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Establish persistent MongoDB connection and seed
  try {
    await connectDB();
    await seedMongoDatabase();
  } catch (err: any) {
    console.error('Fatal database startup failure:', err);
    process.exit(1);
  }

  // 2. Base middlewares
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestIdMiddleware);

  // 3. Operational Reliability Endpoints
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'LinkPulse Core Platform',
      stack: 'MERN (MongoDB + Express + React + Node)',
      database: getDbStatus(),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ready', (_req: Request, res: Response) => {
    const dbStatus = getDbStatus();
    if (dbStatus.status === 'healthy') {
      return res.json({ ready: true, database: dbStatus });
    }
    return res.status(503).json({ ready: false, database: dbStatus });
  });

  // 4. API Endpoints
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/links', linksRoutes);
  app.use('/api/v1/campaigns', campaignsRoutes);
  app.use('/api/v1', foldersTagsRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/imports', importsRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // Signature Feature Endpoints
  app.use('/api/v1/policy-lab', policyLabRoutes);
  app.use('/api/v1/trust-center', trustCenterRoutes);
  app.use('/api/v1/lifecycle', lifecycleRoutes);
  app.use('/api/v1/experiments', experimentsRoutes);

  // 5. Public Redirect Engine (/r/:code & verify-password)
  app.use(redirectRoutes);

  // 6. Centralized Error Handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[Unhandled Error] [${(req as any).requestId || 'no-id'}]`, err);
    return res.status(err.status || 500).json({
      error: err.message || 'An unexpected internal error occurred.',
      requestId: (req as any).requestId,
    });
  });

  // 7. Vite Dev Server / Static Production Serving
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LinkPulse MERN Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
