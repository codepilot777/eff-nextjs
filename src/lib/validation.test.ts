import { describe, expect, it } from 'vitest';
import {
  flightDeleteBodySchema,
  flightUpdateBodySchema,
  hasProtectedFlightFields,
  loginBodySchema,
  simbriefBodySchema,
  techlogPostBodySchema,
} from './validation';

describe('flightUpdateBodySchema', () => {
  it('accepts a valid id + partial patch', () => {
    const result = flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: { fuel_manual_mode: true } });
    expect(result.success).toBe(true);
  });

  it('rejects a missing id', () => {
    expect(flightUpdateBodySchema.safeParse({ data: { a: 1 } }).success).toBe(false);
  });

  it('rejects an empty id', () => {
    expect(flightUpdateBodySchema.safeParse({ id: '  ', data: { a: 1 } }).success).toBe(false);
  });

  it('rejects a non-object data payload (the old whole-blob-overwrite footgun)', () => {
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: 'not-an-object' }).success).toBe(false);
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: null }).success).toBe(false);
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: [1, 2, 3] }).success).toBe(false);
  });
});

describe('flightDeleteBodySchema', () => {
  it('requires a non-empty id', () => {
    expect(flightDeleteBodySchema.safeParse({ id: 'CPA 564' }).success).toBe(true);
    expect(flightDeleteBodySchema.safeParse({ id: '' }).success).toBe(false);
    expect(flightDeleteBodySchema.safeParse({}).success).toBe(false);
  });
});

describe('techlogPostBodySchema', () => {
  it('requires reg + object patch', () => {
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', data: { tl_prepared: true } }).success).toBe(true);
    expect(techlogPostBodySchema.safeParse({ reg: '', data: {} }).success).toBe(false);
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', data: 'nope' }).success).toBe(false);
  });
});

describe('simbriefBodySchema', () => {
  it('accepts alphanumeric usernames', () => {
    expect(simbriefBodySchema.safeParse({ username: 'EFFSIM' }).success).toBe(true);
    expect(simbriefBodySchema.safeParse({ username: 'eff.sim-01' }).success).toBe(true);
  });

  it('rejects usernames with characters that would break the SimBrief query string', () => {
    expect(simbriefBodySchema.safeParse({ username: 'eff&admin=1' }).success).toBe(false);
    expect(simbriefBodySchema.safeParse({ username: 'a b' }).success).toBe(false);
    expect(simbriefBodySchema.safeParse({ username: '' }).success).toBe(false);
  });
});

describe('loginBodySchema', () => {
  it('requires a non-empty password', () => {
    expect(loginBodySchema.safeParse({ password: 'x' }).success).toBe(true);
    expect(loginBodySchema.safeParse({ password: '' }).success).toBe(false);
    expect(loginBodySchema.safeParse({}).success).toBe(false);
  });
});

describe('hasProtectedFlightFields', () => {
  it('flags instructor-only fields and lets everything else through', () => {
    expect(hasProtectedFlightFields({ is_published: true })).toBe(true);
    expect(hasProtectedFlightFields({ activated_version: 2 })).toBe(true);
    expect(hasProtectedFlightFields({ fuel_manual_mode: true, trainee_input_zfw: 180 })).toBe(false);
    expect(hasProtectedFlightFields({})).toBe(false);
  });
});
