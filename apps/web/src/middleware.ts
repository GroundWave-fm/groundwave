import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEMO_COOKIE_NAME, hashDemoPassword } from '@/lib/demo-auth';

// Paths that are always public regardless of DEMO_PASSWORD
const PUBLIC_PATHS = [
  '/',
  '/manifesto',
  '/demo-gate',
  '/api',
];

export async function middleware(req: NextRequest) {
  const demoPassword = process.env.DEMO_PASSWORD;

  // If no DEMO_PASSWORD is configured, bypass the demo gate completely
  if (!demoPassword) {
    return NextResponse.next();
  }

  const { pathname, search } = req.nextUrl;

  // Check if current path is in public list or starts with a public route
  const isPublicRoute = PUBLIC_PATHS.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p)));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verify access cookie for protected app routes
  const accessCookie = req.cookies.get(DEMO_COOKIE_NAME)?.value;
  const expectedHash = await hashDemoPassword(demoPassword);

  if (accessCookie && accessCookie === expectedHash) {
    return NextResponse.next();
  }

  // Redirect unauthorized visitor to the dedicated single-input password gate
  const returnUrl = `${pathname}${search}`;
  const redirectUrl = new URL('/demo-gate', req.url);
  redirectUrl.searchParams.set('returnUrl', returnUrl);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static chunks)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - manifest.json (PWA manifest)
     * - static image and audio assets
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|m3u8|ts)$).*)',
  ],
};
