import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

// 🌟 呢個 Next.js 版本將 middleware 改名做 Proxy (功能一樣)
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (pathname.startsWith('/instructor') && !isAuthed) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && isAuthed) {
    return NextResponse.redirect(new URL('/instructor', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/instructor', '/instructor/:path*', '/login'],
};
