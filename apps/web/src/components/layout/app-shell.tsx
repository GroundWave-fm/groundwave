'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { AuthModal } from '../auth/auth-modal';
import { GlobalAudioDock } from './global-audio-dock';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-100 flex flex-row">
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Application Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header with Search & Scene Selector */}
        <Header />

        {/* Dynamic Route Content (with bottom padding reserved for audio player dock) */}
        <main className="flex-1 overflow-y-auto pb-28">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <AuthModal />

      {/* Global Audio Dock */}
      <GlobalAudioDock />
    </div>
  );
}
