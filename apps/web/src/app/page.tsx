'use client';

import React from 'react';
import { Radio, MapPin, Disc, Shield, ShoppingBag, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', backgroundColor: '#1e1e24', color: '#60a5fa', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
          <Radio size={16} />
          groundwave.fm
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 16px 0', lineHeight: 1.15 }}>
          Local-First Music Discovery & Community
        </h1>
        <p style={{ fontSize: '18px', color: '#9ca3af', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
          GroundWave bridges digital listeners, independent artists, record labels, and live venues through geographic scene discovery and direct-to-creator commerce.
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '48px' }}>
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#141419', border: '1px solid #27272a' }}>
          <div style={{ color: '#38bdf8', marginBottom: '12px' }}><MapPin size={28} /></div>
          <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Hyperlocal Scene Radar</h3>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
            Filter by neighborhood, metro area, or touring corridors. Discover artists recording and performing near you.
          </p>
        </div>

        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#141419', border: '1px solid #27272a' }}>
          <div style={{ color: '#a855f7', marginBottom: '12px' }}><Disc size={28} /></div>
          <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Lossless & Scene Radios</h3>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
            Infinite algorithmic radios seeded by your favorite local acts, streaming with 24-bit lossless fidelity.
          </p>
        </div>

        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#141419', border: '1px solid #27272a' }}>
          <div style={{ color: '#22c55e', marginBottom: '12px' }}><ShoppingBag size={28} /></div>
          <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Direct Commerce & Clubs</h3>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
            92% direct payout on vinyl, cassettes, merch, and monthly Backstage Pass & Vinyl Club memberships.
          </p>
        </div>
      </section>

      <footer style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #1f1f23', color: '#6b7280', fontSize: '13px' }}>
        GroundWave &copy; 2026 &bull; Alpha Core Foundation &bull; groundwave.fm
      </footer>
    </main>
  );
}
