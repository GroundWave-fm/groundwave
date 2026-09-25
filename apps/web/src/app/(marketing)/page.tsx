'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PlayCircle, MapPin, Radio, BookOpen } from 'lucide-react';
import { WaitlistForm } from '@/components/marketing/waitlist-form';

export default function LandingPage() {
  const scrollToWaitlist = () => {
    const el = document.getElementById('waitlist');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const input = el.querySelector('input');
      if (input) input.focus();
    }
  };

  return (
    <div className="relative">
      {/* Combined Hero & Value Props (Single Frame View) */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden pt-24 pb-12">
        {/* Background gradient/glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 to-black z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 text-sm text-sky-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Early Access Waitlist
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
              End the Algorithm. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">Fund the Underground.</span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              GroundWave is the hyper-local streaming ecosystem designed to end the global algorithm. Discover the underground scenes in your backyard, and pay artists exactly for what you stream.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4">
              <WaitlistForm />
              <Link 
                href="/manifesto"
                className="inline-flex items-center gap-2 px-5 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all mt-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read the Manifesto</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Value Prop Grid */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 w-full">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="grid md:grid-cols-2 gap-12 lg:gap-16 max-w-5xl mx-auto"
          >
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
              className="flex flex-col items-center text-center p-8 rounded-3xl bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/5 shadow-2xl hover:bg-white/5 transition-colors"
            >
              <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mb-6 text-sky-400">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Hyper-Local Scenes</h3>
              <p className="text-gray-400 leading-relaxed">
                Lock into neighborhood H3 hexagonal grids to hear exactly what is trending outside your front door.
              </p>
            </motion.div>
            
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
              className="flex flex-col items-center text-center p-8 rounded-3xl bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/5 shadow-2xl hover:bg-white/5 transition-colors"
            >
              <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 text-pink-400">
                <Radio className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Scene Radar</h3>
              <p className="text-gray-400 leading-relaxed">
                Discover local live shows, underground events, and venue announcements broadcast directly to your map.
              </p>
            </motion.div>
            
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
              className="flex flex-col items-center text-center p-8 rounded-3xl bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/5 shadow-2xl hover:bg-white/5 transition-colors"
            >
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">User-Centric Payouts</h3>
              <p className="text-gray-400 leading-relaxed">
                Your subscription fee goes exclusively to the artists you actually listen to, not the global megastars.
              </p>
            </motion.div>

            <motion.div 
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
              className="flex flex-col items-center text-center p-8 rounded-3xl bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/5 shadow-2xl hover:bg-white/5 transition-colors"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Lossless Audio</h3>
              <p className="text-gray-400 leading-relaxed">
                Buy direct from the artist and own the master-quality FLAC files forever. No DRM, no compromises.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Founder Package Section (Pre-Alpha Mode) */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-sky-900/10 z-0" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-1 rounded-3xl bg-gradient-to-b from-sky-500/20 to-transparent"
          >
            <div className="bg-[#0a0a0c] rounded-[22px] p-8 md:p-12 border border-white/5 shadow-2xl">
              <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-400 font-bold text-sm tracking-wider uppercase mb-6">
                Limited Edition
              </div>
              <h2 className="text-4xl font-bold mb-4">The Founder Package</h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Join the revolution on the ground floor. We are launching a limited number of Founder Packages for early adopters who want to help us rebuild the music industry.
              </p>
              
              <div className="bg-white/5 rounded-2xl p-6 max-w-sm mx-auto mb-8 border border-white/10 text-left space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>1 Full Year Ad-Free</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Permanent "Founder" Profile Badge</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Early Access to Beta Features</span>
                </div>
              </div>

              <div className="text-5xl font-black mb-8">$49.99 <span className="text-xl text-gray-500 font-medium">one-time</span></div>
              
              <button 
                onClick={scrollToWaitlist}
                className="px-8 py-4 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white font-bold rounded-full border border-sky-500/30 transition-all cursor-pointer shadow-lg hover:shadow-sky-500/20"
              >
                Activating Soon — Join Waitlist
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
