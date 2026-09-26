'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, FileImage, X, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface DirectUploaderProps {
  type: 'audio' | 'image';
  onUploadSuccess: (objectKey: string, url: string) => void;
  maxSizeMB?: number;
}

export function DirectUploader({ type, onUploadSuccess, maxSizeMB = 500 }: DirectUploaderProps) {
  const { token } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAudio = type === 'audio';
  const Icon = isAudio ? FileAudio : FileImage;
  const acceptTypes = isAudio ? '.wav,.flac,.aiff' : '.jpg,.jpeg,.png,.webp';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (selectedFile: File) => {
    setError(null);
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }
    
    if (isAudio && !selectedFile.type.startsWith('audio/')) {
      setError('Please upload a valid audio file (WAV, FLAC, AIFF).');
      return false;
    }
    
    if (!isAudio && !selectedFile.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WebP).');
      return false;
    }
    
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !token) return;
    
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. Get Presigned URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const presignRes = await fetch(`${apiUrl}/api/v1/media/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size
        })
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

      // 2. Upload file directly to S3/R2 via XMLHttpRequest (to track progress)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url, true);
        xhr.setRequestHeader('Content-Type', file.type);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('Upload failed with status ' + xhr.status));
          }
        };

        xhr.onerror = () => reject(new Error('Network error occurred during upload'));
        xhr.send(file);
      });

      setSuccess(true);
      // Optional: Generate public R2 URL (assumes NEXT_PUBLIC_R2_URL exists, or we just pass the key back)
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_URL || 'https://pub-domain.r2.dev'}/${objectKey}`;
      onUploadSuccess(objectKey, publicUrl);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setSuccess(false);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-green-500/30 bg-green-500/10 rounded-xl">
        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-white">Upload Complete</h3>
        <p className="text-sm text-zinc-400 mt-1">{file?.name}</p>
        <button 
          onClick={reset}
          className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm transition-colors"
        >
          Upload Another
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors ${
          isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept={acceptTypes}
          className="hidden" 
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        
        {file ? (
          <div className="flex flex-col items-center w-full px-8">
            <Icon className="w-12 h-12 text-indigo-400 mb-4" />
            <p className="text-sm font-medium text-white text-center break-all">{file.name}</p>
            <p className="text-xs text-zinc-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            
            {!isUploading && (
              <button 
                onClick={reset}
                className="absolute top-4 right-4 p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {isUploading && (
              <div className="w-full mt-6">
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center pointer-events-none">
            <UploadCloud className="w-10 h-10 text-zinc-500 mb-4" />
            <p className="text-sm font-medium text-white mb-1">
              Drag & Drop your {isAudio ? 'audio' : 'image'} file here
            </p>
            <p className="text-xs text-zinc-500 mb-6">
              or click to browse from your computer
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white text-black font-medium text-sm rounded-md hover:bg-zinc-200 transition-colors pointer-events-auto"
            >
              Select File
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {file && !isUploading && (
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleUpload}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md transition-colors"
          >
            Start Upload
          </button>
        </div>
      )}
    </div>
  );
}
