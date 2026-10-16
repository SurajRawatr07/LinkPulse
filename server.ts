import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './server/routes/auth.ts';
import { linksRouter } from './server/routes/links.ts';
import { redirectRouter } from './server/routes/redirect.ts';
import { campaignsRouter } from './server/routes/campaigns.ts';
import { foldersTagsRouter } from './server/routes/foldersTags.ts';
import { analyticsRouter } from './server/routes/analytics.ts';
import { importsRouter } from './server/routes/imports.ts';
import { adminRouter, reportsRouter } from './server/routes/admin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'LinkPulse API',
      database: 'Cloud SQL PostgreSQL',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/links', linksRouter);
  app.use('/api/v1/campaigns', campaignsRouter);
  app.use('/api/v1', foldersTagsRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/imports', importsRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/reports', reportsRouter);

  // Mount Public Redirect Engine (/r/:code & verify-password)
  app.use(redirectRouter);

  // Vite Dev Server / Static Production Serving
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
    console.log(`🚀 LinkPulse Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
