import { describe, expect, it } from 'vitest';
import { PMDG_FAILURES, getFailureByPmdgId } from './pmdgCommands';

describe('PMDG_FAILURES (unified failure registry)', () => {
  it('has exactly 2 hand-authored entries plus 18 derived from the MEL map', () => {
    expect(PMDG_FAILURES.length).toBe(20);
  });

  it('has no duplicate ids', () => {
    const ids = PMDG_FAILURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the hand-authored macros untouched', () => {
    const eng1 = PMDG_FAILURES.find((f) => f.id === 'eng1_sev_dmg');
    const hyd = PMDG_FAILURES.find((f) => f.id === 'hyd_sys_l_leak');
    expect(eng1?.macroSequence).toEqual([69982, 69970, 69961, 69960, 69960]);
    expect(hyd?.macroSequence).toEqual([69982, 69970, 69961, 69961, 69960]);
  });

  it('gives every MEL-derived entry melRefs but no dispatch method (no macro authored yet)', () => {
    const derived = PMDG_FAILURES.filter((f) => f.id !== 'eng1_sev_dmg' && f.id !== 'hyd_sys_l_leak');
    expect(derived.length).toBe(18);
    for (const f of derived) {
      expect(f.melRefs && f.melRefs.length).toBeGreaterThanOrEqual(1);
      expect(f.macroSequence).toBeUndefined();
      expect(f.eventId).toBeUndefined();
    }
  });

  it('derives categories from the real ATA chapter of the mapped MEL codes', () => {
    expect(getFailureByPmdgId('APU_CORE_FAIL')?.category).toBe('APU');
    expect(getFailureByPmdgId('HYD_PUMP_ENG_1_FAIL')?.category).toBe('HYDRAULIC');
    expect(getFailureByPmdgId('ASCPC_SOFTWARE_CRASH')?.category).toBe('AIR');
    expect(getFailureByPmdgId('APU_GEN_REJECT')?.category).toBe('ELECTRICAL');
    expect(getFailureByPmdgId('FUEL_PUMP_L_FWD_FAIL')?.category).toBe('FUEL');
    expect(getFailureByPmdgId('EEC_L_ALTERNATOR_FAIL')?.category).toBe('ENGINE');
  });

  it('returns undefined for an unmapped pmdgId', () => {
    expect(getFailureByPmdgId('NONEXISTENT')).toBeUndefined();
  });
});
