import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = process.env.INSTRUCTOR_PASSWORD;

describe('auth', () => {
  beforeEach(() => {
    process.env.INSTRUCTOR_PASSWORD = 'correct-horse-battery-staple';
    vi.resetModules();
  });

  afterEach(() => {
    process.env.INSTRUCTOR_PASSWORD = ORIGINAL_ENV;
    vi.useRealTimers();
  });

  it('accepts the correct password and rejects a wrong one', async () => {
    const { verifyInstructorPassword } = await import('./auth');
    expect(verifyInstructorPassword('correct-horse-battery-staple')).toBe(true);
    expect(verifyInstructorPassword('wrong-password')).toBe(false);
    expect(verifyInstructorPassword('')).toBe(false);
  });

  it('creates a session token that verifies successfully', async () => {
    const { createSessionToken, verifySessionToken } = await import('./auth');
    const { token } = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it('rejects a tampered token', async () => {
    const { createSessionToken, verifySessionToken } = await import('./auth');
    const { token } = createSessionToken();
    const [expiresAt] = token.split('.');
    const tampered = `${expiresAt}.deadbeef`;
    expect(verifySessionToken(tampered)).toBe(false);
  });

  it('rejects a token signed with a different password (e.g. after password rotation)', async () => {
    const { createSessionToken } = await import('./auth');
    const { token } = createSessionToken();

    process.env.INSTRUCTOR_PASSWORD = 'a-different-password';
    vi.resetModules();
    const { verifySessionToken } = await import('./auth');
    expect(verifySessionToken(token)).toBe(false);
  });

  it('rejects an expired token', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const { createSessionToken, verifySessionToken } = await import('./auth');
    const { token } = createSessionToken();

    vi.setSystemTime(new Date('2026-01-02T00:00:00Z')); // well past the 12h TTL
    expect(verifySessionToken(token)).toBe(false);
  });

  it('rejects missing/malformed tokens', async () => {
    const { verifySessionToken } = await import('./auth');
    expect(verifySessionToken(undefined)).toBe(false);
    expect(verifySessionToken(null)).toBe(false);
    expect(verifySessionToken('')).toBe(false);
    expect(verifySessionToken('not-a-valid-token')).toBe(false);
  });

  it('reads and verifies the session cookie from a raw Request', async () => {
    const { createSessionToken, isInstructorAuthed, SESSION_COOKIE_NAME } = await import('./auth');
    const { token } = createSessionToken();

    const authed = new Request('http://localhost/api/flight/delete', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; other=1` },
    });
    expect(isInstructorAuthed(authed)).toBe(true);

    const anonymous = new Request('http://localhost/api/flight/delete');
    expect(isInstructorAuthed(anonymous)).toBe(false);
  });
});
