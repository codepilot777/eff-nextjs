import { describe, expect, it } from 'vitest';
import { buildFuelMacro, buildFullPayloadMacro, buildPayloadAndFuelSyncMacro } from './dynamicMacroBuilder';
import { CDU_NAV } from '@/data/pmdgCommands';
import type { PmdgPayloadOutput } from './payloadAdapter';

const samplePayload: PmdgPayloadOutput = {
  paxCabins: { fwd: 1000, mid: 2000, aft: 1500 },
  cargoHolds: { fwd: 500, aft: 300, bulk: 100 },
  totalPayloadKg: 5400,
};

describe('buildPayloadAndFuelSyncMacro', () => {
  it('is a pure concatenation of the existing nav + typing macros, in order', () => {
    const result = buildPayloadAndFuelSyncMacro(samplePayload, 42.4);
    const expected = [
      ...CDU_NAV.GOTO_PAYLOAD,
      ...buildFullPayloadMacro(samplePayload),
      ...CDU_NAV.GOTO_FUEL,
      ...buildFuelMacro(42.4),
    ];
    expect(result).toEqual(expected);
  });

  it('navigates to PAYLOAD before FUEL', () => {
    const result = buildPayloadAndFuelSyncMacro(samplePayload, 42.4);
    const payloadNavIndex = result.indexOf(CDU_NAV.GOTO_PAYLOAD[0]);
    const fuelNavIndex = result.lastIndexOf(CDU_NAV.GOTO_FUEL[0]);
    expect(payloadNavIndex).toBeGreaterThanOrEqual(0);
    expect(fuelNavIndex).toBeGreaterThan(payloadNavIndex);
  });

  it('produces no NaN/undefined entries for a zero-value payload', () => {
    const empty: PmdgPayloadOutput = {
      paxCabins: { fwd: 0, mid: 0, aft: 0 },
      cargoHolds: { fwd: 0, aft: 0, bulk: 0 },
      totalPayloadKg: 0,
    };
    const result = buildPayloadAndFuelSyncMacro(empty, 0);
    expect(result.every((n) => Number.isFinite(n))).toBe(true);
  });
});
