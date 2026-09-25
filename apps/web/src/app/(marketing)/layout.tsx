import React from 'react';
import Link from 'next/link';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-sky-500 selection:text-black">
      <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            GroundWave<span className="text-sky-500">.</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/manifesto" className="text-sm text-gray-300 hover:text-white transition-colors">Manifesto</Link>
            <a href="#waitlist" className="text-sm font-medium text-black bg-white px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
              Join Waitlist
            </a>
          </nav>
        </div>
      </header>
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
