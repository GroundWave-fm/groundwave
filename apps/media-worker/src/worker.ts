import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { processMediaJob } from './transcoder';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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

  // Run in background (in true serverless, you'd await this and configure longer timeouts,
  // but for Express/Cloud Run, background execution after response is fine).
  try {
    console.log(`[Job Started] Processing trackId: ${trackId}`);
    await processMediaJob(objectKey, trackId);
    console.log(`[Job Completed] Processing trackId: ${trackId}`);
  } catch (error) {
    console.error(`[Job Failed] trackId: ${trackId}`, error);
  }
});

const PORT = process.env.WORKER_PORT || 5001;

app.listen(PORT, () => {
  console.log(`🎧 GroundWave Media Worker (Serverless Endpoint) listening on http://localhost:${PORT}`);
});
