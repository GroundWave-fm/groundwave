'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, FileImage, X } from 'lucide-react';

export interface DirectUploaderProps {
  type: 'audio' | 'image';
  file: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File | null, previewUrl: string | null) => void;
  maxSizeMB?: number;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function DirectUploader({
  type,
  file,
  previewUrl,
  onFileSelect,
  maxSizeMB = 500,
  isUploading = false,
  uploadProgress = 0,
}: DirectUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const validateAndSelectFile = (selectedFile: File) => {
    setError(null);
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    if (isAudio && !selectedFile.type.startsWith('audio/')) {
      setError('Please upload a valid audio file (WAV, FLAC, AIFF).');
      return;
    }

    if (!isAudio && !selectedFile.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    // Generate local blob preview URL immediately for instant feedback
    const generatedPreviewUrl = URL.createObjectURL(selectedFile);
    onFileSelect(selectedFile, generatedPreviewUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null, null);
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col items-center justify-center w-full ${
          isAudio ? 'h-48' : 'h-64'
        } border-2 border-dashed rounded-xl transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800/50'
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
          <div className="flex flex-col items-center w-full px-6 py-4 relative">
            {!isUploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <Icon className="w-10 h-10 text-indigo-400 mb-2" />
            <p className="text-sm font-medium text-white text-center break-all">{file.name}</p>
            <p className="text-xs text-zinc-500 mt-1 mb-3">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>

            {/* Audio Local Instant Preview Player */}
            {isAudio && previewUrl && !isUploading && (
              <div className="w-full mt-2">
                <audio controls className="w-full h-10 rounded-md" src={previewUrl}>
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="w-full mt-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Uploading to storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center pointer-events-none p-6 text-center">
            <UploadCloud className="w-10 h-10 text-zinc-500 mb-3" />
            <p className="text-sm font-medium text-white mb-1">
              Drag & Drop your {isAudio ? 'audio' : 'image'} file here
            </p>
            <p className="text-xs text-zinc-500 mb-4">
              {isAudio ? 'WAV, FLAC, or AIFF' : 'JPEG, PNG, or WebP'}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white text-black font-medium text-sm rounded-md hover:bg-zinc-200 transition-colors pointer-events-auto"
            >
              Select File
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
