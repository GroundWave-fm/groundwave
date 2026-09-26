import { Router, Request, Response, RequestHandler } from 'express';
import { requireAuth } from '../auth';
import { createDatabasePool } from '@groundwave/database';

const router = Router();
const pool = createDatabasePool();

router.post('/', requireAuth as RequestHandler, async (req: Request, res: Response) => {
  try {
    const { 
      creator_entity_id, 
      title, 
      release_type, 
      cover_art_url, 
      master_audio_key // The R2 key from the uploader
    } = req.body;

    if (!creator_entity_id || !title || !release_type || !cover_art_url || !master_audio_key) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Insert Release
      const releaseResult = await client.query(
        `INSERT INTO releases (creator_entity_id, title, release_type, cover_art_url) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [creator_entity_id, title, release_type, cover_art_url]
      );
      const releaseId = releaseResult.rows[0].id;

      // 2. Insert Sound Recording (with 'processing' state)
      const trackResult = await client.query(
        `INSERT INTO sound_recordings (title, duration_seconds, hls_master_manifest_url) 
         VALUES ($1, $2, $3) RETURNING id`,
        [title, 0, 'processing']
      );
      const soundRecordingId = trackResult.rows[0].id;

      // 3. Map Sound Recording to Release
      await client.query(
        `INSERT INTO release_tracks (release_id, sound_recording_id, track_number) 
         VALUES ($1, $2, 1)`,
        [releaseId, soundRecordingId]
      );

      // 4. Map primary artist contributor
      await client.query(
        `INSERT INTO sound_recording_contributors (sound_recording_id, creator_entity_id, role) 
         VALUES ($1, $2, 'primary_artist')`,
        [soundRecordingId, creator_entity_id]
      );

      await client.query('COMMIT');

      // 5. Trigger Media Worker directly (in dev) or via Cloud Tasks
      const workerUrl = process.env.WORKER_URL || 'http://localhost:5001/process';
      fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectKey: master_audio_key, trackId: soundRecordingId }) // Note: media-worker still calls it trackId in the payload
      }).catch(err => {
        console.error('Failed to trigger local worker:', err);
      });

      res.status(201).json({ 
        releaseId, 
        trackId: soundRecordingId, // Keep response contract same for web
        message: 'Release created and processing job enqueued' 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating release:', error);
    res.status(500).json({ error: 'Failed to create release' });
  }
});

export default router;
