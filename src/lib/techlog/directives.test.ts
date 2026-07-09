import { describe, expect, it } from 'vitest';
import { applyTechLogDirectives } from './directives';

describe('applyTechLogDirectives', () => {
  it('merges flat data fields like the old spread behavior', () => {
    const current = { tl_prepared: false, tl_cmdr: 'CHAN T M' };
    const merged = applyTechLogDirectives(current, { data: { tl_prepared: true } });
    expect(merged).toEqual({ tl_prepared: true, tl_cmdr: 'CHAN T M' });
  });

  it('defectUpdate patches only the matching defect and leaves others untouched', () => {
    const current = {
      defects: [
        { id: 'A1', status: 'OPEN' },
        { id: 'A2', status: 'OPEN' },
      ],
    };
    const merged = applyTechLogDirectives(current, {
      defectUpdate: { id: 'A1', changes: { status: 'CLEARED' } },
    });
    expect(merged.defects).toEqual([
      { id: 'A1', status: 'CLEARED' },
      { id: 'A2', status: 'OPEN' },
    ]);
  });

  it('defectAppend adds a new defect without dropping existing ones', () => {
    const current = { defects: [{ id: 'A1', status: 'OPEN' }] };
    const merged = applyTechLogDirectives(current, { defectAppend: { id: 'A2', status: 'OPEN' } });
    expect(merged.defects).toEqual([
      { id: 'A1', status: 'OPEN' },
      { id: 'A2', status: 'OPEN' },
    ]);
  });

  it('tlEntryAppend appends against the current row, not a stale copy', () => {
    const current = { tl_entries: [{ id: 'ENT-1' }] };
    const merged = applyTechLogDirectives(current, { tlEntryAppend: { id: 'ENT-2' } });
    expect(merged.tl_entries).toEqual([{ id: 'ENT-1' }, { id: 'ENT-2' }]);
  });

  it('tlEntriesReset clears the log', () => {
    const current = { tl_entries: [{ id: 'ENT-1' }, { id: 'ENT-2' }] };
    const merged = applyTechLogDirectives(current, { tlEntriesReset: true });
    expect(merged.tl_entries).toEqual([]);
  });

  it('flightsPrepend adds the new sector to the front of the history', () => {
    const current = { flights: [{ id: 'SEC-1' }] };
    const merged = applyTechLogDirectives(current, { flightsPrepend: { id: 'SEC-2' } });
    expect(merged.flights).toEqual([{ id: 'SEC-2' }, { id: 'SEC-1' }]);
  });

  it('signOffDefects sets tl_defects to true', () => {
    const current = { tl_defects: false };
    const merged = applyTechLogDirectives(current, { signOffDefects: true });
    expect(merged.tl_defects).toBe(true);
  });

  it('combines tlEntriesReset + flightsPrepend + data resets, matching finalizeSector', () => {
    const current = {
      tl_entries: [{ id: 'ENT-1' }],
      flights: [{ id: 'SEC-1' }],
      tl_release: true,
    };
    const merged = applyTechLogDirectives(current, {
      flightsPrepend: { id: 'SEC-2' },
      tlEntriesReset: true,
      data: { tl_release: false },
    });
    expect(merged.tl_entries).toEqual([]);
    expect(merged.flights).toEqual([{ id: 'SEC-2' }, { id: 'SEC-1' }]);
    expect(merged.tl_release).toBe(false);
  });

  it('defectAppend after a defectUpdate in the same patch builds on the updated list, not the stale one', () => {
    const current = { defects: [{ id: 'A1', status: 'OPEN' }] };
    const merged = applyTechLogDirectives(current, {
      defectUpdate: { id: 'A1', changes: { status: 'CLEARED' } },
      defectAppend: { id: 'A2', status: 'OPEN' },
    });
    expect(merged.defects).toEqual([
      { id: 'A1', status: 'CLEARED' },
      { id: 'A2', status: 'OPEN' },
    ]);
  });
});
