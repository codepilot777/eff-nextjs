import { describe, expect, it } from 'vitest';
import { buildEnginePayload, generateLSText, getEffectiveWeightLimits, formatChangeFromPrelim } from './loadsheetHelpers';
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

describe('generateLSText DG remarks line', () => {
  const ahm = AIRCRAFT_REGISTRY['B-HNQ'];
  const taxiKg = 200;
  const tripKg = 20000;
  const limits = { dispMzfw: 250, dispMtow: 300, effectiveMlaw: 230 };

  it('adds a ".<IMP CODE>/<POSITION>" line right after the Cargo HOLD loading line when NOTOC has DG items', () => {
    const flightDataWithDg = {
      ...flightData,
      notoc: {
        hasDg: true,
        items: [
          { imp_code: 'RFL', position: '24P' },
          { imp_code: 'ICE', position: '31P' },
        ],
      },
    };
    const payload = buildEnginePayload(snapshot, flightDataWithDg, taxiKg, tripKg);
    const engine = new LoadsheetEngine(ahm, payload!);
    const text = generateLSText('FINAL', 1, snapshot, engine, payload, flightDataWithDg, {}, limits);

    const lines = text.split('\n');
    const cargoLineIdx = lines.findIndex((l) => l.startsWith('T0    '));
    expect(cargoLineIdx).toBeGreaterThan(-1);
    // regression: DG remarks must sit on the very next line, not buried in SI only
    expect(lines[cargoLineIdx + 1]).toBe('.RFL/24P.ICE/31P');
  });

  it('leaves the line after Cargo HOLD loading blank when there is no DG (unchanged from before)', () => {
    const payload = buildEnginePayload(snapshot, flightData, taxiKg, tripKg);
    const engine = new LoadsheetEngine(ahm, payload!);
    const text = generateLSText('FINAL', 1, snapshot, engine, payload, flightData, {}, limits);

    const lines = text.split('\n');
    const cargoLineIdx = lines.findIndex((l) => l.startsWith('T0    '));
    expect(cargoLineIdx).toBeGreaterThan(-1);
    expect(lines[cargoLineIdx + 1]).toBe('');
  });
});

describe('formatChangeFromPrelim', () => {
  it('formats a positive TOW/MACTOW change with a leading +', () => {
    const text = formatChangeFromPrelim(200500, 25.30, 200180, 25.15, 1);
    expect(text).toContain('CHANGE FROM PRELIM (V01)');
    expect(text).toContain('TOW CHG +320KG');
    expect(text).toContain('MACTOW  +0.15%');
  });

  it('formats a negative TOW/MACTOW change without a double sign', () => {
    const text = formatChangeFromPrelim(199800, 24.90, 200180, 25.15, 2);
    expect(text).toContain('CHANGE FROM PRELIM (V02)');
    expect(text).toContain('TOW CHG -380KG');
    expect(text).toContain('MACTOW  -0.25%');
  });

  it('formats zero change as +0', () => {
    const text = formatChangeFromPrelim(200000, 25.0, 200000, 25.0, 1);
    expect(text).toContain('TOW CHG +0KG');
    expect(text).toContain('MACTOW  +0.00%');
  });
});

describe('generateLSText CHANGE FROM PRELIM block', () => {
  const ahm = AIRCRAFT_REGISTRY['B-HNQ'];
  const taxiKg = 200;
  const tripKg = 20000;
  const limits = { dispMzfw: 250, dispMtow: 300, effectiveMlaw: 230 };

  it('includes the CHANGE FROM PRELIM block for FINAL when a compareStage is given', () => {
    const payload = buildEnginePayload(snapshot, flightData, taxiKg, tripKg);
    const engine = new LoadsheetEngine(ahm, payload!);
    const w = engine.calculateWeights();
    const cg = engine.calculateCG();
    // simulate a prelim that had a slightly lighter TOW/MACTOW than this FINAL
    const compareStage = { version: 1, tow: w.TOW - 300, macTow: cg.MACTOW - 0.1 };

    const text = generateLSText('FINAL', 2, snapshot, engine, payload, flightData, {}, limits, compareStage);
    expect(text).toContain('CHANGE FROM PRELIM (V01)');
    expect(text).toContain('TOW CHG +300KG');
  });

  it('omits the CHANGE FROM PRELIM block when no compareStage is given', () => {
    const payload = buildEnginePayload(snapshot, flightData, taxiKg, tripKg);
    const engine = new LoadsheetEngine(ahm, payload!);
    const text = generateLSText('FINAL', 1, snapshot, engine, payload, flightData, {}, limits);
    expect(text).not.toContain('CHANGE FROM PRELIM');
  });

  it('never shows the block for PRELIM, even if a compareStage is (incorrectly) passed', () => {
    const payload = buildEnginePayload(snapshot, flightData, taxiKg, tripKg);
    const engine = new LoadsheetEngine(ahm, payload!);
    const compareStage = { version: 1, tow: 100000, macTow: 25.0 };
    const text = generateLSText('PRELIM', 2, snapshot, engine, payload, flightData, {}, limits, compareStage);
    expect(text).not.toContain('CHANGE FROM PRELIM');
  });
});
