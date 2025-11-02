// Load environment variables from .env file
import "dotenv/config";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Seed database with sample Arabic texts in development
  if (app.get("env") === "development") {
    try {
      const { seedDatabase } = await import("./seedData");
      await seedDatabase();
    } catch (error) {
      console.log("Database seeding skipped (data may already exist)");
    }
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on the port specified in the environment variable PORT
<<<<<<< HEAD
  // Default to 5173 for development (Vite default), or use PORT env var
  const port = parseInt(process.env.PORT || '5173', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`Manār serving on port ${port}`);
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${port} is already in use!`);
      console.error(`\n💡 To fix this, you can:`);
      console.error(`   1. Find and kill the process using port ${port}:`);
      console.error(`      Windows: netstat -ano | findstr :${port}`);
      console.error(`      Then: taskkill /PID <PID> /F`);
      console.error(`   2. Or use a different port by setting PORT in .env`);
      console.error(`\n`);
      process.exit(1);
    } else {
      throw err;
    }
=======
  // Default to 5173 if not specified (Vite's default port)
  const port = parseInt(process.env.PORT || '5173', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
>>>>>>> 3093c1b3d20d30f708b6b8aa4c140654117a9680
  });
})();
