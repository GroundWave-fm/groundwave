'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Sparkles, Music, Users, Radio } from 'lucide-react';
import type { WaitlistUserType, WaitlistResponse } from '@groundwave/types';

interface WaitlistFormProps {
  defaultUserType?: WaitlistUserType;
  className?: string;
  source?: string;
}

const USER_TYPES: Array<{ id: WaitlistUserType; label: string; icon: React.ElementType }> = [
  { id: 'fan', label: 'Fan / Listener', icon: Users },
  { id: 'artist', label: 'Artist / Band', icon: Music },
  { id: 'label', label: 'Label / Venue', icon: Radio },
];

export function WaitlistForm({ defaultUserType = 'fan', className = '', source = 'marketing_landing' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<WaitlistUserType>(defaultUserType);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setFeedbackMessage('Please provide a valid email address.');
      return;
    }

    setStatus('loading');
    setFeedbackMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType, source }),
      });

      const data: WaitlistResponse & { error?: string } = await res.json();

      if (!res.ok) {
        setStatus('error');
        setFeedbackMessage(data.error || 'Failed to submit waitlist registration. Please try again.');
        return;
      }

      setStatus('success');
      setIsAlreadyRegistered(!!data.alreadyRegistered);
      setFeedbackMessage(
        data.message ||
          (data.alreadyRegistered
            ? "You're already on the waitlist! We'll reach out when GroundWave arrives in your city."
            : "Welcome to the GroundWave waitlist! Stay tuned for early access.")
      );
    } catch (err: any) {
      setStatus('error');
      setFeedbackMessage(err.message || 'Network error while connecting to GroundWave server.');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setEmail('');
    setFeedbackMessage('');
    setIsAlreadyRegistered(false);
  };

  return (
    <div className={`w-full max-w-lg mx-auto ${className}`} data-testid="waitlist-form-container">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success-box"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 rounded-3xl bg-sky-950/40 border border-sky-500/30 backdrop-blur-xl text-center shadow-2xl"
          >
            <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-3">
              {isAlreadyRegistered ? <Sparkles className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {isAlreadyRegistered ? 'Already on the List!' : 'You’re on the VIP Waitlist!'}
            </h3>
            <p className="text-sm text-sky-200/80 mb-6 leading-relaxed max-w-sm mx-auto">
              {feedbackMessage}
            </p>
            <button
              onClick={handleReset}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium underline underline-offset-4 transition-colors"
            >
              Register another email
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form-box"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center"
          >
            {/* User Type Selector Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-full mb-4">
              {USER_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = userType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setUserType(type.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Email Input & Submit Form */}
            <form id="waitlist" onSubmit={handleSubmit} className="flex w-full sm:w-auto max-w-md shadow-2xl">
              <input
                type="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                className="bg-white/10 border border-white/20 text-white placeholder-gray-400 px-6 py-3 rounded-l-full focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 w-full sm:w-72 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-r-full hover:bg-sky-400 transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Join Waitlist'
                )}
              </button>
            </form>

            {/* Error Feedback */}
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-rose-400 text-xs mt-3 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{feedbackMessage}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
