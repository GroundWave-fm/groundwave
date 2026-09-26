import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DirectUploader } from './direct-uploader';

// Mock URL.createObjectURL for jsdom environment
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn((file: Blob) => `blob:http://localhost:3000/${(file as File).name || 'mock-file'}`);
}

describe('DirectUploader Component', () => {
  it('renders dropzone when no file is selected', () => {
    render(
      <DirectUploader
        type="image"
        file={null}
        previewUrl={null}
        onFileSelect={vi.fn()}
      />
    );

    expect(screen.getByText(/Drag & Drop your image file here/i)).toBeInTheDocument();
    expect(screen.getByText(/Select File/i)).toBeInTheDocument();
  });

  it('validates file type and calls onFileSelect when a valid image file is dropped/selected', () => {
    const onFileSelect = vi.fn();
    render(
      <DirectUploader
        type="image"
        file={null}
        previewUrl={null}
        onFileSelect={onFileSelect}
      />
    );

    const file = new File(['dummy image content'], 'cover.png', { type: 'image/png' });
    const input = screen.getByTestId ? screen.getByText(/Select File/i).previousElementSibling : screen.getByText(/Select File/i);
    
    // Select via file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onFileSelect).toHaveBeenCalledWith(file, expect.stringContaining('blob:'));
  });

  it('displays error message for invalid file type', () => {
    const onFileSelect = vi.fn();
    render(
      <DirectUploader
        type="image"
        file={null}
        previewUrl={null}
        onFileSelect={onFileSelect}
      />
    );

    const file = new File(['text content'], 'invalid.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText(/Please upload a valid image file/i)).toBeInTheDocument();
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('renders file details and remove button when file is selected', () => {
    const onFileSelect = vi.fn();
    const file = new File(['dummy content'], 'track.wav', { type: 'audio/wav' });

    render(
      <DirectUploader
        type="audio"
        file={file}
        previewUrl="blob:http://localhost:3000/track.wav"
        onFileSelect={onFileSelect}
      />
    );

    expect(screen.getByText('track.wav')).toBeInTheDocument();
    
    const removeBtn = screen.getByTitle('Remove file');
    fireEvent.click(removeBtn);

    expect(onFileSelect).toHaveBeenCalledWith(null, null);
  });
});
