'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, Radio, Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function DemoGateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/feed';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/demo-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to requested protected destination or default feed
        router.push(returnUrl);
        router.refresh();
      } else {
        setErrorMessage(data.error || 'Invalid password. Please check with the GroundWave team.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage('Network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#0c0c0f] border border-[#1f1f26] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      {/* Glow Accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-4">
          <Shield size={13} />
          <span>Private Demo Preview</span>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <Radio size={24} className="text-sky-400" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">GroundWave</h1>
        </div>
        <p className="text-sm text-gray-400">
          Enter the demo access code to unlock the private alpha audio player and creator tools.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <span>•</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Password Gate Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="demo-password-input" className="block text-xs font-medium text-gray-300 mb-1.5">
            Demo Access Code
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
            <input
              id="demo-password-input"
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              placeholder="Enter access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#14141a] border border-[#272732] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors p-0.5 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !password}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-sky-500 text-black font-bold text-sm transition-all cursor-pointer shadow-lg shadow-sky-500/20"
        >
          {isSubmitting ? 'Verifying...' : 'Unlock Platform'}
          <ArrowRight size={16} />
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="mt-8 pt-6 border-t border-[#1a1a22] flex items-center justify-between text-xs text-gray-500">
        <Link 
          href="/" 
          className="flex items-center gap-1.5 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Public Overview</span>
        </Link>
        <span className="font-mono text-[11px]">v0.1.0-alpha</span>
      </div>
    </div>
  );
}

export default function DemoGatePage() {
  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-gray-500 text-sm">Loading security gate...</div>}>
        <DemoGateForm />
      </Suspense>
    </div>
  );
}
