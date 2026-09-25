'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Hexagon, Users, DollarSign, Activity, ShoppingCart, Radio } from 'lucide-react';

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Hero Header */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-sky-900/20 blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
          >
            The GroundWave <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Manifesto</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto"
          >
            For too long, the audio streaming ecosystem has been broken. We are tearing down the old model and building a hyper-local, creator-first ecosystem designed to empower artists at every tier.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 space-y-32 relative z-10">
        
        {/* Section 1: User-Centric */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4 text-sky-400 mb-6">
            <Users className="w-8 h-8" />
            <h2 className="text-3xl font-bold text-white">The User-Centric Payout Model</h2>
          </div>
          <p className="text-lg text-gray-300 leading-relaxed">
            Legacy DSPs utilize "pro-rata" payout pools that funnel subscription money away from the local, independent artists you actually listen to, and directly into the pockets of the world's biggest pop stars.
          </p>
          <p className="text-lg text-gray-300 leading-relaxed">
            GroundWave operates on a <strong className="text-white">User-Centric Distribution Model</strong>. This means your subscription fee goes exactly to the artists you stream. If you pay a monthly subscription and you only listen to three local bands in your city, 100% of the creator pool from your subscription goes to those three bands.
          </p>
          
          {/* Payout Model Visualizer */}
          <div className="mt-8 p-8 rounded-3xl bg-[#0a0a0c] border border-white/10 flex flex-col md:flex-row gap-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-[80px]" />
            
            <div className="flex-1 space-y-6 relative z-10">
              <div>
                <h4 className="text-red-400 font-bold tracking-wider text-xs uppercase mb-1">Legacy DSP (Pro-Rata)</h4>
                <p className="text-sm text-gray-400 leading-relaxed">Your $10 subscription is dumped into a massive global pool and divided by total global streams.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400 text-sm">👤</div>
                  <div className="flex-1 h-px bg-gradient-to-r from-red-500/50 to-transparent" />
                  <div className="text-sm font-bold text-gray-300">$10</div>
                </div>
                <div className="pl-5 border-l-2 border-white/5 space-y-5 py-3 ml-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Global Pop Stars (You didn't listen to)</span>
                      <span className="text-red-400 font-bold">$9.95</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: '95%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-red-500/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Your Local Band (You listened to 100%)</span>
                      <span className="text-gray-500 font-bold">$0.05</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: '5%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-gray-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:block w-px bg-white/10" />

            <div className="flex-1 space-y-6 relative z-10">
              <div>
                <h4 className="text-sky-400 font-bold tracking-wider text-xs uppercase mb-1">GroundWave (User-Centric)</h4>
                <p className="text-sm text-gray-400 leading-relaxed">Your money goes exactly where your ears go. You directly fund the artists you actually stream.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-400 text-sm">👤</div>
                  <div className="flex-1 h-px bg-gradient-to-r from-sky-500/50 to-transparent" />
                  <div className="text-sm font-bold text-gray-300">$10</div>
                </div>
                <div className="pl-5 border-l-2 border-white/5 space-y-5 py-3 ml-5">
                   <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Global Pop Stars (You didn't listen to)</span>
                      <span className="text-gray-500 font-bold">$0.00</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full w-0 bg-sky-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Your Local Band (You listened to 100%)</span>
                      <span className="text-sky-400 font-bold">$7.00</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: '70%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-sky-500 relative">
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </motion.div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2">* Remaining $3.00 covers essential platform infrastructure</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 2: Hyper-Local */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4 text-purple-400 mb-6">
            <Hexagon className="w-8 h-8" />
            <h2 className="text-3xl font-bold text-white">The End of the Global Algorithm</h2>
          </div>
          <p className="text-lg text-gray-300 leading-relaxed">
            Legacy platforms use black-box algorithms designed to homogenize music, pushing everyone toward the same viral global hits. We take the exact opposite approach.
          </p>
          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            We utilize the <strong className="text-white">H3 Hexagonal Mapping System</strong> to divide the globe into distinct, neighborhood-sized "Scenes." Listeners lock into their local Scene to engage with a multi-layered local ecosystem:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-3 text-sky-400">
                <Activity className="w-6 h-6" />
                <h3 className="text-xl font-bold text-white">Scene Radio</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                An infinite stream of tracks originating from your exact neighborhood or city, powered by acoustic similarity and geospatial proximity.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-3 text-pink-400">
                <Radio className="w-6 h-6" />
                <h3 className="text-xl font-bold text-white">Scene Radar</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                A live broadcast feed surfacing local underground shows, DIY venue events, and direct announcements from artists right around the corner.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section 3: Creator Splits */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4 text-emerald-400 mb-6">
            <DollarSign className="w-8 h-8" />
            <h2 className="text-3xl font-bold text-white">Unprecedented Creator Splits</h2>
          </div>
          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            We aren't just changing how the money is distributed; we are changing how much of it goes to the creators. We operate a lean infrastructure so we can pass the lion's share of the revenue back to the artists.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
              <h3 className="text-4xl font-black text-emerald-400">70%</h3>
              <p className="text-sm font-medium text-white">Streaming Payouts</p>
              <p className="text-xs text-gray-400">Of net subscription revenue</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
              <h3 className="text-4xl font-black text-emerald-400">50%</h3>
              <p className="text-sm font-medium text-white">Ad-Revenue Sharing</p>
              <p className="text-xs text-gray-400">From the free tier</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
              <h3 className="text-4xl font-black text-emerald-400">90%</h3>
              <p className="text-sm font-medium text-white">Direct Purchases</p>
              <p className="text-xs text-gray-400">Tracks, Merch, & Subscriptions</p>
            </div>
          </div>
        </motion.section>

        {/* Section 4: Merch & Box Office */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4 text-pink-400 mb-6">
            <ShoppingCart className="w-8 h-8" />
            <h2 className="text-3xl font-bold text-white">The Merch Table & Local Box Office</h2>
          </div>
          <p className="text-lg text-gray-300 leading-relaxed">
            Streaming is only one piece of the puzzle. To truly empower artists, we give them the tools to run their entire business directly on the platform.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white">The Merch Table</h3>
              <p className="text-gray-400 leading-relaxed">
                Every creator profile features a built-in storefront. Sell digital master-quality downloads, physical media (vinyl, cassettes), apparel, and digital supporter benefits like exclusive profile badges.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white">The Box Office</h3>
              <p className="text-gray-400 leading-relaxed">
                We integrate live shows directly into the H3 map. Local events are surfaced to listeners right in their Scene radar, allowing bands and venues to sell tickets directly through the platform with minimal overhead fees.
              </p>
            </div>
          </div>
        </motion.section>

        
        {/* Section 4.5: Community Management */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4 text-indigo-400 mb-6">
            <Users className="w-8 h-8" />
            <h2 className="text-3xl font-bold text-white">Community & Moderation</h2>
          </div>
          <p className="text-lg text-gray-300 leading-relaxed">
            Community management is another core pillar of GroundWave. We enable artists to turn casual listeners into rabid fans who are incentivized to participate directly in their local community.
          </p>
          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            Through dedicated Artist Sanctums, creators can cultivate an intimate, hyper-engaged following. But community building must be safe—so we provide artists with powerful moderation controls to preserve their brand identity, filter toxicity, and maintain the exact culture they want their community to reflect.
          </p>
        </motion.section>

        {/* Section 5: Ecosystem */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8 pb-12 border-b border-white/10"
        >
          <div className="flex items-center gap-4 text-orange-400 mb-6">
            <Activity className="w-8 h-8" />
            <h2 className="text-3xl font-bold text-white">An Ecosystem for Every Fan</h2>
          </div>
          <p className="text-lg text-gray-300 leading-relaxed">
            Whether you are a casual listener wanting to explore your city's underground scene, or a super-fan wanting to directly fund your favorite band's next tour, GroundWave is built for you.
          </p>
          <ul className="space-y-4 text-gray-300">
            <li className="flex gap-3"><span className="text-sky-500 font-bold">•</span> <strong>The Founder Package:</strong> Join early for $49.99 to get a year ad-free and a permanent Founder badge.</li>
            <li className="flex gap-3"><span className="text-sky-500 font-bold">•</span> <strong>Direct-to-Artist Fan Clubs:</strong> Subscribe directly to your favorite creator to unlock exclusive tracks.</li>
            <li className="flex gap-3"><span className="text-sky-500 font-bold">•</span> <strong>Lossless Audio:</strong> Buy direct from the artist and own the master-quality FLAC files forever.</li>
          </ul>
        </motion.section>

      </main>
    </div>
  );
}
