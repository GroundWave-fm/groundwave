import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createDatabasePool } from '@groundwave/database';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

const pool = createDatabasePool();

export async function processMediaJob(objectKey: string, trackId: string) {
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });

  const bucketName = process.env.R2_BUCKET_NAME || 'groundwave-media';
  const jobId = uuidv4();
  const workDir = path.join(os.tmpdir(), `groundwave-transcode-${jobId}`);
  fs.mkdirSync(workDir, { recursive: true });

  const inputFilePath = path.join(workDir, 'master.wav');
  const hlsDir = path.join(workDir, 'hls');
  fs.mkdirSync(hlsDir, { recursive: true });

  try {
    console.log(`[${jobId}] Downloading ${objectKey} from R2...`);
    const { Body } = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    }));

    if (Body instanceof Readable) {
      const writeStream = fs.createWriteStream(inputFilePath);
      Body.pipe(writeStream);
      await new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(true));
        writeStream.on('error', reject);
      });
    } else {
      throw new Error('S3 GetObject response body is not a Readable stream');
    }

    console.log(`[${jobId}] Transcoding to HLS (320k AAC)...`);
    // Output playlist path
    const playlistPath = path.join(hlsDir, 'index.m3u8');
    
    await new Promise((resolve, reject) => {
      if (!ffmpegPath) return reject(new Error('ffmpeg-static path not found'));

      const ffmpeg = spawn(ffmpegPath, [
        '-i', inputFilePath,
        '-c:a', 'aac',
        '-b:a', '320k',
        '-f', 'hls',
        '-hls_time', '10',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', path.join(hlsDir, 'segment_%03d.ts'),
        playlistPath
      ]);

      ffmpeg.stderr.on('data', (data) => {
        // FFmpeg writes progress to stderr
        // console.log(`[${jobId}] ffmpeg: ${data.toString().trim()}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) resolve(true);
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });

    console.log(`[${jobId}] Transcoding complete. Uploading segments to R2...`);
    const files = fs.readdirSync(hlsDir);
    
    const hlsPrefix = `streams/${trackId}`;
    
    for (const file of files) {
      const filePath = path.join(hlsDir, file);
      const fileContent = fs.readFileSync(filePath);
      const contentType = file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T';
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: `${hlsPrefix}/${file}`,
        Body: fileContent,
        ContentType: contentType,
      }));
    }

    const hlsUrl = `https://groundwave-media.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${hlsPrefix}/index.m3u8`;
    
    console.log(`[${jobId}] Updating database record for sound_recording ${trackId}...`);
    await pool.query(
      `UPDATE sound_recordings SET 
        hls_master_manifest_url = $1
       WHERE id = $2`,
      [hlsUrl, trackId]
    );

    console.log(`[${jobId}] Pipeline complete successfully.`);

  } finally {
    console.log(`[${jobId}] Cleaning up temporary directory...`);
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}
