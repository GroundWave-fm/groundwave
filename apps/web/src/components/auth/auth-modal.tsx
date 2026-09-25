'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { X, Radio, Mail, User as UserIcon, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    login,
    register,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [cityName, setCityName] = useState('Chicago');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const res = await login(email);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to log in');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const res = await register({
      email,
      username,
      displayName,
      cityName,
    });
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create account');
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    const res = await login(demoEmail);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Demo login failed');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#141419] border border-[#27272f] shadow-2xl p-6 md:p-8 text-gray-100">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#202028] transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Brand Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Radio size={18} />
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-xl font-bold tracking-tight text-white">
              {authModalTab === 'login' ? 'Sign In to GroundWave' : 'Create GroundWave Account'}
            </h2>
            <p className="text-xs text-gray-400">Local-first music discovery & creator hubs</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-lg bg-[#0e0e12] p-1 mb-6 border border-[#222228]">
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              openAuthModal('login');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              authModalTab === 'login'
                ? 'bg-[#272732] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              openAuthModal('register');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              authModalTab === 'register'
                ? 'bg-[#272732] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <span>•</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {authModalTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="artist@groundwave.fm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#0c0c0f] border border-[#272732] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-sky-500 text-black font-semibold text-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In with Email'}
              <ArrowRight size={16} />
            </button>

            {/* Quick Demo Accounts */}
            <div className="pt-4 border-t border-[#222228]">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Quick Demo Sign-In
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('maya@groundwave.fm')}
                  className="p-2 rounded-lg bg-[#1a1a22] hover:bg-[#23232e] border border-[#2b2b38] text-left text-xs transition-colors cursor-pointer"
                >
                  <p className="font-semibold text-white">Maya Lin</p>
                  <p className="text-[11px] text-gray-400">The Static Veins (Artist)</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('marcus@midwestpressings.com')}
                  className="p-2 rounded-lg bg-[#1a1a22] hover:bg-[#23232e] border border-[#2b2b38] text-left text-xs transition-colors cursor-pointer"
                >
                  <p className="font-semibold text-white">Marcus Cole</p>
                  <p className="text-[11px] text-gray-400">Midwest Pressings (Label)</p>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Register Form */}
        {authModalTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="fan@groundwave.fm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0c0c0f] border border-[#272732] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="reg-username" className="block text-xs font-medium text-gray-300 mb-1">
                  Handle (@username)
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    id="reg-username"
                    type="text"
                    required
                    placeholder="audiophile_fan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0c0c0f] border border-[#272732] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-display" className="block text-xs font-medium text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  id="reg-display"
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0c0f] border border-[#272732] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-city" className="block text-xs font-medium text-gray-300 mb-1">
                Home Scene City
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-gray-500" />
                <select
                  id="reg-city"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0c0c0f] border border-[#272732] text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Chicago">Chicago, IL (Midwest)</option>
                  <option value="Austin">Austin, TX (Southwest)</option>
                  <option value="Nashville">Nashville, TN (Southeast)</option>
                  <option value="Bristol">Bristol, UK (UK Bass/Dub)</option>
                  <option value="London">London, UK (UK Scene)</option>
                  <option value="Berlin">Berlin, DE (Electronic)</option>
                  <option value="Detroit">Detroit, MI (Midwest Techno)</option>
                  <option value="Minneapolis">Minneapolis, MN (Midwest)</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#101015] border border-[#1f1f26] text-[11px] text-gray-400 flex items-start gap-2">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Your location is hashed to an obfuscated Uber H3 Res 8 hexagonal cell (~1km) for local scene radio.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email || !username || !displayName}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-sky-500 text-black font-semibold text-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
