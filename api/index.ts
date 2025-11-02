// Vercel serverless function entry point
// This file will be used by Vercel to handle all /api/* routes

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { registerRoutes } from '../server/routes';
import express from 'express';

// Create Express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes
let server: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!server) {
    server = await registerRoutes(app);
  }
  
  // Proxy the request to Express app
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}

