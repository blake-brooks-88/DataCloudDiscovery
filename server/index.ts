import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
  }
}
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown;

  const originalResJson = res.json;
  res.json = function (this: Response, body?: unknown) {
    capturedJsonResponse = body;
    return originalResJson.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = `${logLine.slice(0, 79)}…`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use(
    (
      err: Error | { status?: number; statusCode?: number; message?: string },
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      const status = 'status' in err ? err.status : 'statusCode' in err ? err.statusCode : 500;
      const message = err.message || 'Internal Server Error';

      res.status(status || 500).json({ message });
      if (status === 500) {
        console.error('Unhandled server error:', err);
      }
    }
  );

  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env['PORT'] || '5000', 10);
  server.listen(
    {
      port,
      host: 'localhost',
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
