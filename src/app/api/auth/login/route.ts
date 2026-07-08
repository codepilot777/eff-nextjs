import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  isInstructorPasswordConfigured,
  verifyInstructorPassword,
} from '@/lib/auth';
import { loginBodySchema } from '@/lib/validation';

export async function POST(request: Request) {
  if (!isInstructorPasswordConfigured()) {
    console.error('INSTRUCTOR_PASSWORD is not set — instructor login is disabled');
    return NextResponse.json({ error: 'Server not configured for login' }, { status: 500 });
  }

  const parsed = loginBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing password' }, { status: 400 });
  }

  if (!verifyInstructorPassword(parsed.data.password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const { token, expiresAt } = createSessionToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  });
  return res;
}
