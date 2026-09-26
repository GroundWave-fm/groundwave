'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { MapPin, Radio, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const KNOWN_CITIES = [
  'Chicago', 'Austin', 'Nashville', 'Bristol', 'London', 'Berlin', 'Detroit', 'Minneapolis'
];

export default function OnboardingPage() {
  const router = useRouter();
  const { token, setSceneLocation, user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [cityName, setCityName] = useState('Chicago');
  const [radiusMiles, setRadiusMiles] = useState(15);
  const [role, setRole] = useState<'listener' | 'creator'>('listener');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user somehow ended up here but has already completed onboarding
  if (user?.onboardingCompleted) {
    router.push('/feed');
    return null;
  }

  const handleComplete = async () => {
    if (!token) return;
    setIsSubmitting(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/auth/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cityName, radiusMiles }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local context
        setSceneLocation(data.user.cityName, data.user.h3IndexRes8, data.user.sceneRadiusMiles, true);
        
        // Push to local scene feed
        router.push('/feed');
      } else {
        console.error('Failed to complete onboarding');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-[#0c0c0f] border border-[#1f1f26] rounded-2xl p-8"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-2 w-16 rounded-full transition-colors ${step >= s ? 'bg-sky-500' : 'bg-gray-800'}`} 
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-500">Step {step} of 3</span>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <MapPin className="text-sky-400" /> Choose Your Scene
              </h1>
              <p className="text-gray-400">
                GroundWave is hyper-local. Select the city scene you want to tune into.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {KNOWN_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => setCityName(city)}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    cityName === city 
                      ? 'border-sky-500 bg-sky-500/10 text-white' 
                      : 'border-[#1f1f26] bg-[#101015] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="font-semibold block">{city}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setStep(2)}
              className="mt-8 w-full py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Radio className="text-pink-400" /> Set Your Radius
              </h1>
              <p className="text-gray-400">
                How far out do you want your Scene Radio and Radar to reach?
              </p>
            </div>

            <div className="py-8 px-4">
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="1"
                value={radiusMiles} 
                onChange={(e) => setRadiusMiles(parseInt(e.target.value))}
                className="w-full accent-pink-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs font-semibold text-gray-500 mt-4 uppercase tracking-wider">
                <span className={radiusMiles <= 10 ? 'text-pink-400' : ''}>Neighborhood (5m)</span>
                <span className={radiusMiles > 10 && radiusMiles <= 25 ? 'text-pink-400' : ''}>Metro (15m)</span>
                <span className={radiusMiles > 25 ? 'text-pink-400' : ''}>Regional (50m)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-[#272732] text-white font-semibold hover:bg-white/5 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="text-emerald-400" /> How will you use GroundWave?
              </h1>
              <p className="text-gray-400">
                You can always change this later, but it helps us tailor your experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setRole('listener')}
                className={`p-6 rounded-xl border text-left transition-all cursor-pointer relative ${
                  role === 'listener' 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-[#1f1f26] bg-[#101015] hover:border-gray-600'
                }`}
              >
                {role === 'listener' && <CheckCircle size={20} className="absolute top-4 right-4 text-emerald-500" />}
                <h3 className="text-xl font-bold text-white mb-2">Listener</h3>
                <p className="text-sm text-gray-400">I'm here to discover new local music, tune into my Scene Radio, and find underground shows.</p>
              </button>

              <button
                onClick={() => setRole('creator')}
                className={`p-6 rounded-xl border text-left transition-all cursor-pointer relative ${
                  role === 'creator' 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-[#1f1f26] bg-[#101015] hover:border-gray-600'
                }`}
              >
                {role === 'creator' && <CheckCircle size={20} className="absolute top-4 right-4 text-emerald-500" />}
                <h3 className="text-xl font-bold text-white mb-2">Creator</h3>
                <p className="text-sm text-gray-400">I'm an artist, band, label, or venue looking to release music, sell merch, and build a community.</p>
              </button>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl border border-[#272732] text-white font-semibold hover:bg-white/5 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Finalizing...' : 'Complete Setup'} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
