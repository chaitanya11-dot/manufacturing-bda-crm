import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Log incoming server triggers
  app.use((req, res, next) => {
    console.log(`[CRM SERVER] ${req.method} ${req.url}`);
    next();
  });

  // Serve static assets from public folder if present
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Mount CRM complete Rest API Router
  app.use('/api', apiRouter);

  // Return server status indicator
  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Manufacturing CRM REST API online.' });
  });

  // Mount Vite development middleware compiler, or serve production dist bundle files
  if (process.env.NODE_ENV !== 'production') {
    console.log('[CRM SERVER] Mounting Vite development live middleware compiler...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[CRM SERVER] Launching in stand-alone custom static production server...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================================`);
    console.log(`🚀 MANUFACTURING CRM COMPLETED FULL-STACK ALIVE ON PORT ${PORT}`);
    console.log(`🔗 Interface Local Preview: http://localhost:${PORT}`);
    console.log(`==================================================================`);
  });
}

startServer();
