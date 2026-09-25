import { NextResponse } from 'next/server';
import { DEMO_COOKIE_NAME, hashDemoPassword } from '@/lib/demo-auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const demoPassword = process.env.DEMO_PASSWORD;

    // If no demo password is required on the server, allow immediately
    if (!demoPassword) {
      return NextResponse.json({ success: true });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password !== demoPassword) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }

    const hashed = await hashDemoPassword(demoPassword);
    const response = NextResponse.json({ success: true });

    response.cookies.set(DEMO_COOKIE_NAME, hashed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
