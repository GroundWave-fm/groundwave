'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { DirectUploader } from '@/components/studio/direct-uploader';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewReleasePage() {
  const { activeEntity, token } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [coverArtUrl, setCoverArtUrl] = useState<string | null>(null);
  const [masterAudioKey, setMasterAudioKey] = useState<string | null>(null);
  const [masterAudioUrl, setMasterAudioUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeEntity) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-zinc-500">You must select an active Creator Entity to upload a release.</p>
      </div>
    );
  }

  const handleSaveDraft = async () => {
    if (!title || !coverArtUrl || !masterAudioKey) return;
    
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          creator_entity_id: activeEntity.id,
          title,
          release_type: 'single', // Hardcoded for MVP single-track upload
          cover_art_url: coverArtUrl,
          master_audio_key: masterAudioKey
        })
      });

      if (!res.ok) throw new Error('Failed to create release');
      
      router.push('/studio'); // Redirect back to studio dashboard
    } catch (err) {
      console.error(err);
      alert('Error saving draft. Please try again.');
    } finally {
      setIsSubmitting(false);
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
          disabled={!title || !coverArtUrl || !masterAudioKey || isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Processing...' : 'Save Draft'}
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
              onUploadSuccess={(key, url) => setCoverArtUrl(url)} 
            />
            
            <div className="flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl aspect-square overflow-hidden">
              {coverArtUrl ? (
                <img src={coverArtUrl} alt="Cover Art Preview" className="w-full h-full object-cover" />
              ) : (
                <p className="text-zinc-600 text-sm">Artwork Preview</p>
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
            onUploadSuccess={(key, url) => {
              setMasterAudioKey(key);
              setMasterAudioUrl(url);
            }} 
          />
          
          {masterAudioUrl && (
            <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-md">
              <p className="text-sm text-green-400 mb-2 font-medium">✓ Master audio uploaded successfully</p>
              <audio controls className="w-full h-10" src={masterAudioUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
