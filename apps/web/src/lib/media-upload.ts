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

  // 1. Get presigned upload URL from API
  const presignRes = await fetch(`${apiUrl}/api/v1/media/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
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
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type);

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

    xhr.onerror = () => reject(new Error('Network error occurred during upload'));
    xhr.send(file);
  });

  const publicUrl = `${process.env.NEXT_PUBLIC_R2_URL || 'https://pub-domain.r2.dev'}/${objectKey}`;
  return { objectKey, publicUrl };
}
