import { Router, Request, Response, RequestHandler } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, AuthenticatedRequest } from '../auth';
import type { UploadUrlRequestBody } from '@groundwave/types';

const router = Router();

const ALLOWED_MIME_TYPES = [
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
  'audio/aiff',
  'audio/x-aiff',
  'image/jpeg',
  'image/png',
  'image/webp'
];

const MAX_AUDIO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * @route POST /api/v1/media/upload-url
 * @desc Generates a presigned S3/R2 URL for direct client-to-storage upload
 * @access Private (Requires valid JWT)
 */
const generateUploadUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { filename, contentType, fileSize } = req.body as UploadUrlRequestBody;

    if (!filename || !contentType || !fileSize) {
      res.status(400).json({ error: 'Missing required fields: filename, contentType, fileSize' });
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      res.status(400).json({ error: 'Invalid file type. Only WAV, FLAC, AIFF, JPEG, PNG, and WebP are allowed.' });
      return;
    }

    const isImage = contentType.startsWith('image/');
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;

    if (fileSize > maxSize) {
      res.status(400).json({ error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB for this file type.` });
      return;
    }

    // Generate a unique object key using UUID to prevent collisions
    const fileExtension = filename.split('.').pop() || 'bin';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User authentication required' });
      return;
    }

    // Organize by type and user id
    const folder = isImage ? 'artworks' : 'masters';
    const userId = req.user.id;
    const objectKey = `${folder}/${userId}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'groundwave-media',
      Key: objectKey,
      ContentType: contentType,
      ContentLength: fileSize,
    });

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });

    // The presigned URL expires in 15 minutes
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    res.json({
      url: signedUrl,
      objectKey,
      expiresIn: 900,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};

router.post('/upload-url', requireAuth as RequestHandler, generateUploadUrl as RequestHandler);

router.post('/process', requireAuth as RequestHandler, async (req: Request, res: Response) => {
  try {
    const { objectKey, trackId } = req.body;
    
    if (!objectKey || !trackId) {
      res.status(400).json({ error: 'Missing objectKey or trackId' });
      return;
    }

    // In local development, we directly ping the media-worker on port 5001.
    // In production, we would use @google-cloud/tasks to enqueue this job.
    const workerUrl = process.env.WORKER_URL || 'http://localhost:5001/process';
    
    // We don't await this so the API responds instantly (simulating a queue)
    fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectKey, trackId })
    }).catch(err => {
      console.error('Failed to trigger local worker:', err);
    });

    res.status(202).json({ message: 'Media processing job enqueued' });
  } catch (error) {
    console.error('Error enqueueing job:', error);
    res.status(500).json({ error: 'Failed to enqueue media job' });
  }
});

export default router;
