import React from 'react';
import { MarketingHeader } from '@/components/marketing/marketing-header';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-sky-500 selection:text-black">
      <MarketingHeader />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <footer className="py-12 border-t border-white/10 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} GroundWave. Built for the creators.</p>
        </div>
      </footer>
    </div>
  );
}
