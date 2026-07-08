import { createHmac, timingSafeEqual } from 'crypto';

// 🌟 教官共用密碼登入：一個 env var 就搞掂，唔使起 user 表
// Session token 格式：`${expiresAtMs}.${hmacHex}`，用 HMAC 簽名防止偽造/竄改
export const SESSION_COOKIE_NAME = 'eff_instructor_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 小時

function getSecret(): string {
  const password = process.env.INSTRUCTOR_PASSWORD;
  if (!password) {
    throw new Error('INSTRUCTOR_PASSWORD is not configured');
  }
  // 🌟 用密碼本身派生簽名密鑰：改密碼即時令所有現存 session 失效，
  // 而且 token 內容唔會直接暴露返個密碼（HMAC 係單向）
  return createHmac('sha256', 'eff-nextjs-session-salt').update(password).digest('hex');
}

export function isInstructorPasswordConfigured(): boolean {
  return !!process.env.INSTRUCTOR_PASSWORD;
}

export function verifyInstructorPassword(candidate: string): boolean {
  const password = process.env.INSTRUCTOR_PASSWORD;
  if (!password || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createSessionToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const sig = createHmac('sha256', getSecret()).update(String(expiresAt)).digest('hex');
  return { token: `${expiresAt}.${sig}`, expiresAt };
}

// 🌟 純手動 parse `Cookie` header，避免 route handler 同 proxy 之間要用唔同 API
// (proxy 用 NextRequest.cookies，route handler 呢度直接讀 raw Request)
export function getCookieFromRequest(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

export function isInstructorAuthed(request: Request): boolean {
  return verifySessionToken(getCookieFromRequest(request, SESSION_COOKIE_NAME));
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expiresAtStr, sig] = token.split('.');
  if (!expiresAtStr || !sig) return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  let expectedSig: string;
  try {
    expectedSig = createHmac('sha256', getSecret()).update(expiresAtStr).digest('hex');
  } catch {
    return false;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
