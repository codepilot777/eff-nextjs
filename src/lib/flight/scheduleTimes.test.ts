import { describe, expect, it } from 'vitest';
import { resolveBlockTimeSeconds, computeStaUnix } from './scheduleTimes';

describe('resolveBlockTimeSeconds', () => {
  it('prefers sched_block when present', () => {
    expect(resolveBlockTimeSeconds({ sched_block: 18900, est_block: 20027 }, 18347)).toBe(18900);
  });

  it('falls back to est_block when sched_block is missing', () => {
    expect(resolveBlockTimeSeconds({ est_block: 20027 }, 18347)).toBe(20027);
  });

  it('falls back to eetSeconds + 2400 when neither is present (regression: the old +40min estimate)', () => {
    expect(resolveBlockTimeSeconds({}, 18347)).toBe(18347 + 2400);
  });

  it('returns 0 when nothing is available at all', () => {
    expect(resolveBlockTimeSeconds({}, 0)).toBe(0);
  });

  it('accepts string values (SimBrief sometimes returns numbers as strings)', () => {
    expect(resolveBlockTimeSeconds({ sched_block: '18900' }, 0)).toBe(18900);
  });
});

describe('computeStaUnix', () => {
  it('adds block time to STD, matching the real SimBrief sample (STD 1769414400 + block 18900 = STA 1769433300)', () => {
    expect(computeStaUnix(1769414400, 18900)).toBe(1769433300);
  });

  it('returns 0 when STD is missing', () => {
    expect(computeStaUnix(0, 18900)).toBe(0);
  });

  it('returns 0 when block time is missing', () => {
    expect(computeStaUnix(1769414400, 0)).toBe(0);
  });
});
