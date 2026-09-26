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
  } catch (error: any) {
    console.error('Error creating release:', error);
    res.status(500).json({ error: error?.message || error?.detail || 'Failed to create release' });
  }
});

/**
 * @route GET /api/v1/releases
 * @desc Fetch published releases and transcoded sound recordings for feed & radio
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius_miles, limit = 20 } = req.query;

    /**
     * LOCALITY RECOMMENDATION ENGINE HOOK (Epic 6 Prep):
     * When lat/lng/radius_miles or h3_index are provided, filter creator entities:
     * e.g. WHERE ST_DWithin(ce.location, ST_MakePoint($lng, $lat)::geography, $radius_meters)
     * Or perform vector similarity lookup via pgvector on track audio embeddings.
     */

    const query = `
      SELECT 
        r.id AS release_id,
        r.title AS release_title,
        r.release_type,
        r.cover_art_url,
        r.created_at AS release_created_at,
        ce.id AS creator_entity_id,
        ce.name AS creator_name,
        ce.entity_type AS creator_type,
        ce.city_name AS creator_city,
        sr.id AS sound_recording_id,
        sr.title AS track_title,
        sr.duration_seconds,
        sr.hls_master_manifest_url,
        sr.lossless_flac_url
      FROM releases r
      JOIN creator_entities ce ON r.creator_entity_id = ce.id
      JOIN release_tracks rt ON r.id = rt.release_id
      JOIN sound_recordings sr ON rt.sound_recording_id = sr.id
      WHERE sr.hls_master_manifest_url IS NOT NULL 
      ORDER BY r.created_at DESC
      LIMIT $1;
    `;

    const result = await pool.query(query, [Number(limit) || 20]);
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

    const releases = result.rows.map(row => {
      let streamUrl = row.hls_master_manifest_url;
      if (streamUrl === 'processing' || streamUrl.includes('r2.cloudflarestorage.com') || streamUrl.startsWith('streams/') || streamUrl.includes('mux.dev') === false) {
        streamUrl = `${apiBaseUrl}/api/v1/media/stream/${row.sound_recording_id}/index.m3u8`;
      }

      return {
        id: row.release_id,
        title: row.release_title,
        releaseType: row.release_type,
        coverArtUrl: row.cover_art_url,
        createdAt: row.release_created_at,
        artist: {
          id: row.creator_entity_id,
          name: row.creator_name,
          type: row.creator_type,
          city: row.creator_city,
        },
        track: {
          id: row.sound_recording_id,
          title: row.track_title || row.release_title,
          durationSeconds: row.duration_seconds,
          hlsMasterManifestUrl: streamUrl,
          losslessFlacUrl: row.lossless_flac_url,
        }
      };
    });

    res.json({ releases });
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

export default router;
