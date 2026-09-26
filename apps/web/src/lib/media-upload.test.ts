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

  it('handles upload progress callback', async () => {
    const mockFile = new File(['dummy audio content'], 'test.wav', { type: '' });
    const mockToken = 'test-token-123';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          url: 'https://mock-s3-bucket.s3.amazonaws.com/masters/user-1/test.wav',
          objectKey: 'masters/user-1/test.wav',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const mockXhr = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(function (this: any) {
        if (this.upload.onprogress) {
          this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
        }
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

    expect(onProgress).toHaveBeenCalledWith(50);
    expect(result.objectKey).toBe('masters/user-1/test.wav');
  });

  it('falls back to direct API upload if presigned XHR fails', async () => {
    const mockFile = new File(['dummy audio content'], 'song.flac', { type: '' });
    const mockToken = 'test-token-123';

    // 1. Presign response
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            url: 'https://mock-s3-bucket.s3.amazonaws.com/masters/user-1/song.flac',
            objectKey: 'masters/user-1/song.flac',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      // 2. Direct upload fallback response
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            objectKey: 'masters/user-1/song.flac',
            publicUrl: 'https://cdn.example.com/masters/user-1/song.flac',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

    const mockXhr = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(function (this: any) {
        if (this.onerror) {
          this.onerror();
        }
      }),
      upload: {},
      status: 500,
      onload: null as any,
      onerror: null as any,
    };

    function MockXHR(this: any) {
      Object.assign(this, mockXhr);
    }

    vi.stubGlobal('XMLHttpRequest', MockXHR);

    const result = await uploadFileToStorage(mockFile, mockToken);

    expect(result.objectKey).toBe('masters/user-1/song.flac');
    expect(result.publicUrl).toBe('https://cdn.example.com/masters/user-1/song.flac');
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

