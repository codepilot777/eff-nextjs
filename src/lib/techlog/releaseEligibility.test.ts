import { describe, expect, it } from 'vitest';
import { openTlReleaseBlock, releaseAttemptBlocked } from './releaseEligibility';

describe('open TL release gate', () => {
  it('blocks release while any open TL entry exists, and names the count', () => {
    const one = openTlReleaseBlock([{ id: 'TL-1', status: 'OPEN' }]);
    expect(one).toEqual({
      openCount: 1,
      reason: 'Cannot release: 1 open TL entry. Defects must be cleared or deferred before the aircraft can be released.',
    });

    const two = openTlReleaseBlock([
      { id: 'TL-1', status: 'OPEN' },
      { id: 'P1', status: 'DEFERRED' },
      { id: 'TL-2', status: 'OPEN' },
      { id: 'C1', status: 'CLEARED' },
    ]);
    expect(two?.openCount).toBe(2);
    expect(two?.reason).toContain('2 open TL entries');
    expect(two?.reason).toMatch(/cleared or deferred/i);
  });

  it('allows release when there are no open TL entries', () => {
    expect(openTlReleaseBlock(undefined)).toBeNull();
    expect(openTlReleaseBlock([])).toBeNull();
    expect(openTlReleaseBlock([
      { id: 'P7319', status: 'DEFERRED' },
      { id: 'A1', status: 'CLEARED' },
    ])).toBeNull();
  });

  it('rejects a release attempt against the merged defect list, and ignores non-release writes', () => {
    const open = { defects: [{ id: 'TL-1', status: 'OPEN' }] };
    expect(releaseAttemptBlocked(open, { data: { tl_release: true, crs_id: 'CRS-1-X' } })?.openCount).toBe(1);
    expect(releaseAttemptBlocked(open, { data: { tl_release: false } })).toBeNull();
    expect(releaseAttemptBlocked(open, { data: { tl_checks: true } })).toBeNull();
    expect(releaseAttemptBlocked(open, {})).toBeNull();

    const cleared = { defects: [{ id: 'TL-1', status: 'CLEARED' }] };
    expect(releaseAttemptBlocked(cleared, { data: { tl_release: true } })).toBeNull();
  });
});
