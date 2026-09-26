import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFileToStorage } from './media-upload';

describe('media-upload utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requests presigned URL and uploads file via XHR', async () => {
    const mockFile = new File(['dummy audio content'], 'test.wav', { type: 'audio/wav' });
    const mockToken = 'test-token-123';

    // 1. Mock fetch for presign URL endpoint
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          url: 'https://mock-s3-bucket.s3.amazonaws.com/masters/user-1/test.wav',
          objectKey: 'masters/user-1/test.wav',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    // 2. Mock XMLHttpRequest Constructor Function
    const mockXhr = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(function (this: any) {
        if (this.onload) {
          this.status = 200;
          this.onload();
        }
      }),
      upload: {
        onprogress: null as any,
      },
      status: 200,
      onload: null as any,
      onerror: null as any,
    };

    function MockXHR(this: any) {
      Object.assign(this, mockXhr);
    }

    vi.stubGlobal('XMLHttpRequest', MockXHR);

    const onProgress = vi.fn();
    const result = await uploadFileToStorage(mockFile, mockToken, onProgress);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/media/upload-url'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({
          filename: 'test.wav',
          contentType: 'audio/wav',
          fileSize: mockFile.size,
        }),
      })
    );

    expect(mockXhr.open).toHaveBeenCalledWith(
      'PUT',
      'https://mock-s3-bucket.s3.amazonaws.com/masters/user-1/test.wav',
      true
    );
    expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'audio/wav');
    expect(mockXhr.send).toHaveBeenCalledWith(mockFile);
    expect(result.objectKey).toBe('masters/user-1/test.wav');
  });

  it('throws an error if presigned URL endpoint fails', async () => {
    const mockFile = new File(['dummy'], 'test.wav', { type: 'audio/wav' });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Storage quota exceeded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(uploadFileToStorage(mockFile, 'token')).rejects.toThrow('Storage quota exceeded');
  });
});
