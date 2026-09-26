import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { processMediaJob } from './transcoder';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export function createWorkerApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post('/process', async (req, res) => {
    const { objectKey, trackId } = req.body;

    if (!objectKey || !trackId) {
      return res.status(400).json({ error: 'Missing objectKey or trackId' });
    }

    // Acknowledge immediately to Cloud Tasks
    res.status(202).json({ message: 'Job accepted' });

    try {
      console.log(`[Job Started] Processing trackId: ${trackId}`);
      await processMediaJob(objectKey, trackId);
      console.log(`[Job Completed] Processing trackId: ${trackId}`);
    } catch (error) {
      console.error(`[Job Failed] trackId: ${trackId}`, error);
    }
  });

  return app;
}

export const app = createWorkerApp();

const PORT = process.env.WORKER_PORT || 5001;

/* v8 ignore start */
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🎧 GroundWave Media Worker listening on http://localhost:${PORT}`);
  });
}
/* v8 ignore stop */
