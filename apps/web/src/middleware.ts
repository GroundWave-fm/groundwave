import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const demoPassword = process.env.DEMO_PASSWORD;

  // If no DEMO_PASSWORD is configured, bypass authentication entirely
  if (!demoPassword) {
    return NextResponse.next();
  }

  const demoUser = process.env.DEMO_USER || 'admin';
  const authHeader = req.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    try {
      const decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [username, ...passwordParts] = decoded.split(':');
      const password = passwordParts.join(':');

      if (username === demoUser && password === demoPassword) {
        return NextResponse.next();
      }
    } catch {
      // Malformed base64 payload falls through to 401 challenge
    }
  }

  return new NextResponse('Authentication required for GroundWave Demo.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="GroundWave Demo Environment"',
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (web app manifest)
     * - static image and media assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .mp3, .wav, .m3u8, .ts)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|m3u8|ts)$).*)',
  ],
};
