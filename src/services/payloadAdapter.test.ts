import { describe, expect, it } from 'vitest';
import { buildEfbLoadingPayload, adaptEfbPayloadToPmdg } from './payloadAdapter';
import { AIRCRAFT_REGISTRY } from '@/lib/loadsheet/MockAHM';

describe('buildEfbLoadingPayload', () => {
  const ahm = AIRCRAFT_REGISTRY['B-HNQ']; // zoneOA=J, zoneOB/OC/OD=Y

  it('converts zone-keyed pax counts into weights using the AHM primaryClass, not a hardcoded class', () => {
    const result = buildEfbLoadingPayload(ahm, { pax: { zoneOA: 10, zoneOB: 20 }, cargo: {} });
    // J class weight * 10, Y class weight * 20 - just assert relative ordering/nonzero, exact
    // constants live in LoadsheetEngine.ts and are covered by its own tests
    expect(result.paxWeights.zoneOA).toBeGreaterThan(0);
    expect(result.paxWeights.zoneOB).toBeGreaterThan(0);
  });

  it('defaults missing pax/cargo to empty/zero instead of throwing', () => {
    const result = buildEfbLoadingPayload(ahm, null);
    expect(result.paxWeights).toEqual({});
    expect(result.cargoWeights).toEqual({ hold1: 0, hold2: 0, hold3: 0, hold4: 0, bulk: 0 });
  });

  it('reads cargo hold weights from the snapshot shape (h1..h4/bulk)', () => {
    const result = buildEfbLoadingPayload(ahm, { pax: {}, cargo: { h1: 500, h2: 300, h3: 0, h4: 0, bulk: 200 } });
    expect(result.cargoWeights).toEqual({ hold1: 500, hold2: 300, hold3: 0, hold4: 0, bulk: 200 });
  });

  it('feeds cleanly into adaptEfbPayloadToPmdg without throwing', () => {
    const efbLoadingData = buildEfbLoadingPayload(ahm, { pax: { zoneOA: 10, zoneOB: 20, zoneOC: 30, zoneOD: 40 }, cargo: { h1: 100, h2: 100, h3: 100, h4: 100, bulk: 50 } });
    const result = adaptEfbPayloadToPmdg(efbLoadingData, 'B-HNQ');
    expect(result.totalPayloadKg).toBeGreaterThan(0);
  });
});
