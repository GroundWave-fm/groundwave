import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

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

// Root API discovery
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    platform: 'Groundwave (groundwave.fm)',
    version: 'v1',
    endpoints: {
      auth: '/api/v1/auth',
      releases: '/api/v1/releases',
      tracks: '/api/v1/tracks',
      hubs: '/api/v1/hubs',
      radio: '/api/v1/radio',
      storefront: '/api/v1/storefront',
      curators: '/api/v1/curators',
    },
  });
});

app.listen(PORT, () => {
  console.log(`📻 Groundwave API server running on http://localhost:${PORT}`);
});
