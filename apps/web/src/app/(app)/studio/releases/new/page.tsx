'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { DirectUploader } from '@/components/studio/direct-uploader';
import { uploadFileToStorage } from '@/lib/media-upload';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewReleasePage() {
  const { activeEntity, token, user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
  
  const [masterAudioFile, setMasterAudioFile] = useState<File | null>(null);
  const [masterAudioPreview, setMasterAudioPreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState<string>('');
  const [coverProgress, setCoverProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isCreatingEntity, setIsCreatingEntity] = useState(false);

  const handleCreateDefaultEntity = async () => {
    if (!token || !user) return;
    setIsCreatingEntity(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const slug = `${user.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}_solo_${Date.now().toString().slice(-4)}`;
      const res = await fetch(`${apiUrl}/api/v1/entities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug,
          name: user.displayName || user.username,
          entityType: 'solo_artist',
          bio: 'Artist profile on GroundWave',
          cityName: user.cityName || 'Chicago',
        }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert('Failed to create artist profile');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating entity');
    } finally {
      setIsCreatingEntity(false);
    }
  };

  if (!activeEntity) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Create an Artist or Label Profile</h2>
        <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
          To publish music on GroundWave, you need an active Creator Entity (Solo Artist, Band, or Label).
        </p>
        <button
          onClick={handleCreateDefaultEntity}
          disabled={isCreatingEntity}
          className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-black font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {isCreatingEntity ? 'Setting up profile...' : 'Create Artist Profile'}
        </button>
      </div>
    );
  }

  const handleSaveDraft = async () => {
    if (!title || !coverArtFile || !masterAudioFile || !token) return;

    setIsSubmitting(true);
    setStatusText('Uploading cover art to storage...');

    try {
      // 1. Upload Cover Art
      const { publicUrl: coverArtUrl } = await uploadFileToStorage(
        coverArtFile,
        token,
        setCoverProgress
      );

      setStatusText('Uploading master audio to storage...');
      // 2. Upload Master Audio
      const { objectKey: masterAudioKey } = await uploadFileToStorage(
        masterAudioFile,
        token,
        setAudioProgress
      );

      setStatusText('Saving release draft...');
      // 3. Save Release Draft in Backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          creator_entity_id: activeEntity.id,
          title,
          release_type: 'single', // MVP Single track upload
          cover_art_url: coverArtUrl,
          master_audio_key: masterAudioKey,
        }),
      });

      if (!res.ok) {
        let errorMsg = 'Failed to create release';
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      router.push('/studio');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving draft. Please try again.');
    } finally {
      setIsSubmitting(false);
      setStatusText('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/studio" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Release</h1>
            <p className="text-zinc-500 text-sm">Uploading as {activeEntity.name}</p>
          </div>
        </div>

        <button
          onClick={handleSaveDraft}
          disabled={!title || !coverArtFile || !masterAudioFile || isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? statusText || 'Processing...' : 'Save Draft'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Release Info Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Release Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Release Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Memories"
                disabled={isSubmitting}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Cover Art Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">1. Cover Art</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Upload high-resolution artwork (JPEG, PNG, or WebP). Minimum 3000x3000px recommended.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DirectUploader
              type="image"
              maxSizeMB={10}
              file={coverArtFile}
              previewUrl={coverArtPreview}
              onFileSelect={(f, p) => {
                setCoverArtFile(f);
                setCoverArtPreview(p);
              }}
              isUploading={isSubmitting}
              uploadProgress={coverProgress}
            />

            <div className="flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl aspect-square overflow-hidden relative">
              {coverArtPreview ? (
                <img src={coverArtPreview} alt="Cover Art Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <p className="text-zinc-600 text-sm">Artwork Preview</p>
                  <p className="text-zinc-700 text-xs mt-1">Select an image to view preview</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Master Audio Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">2. Master Audio</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Upload uncompressed 16-bit or 24-bit audio (WAV, FLAC, AIFF). Max 500MB per track.
          </p>

          <DirectUploader
            type="audio"
            maxSizeMB={500}
            file={masterAudioFile}
            previewUrl={masterAudioPreview}
            onFileSelect={(f, p) => {
              setMasterAudioFile(f);
              setMasterAudioPreview(p);
            }}
            isUploading={isSubmitting}
            uploadProgress={audioProgress}
          />
        </section>
      </div>
    </div>
  );
}
