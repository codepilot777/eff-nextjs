import { describe, expect, it } from 'vitest';
import { buildEnginePayload, generateLSText, getEffectiveWeightLimits } from './loadsheetHelpers';
import { LoadsheetEngine } from './LoadsheetEngine';
import { AIRCRAFT_REGISTRY } from './MockAHM';

const flightData = {
  aircraft_reg: 'B-HNQ',
  flight_no: 'CPA 564',
  dispatcher: 'SYSTEM',
  crew_fd: 2,
  crew_cc: 14,
  water_fraction: 15,
};

const snapshot = {
  pax: { OA: 10, OB: 20, OC: 30, OD: 40 },
  cargo: { h1: 0, h2: 0, h3: 0, h4: 0, bulk: 0 },
  fuel: { left: 10000, center: 0, right: 10000 },
};

describe('buildEnginePayload', () => {
  it('uses the explicit tripFuelKg argument instead of always falling back to flightData.fuel_trip_ofp', () => {
    const dataWithStaleOfpTrip = { ...flightData, fuel_trip_ofp: 18.5 };
    const payload = buildEnginePayload(snapshot, dataWithStaleOfpTrip, 200, 25000);
    // regression: previously this always returned 18.5*1000=18500 regardless of what the
    // caller actually wanted (e.g. fuelCalculator.ts's revised trip fuel after a ZFW/altn/
    // manual-fuel/Desired-Fuel revision), silently feeding a stale trip fuel into LAW
    expect(payload!.fuel.trip).toBe(25000);
    expect(payload!.fuel.trip).not.toBe(18500);
  });

  it('still computes takeoff fuel from the snapshot tanks minus the given taxi fuel', () => {
    const payload = buildEnginePayload(snapshot, flightData, 200, 25000);
    expect(payload!.fuel.takeoff).toBe(10000 + 0 + 10000 - 200);
  });
});

describe('getEffectiveWeightLimits', () => {
  const ahm = AIRCRAFT_REGISTRY['B-HNQ'];

  it('returns the AHM system limits when is_custom_weight is off, even if custom_* fields are set', () => {
    const limits = getEffectiveWeightLimits(ahm, {
      is_custom_weight: false,
      custom_mzfw: 150, custom_mtow: 180, custom_mlaw: 160,
    });
    expect(limits.isCustomWt).toBe(false);
    expect(limits.MZFW).toBe(ahm.limits.MZFW);
    expect(limits.MTOW).toBe(ahm.limits.MTOW);
    expect(limits.MLAW).toBe(ahm.limits.MLAW);
  });

  it('returns the custom limits (in KG) when is_custom_weight is on', () => {
    const limits = getEffectiveWeightLimits(ahm, {
      is_custom_weight: true,
      custom_mzfw: 150, custom_mtow: 180, custom_mlaw: 160, custom_mlaw_margin: 5,
    });
    expect(limits.isCustomWt).toBe(true);
    expect(limits.MZFW).toBe(150000);
    expect(limits.MTOW).toBe(180000);
    expect(limits.MLAW).toBe((160 - 5) * 1000); // margin subtracted, same as ModalLoadsheet's effectiveMlaw
  });

  it('falls back to the system limit for any custom_* field left unset while custom mode is on', () => {
    const limits = getEffectiveWeightLimits(ahm, { is_custom_weight: true });
    expect(limits.MZFW).toBe(ahm.limits.MZFW);
    expect(limits.MTOW).toBe(ahm.limits.MTOW);
    expect(limits.MLAW).toBe(ahm.limits.MLAW);
  });
});

describe('generateLSText UNDERLOAD figure', () => {
  it('reports the true limiting margin (min of ZFW/TOW/LAW), not always the ZFW margin', () => {
    const ahm = AIRCRAFT_REGISTRY['B-HNQ'];
    const taxiKg = 200;
    const tripKg = 20000;
    const payload = buildEnginePayload(snapshot, flightData, taxiKg, tripKg);
    const engine = new LoadsheetEngine(ahm, payload!);
    const w = engine.calculateWeights();

    // Craft limits so LAW is deliberately the tightest constraint (smallest margin),
    // with ZFW and TOW given generous headroom -- if UNDERLOAD wrongly hardcodes the
    // ZFW margin, it will report a much bigger number than the real binding LAW margin.
    const limits = {
      dispMzfw: (w.ZFW + 50000) / 1000,
      dispMtow: (w.TOW + 50000) / 1000,
      effectiveMlaw: (w.LAW + 1000) / 1000,
    };

    const text = generateLSText('FINAL', 1, snapshot, engine, payload, flightData, {}, limits);
    const underloadMatch = text.match(/UNDERLOAD\s+(-?\d+)/);
    expect(underloadMatch).not.toBeNull();
    const underload = Number(underloadMatch![1]);

    expect(underload).toBe(1000); // the LAW margin -- the real binding limit
    expect(underload).not.toBe(50000); // the ZFW margin -- what the old bug would report

    // sanity: LAW should indeed be flagged "L" as the limiting weight
    expect(text).toMatch(/LAW ACT \d+\s+MAX \d+\s+L/);
  });
});
