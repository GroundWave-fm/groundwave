import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'GroundWave — Local-First Music Discovery & Streaming',
  description: 'Lossless streaming, local scene radios, and direct artist & label storefronts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0c] text-gray-100 antialiased selection:bg-sky-500 selection:text-black">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
