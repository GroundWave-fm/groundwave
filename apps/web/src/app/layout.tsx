import type { Metadata } from 'next';
import React from 'react';

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
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#0a0a0c', color: '#f3f4f6' }}>
        {children}
      </body>
    </html>
  );
}
