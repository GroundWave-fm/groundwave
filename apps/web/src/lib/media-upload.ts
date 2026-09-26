/**
 * Media Upload Helper Service
 * Generates presigned URLs from API and uploads direct to S3/R2 storage via XHR
 */

export interface UploadResult {
  objectKey: string;
  publicUrl: string;
}

export async function uploadFileToStorage(
  file: File,
  token: string,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Resolve content type from file.type or extension fallback
  let contentType = file.type;
  if (!contentType || contentType === 'application/octet-stream') {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'wav') contentType = 'audio/wav';
    else if (ext === 'flac') contentType = 'audio/flac';
    else if (ext === 'aiff' || ext === 'aif') contentType = 'audio/aiff';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';
  }

  // 1. Get presigned upload URL from API
  const presignRes = await fetch(`${apiUrl}/api/v1/media/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: contentType || 'audio/wav',
      fileSize: file.size,
    }),
  });

  if (!presignRes.ok) {
    let errorMsg = 'Failed to get upload URL';
    try {
      const errorData = await presignRes.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      errorMsg = `Server returned ${presignRes.status}: ${presignRes.statusText}`;
    }
    throw new Error(errorMsg);
  }

  const { url, objectKey } = await presignRes.json();

  // 2. Perform direct S3/R2 PUT via XMLHttpRequest to track upload progress
  try {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', contentType || file.type);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network or CORS error occurred during presigned upload'));
      xhr.send(file);
    });

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_URL || 'https://pub-domain.r2.dev'}/${objectKey}`;
    return { objectKey, publicUrl };
  } catch (err) {
    console.warn('Presigned R2 PUT failed, falling back to direct API upload proxy:', err);

    // 3. Fallback: Upload directly through backend API proxy
    const directRes = await fetch(`${apiUrl}/api/v1/media/upload-direct`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-filename': file.name,
        'x-content-type': contentType || file.type,
      },
      body: file,
    });

    if (!directRes.ok) {
      let errorMsg = 'Failed direct media upload';
      try {
        const errorData = await directRes.json();
        errorMsg = errorData.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await directRes.json();
    return { objectKey: data.objectKey, publicUrl: data.publicUrl };
  }
}
