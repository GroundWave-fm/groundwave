import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the monorepo root MUST happen before routes are imported
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import authRoutes from './routes/auth';
import entityRoutes from './routes/entities';
import stripeRoutes from './routes/stripe';
import waitlistRoutes from './routes/waitlist';
import mediaRoutes from './routes/media';
import releasesRoutes from './routes/releases';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health Check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'online',
      service: 'groundwave-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/entities', entityRoutes);
  app.use('/api/v1/stripe', stripeRoutes);
  app.use('/api/v1/waitlist', waitlistRoutes);
  app.use('/api/v1/media', mediaRoutes);
  app.use('/api/v1/releases', releasesRoutes);

  // Root API discovery
  app.get('/api/v1', (req: Request, res: Response) => {
    res.json({
      platform: 'GroundWave (groundwave.fm)',
      version: 'v1',
      endpoints: {
        auth: '/api/v1/auth',
        entities: '/api/v1/entities',
        waitlist: '/api/v1/waitlist',
        media: '/api/v1/media',
        releases: '/api/v1/releases',
        tracks: '/api/v1/tracks',
        hubs: '/api/v1/hubs',
        radio: '/api/v1/radio',
        storefront: '/api/v1/storefront',
        curators: '/api/v1/curators',
      },
    });
  });

  return app;
}

export const app = createApp();
