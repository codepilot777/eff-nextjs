import { describe, expect, it } from 'vitest';
import { calculateFuelEngine } from './fuelCalculator';

const baseFlight = {
  weight_zfw_ofp: 180.0,
  fuel_taxi_ofp: 1.0,
  fuel_trip_ofp: 20.0,
  fuel_cont_ofp: 1.0,
  fuel_reserve_ofp: 3.0,
  fuel_altn_ofp: 2.0,
  altn_icao: 'RJOO',
};

describe('calculateFuelEngine', () => {
  it('passes through the OFP baseline unchanged when nothing overrides it', () => {
    const calc = calculateFuelEngine(baseFlight);

    expect(calc.isManual).toBe(false);
    expect(calc.ofpReqdBase).toBeCloseTo(1.0 + 20.0 + 1.0 + 2.0 + 3.0);
    // No ZFW/altn delta -> no loop penalty -> auto total matches the OFP baseline
    expect(calc.autoTotal).toBeCloseTo(calc.ofpReqdBase);
    expect(calc.currTotal).toBeCloseTo(calc.autoTotal);
  });

  it('falls back to a single alternate derived from altn_icao/fuel_altn_ofp when no alternates array is given', () => {
    const calc = calculateFuelEngine(baseFlight);

    expect(calc.altnOptions).toEqual(['RJOO']);
    expect(calc.selectedAltn).toBe('RJOO');
    expect(calc.currAltnOfp).toBeCloseTo(2.0);
  });

  it('adds a fuel-burn penalty when trainee ZFW input is heavier than the OFP ZFW', () => {
    const heavier = { ...baseFlight, trainee_input_zfw: 182.0 };
    const calc = calculateFuelEngine(heavier);

    expect(calc.deltaZfw).toBeCloseTo(2.0);
    // Heavier ZFW burns more trip fuel than planned
    expect(calc.autoTrip).toBeGreaterThan(baseFlight.fuel_trip_ofp);
  });

  it('lets manual fuel entry override the computed values entirely', () => {
    const manual = {
      ...baseFlight,
      fuel_manual_mode: true,
      manual_fuel: { taxi: 1.5, trip: 22.0, cont: 1.2, tankering: 0.5, extra: 0.3, total: 29.5 },
    };
    const calc = calculateFuelEngine(manual);

    expect(calc.isManual).toBe(true);
    expect(calc.currTaxi).toBeCloseTo(1.5);
    expect(calc.currTrip).toBeCloseTo(22.0);
    expect(calc.currTotal).toBeCloseTo(29.5);
  });

  it('never lets EFOB at destination go negative', () => {
    const starved = { ...baseFlight, fuel_manual_mode: true, manual_fuel: { taxi: 0, trip: 0, cont: 0, tankering: 0, extra: 0, total: 0 } };
    const calc = calculateFuelEngine(starved);

    expect(calc.efobAtDest).toBeGreaterThanOrEqual(0);
  });

  describe('showRevVal', () => {
    it('is false for an untouched OFP baseline (regression: used to be true just because ofpZfw > 0)', () => {
      const calc = calculateFuelEngine(baseFlight);
      expect(calc.hasTraineeZfwInput).toBe(false);
      expect(calc.showRevVal).toBe(false);
    });

    it('becomes true once the trainee actually types a ZFW override', () => {
      const calc = calculateFuelEngine({ ...baseFlight, trainee_input_zfw: 182.0 });
      expect(calc.hasTraineeZfwInput).toBe(true);
      expect(calc.showRevVal).toBe(true);
    });

    it('becomes true in manual mode even with no other overrides', () => {
      const calc = calculateFuelEngine({ ...baseFlight, fuel_manual_mode: true, manual_fuel: {} });
      expect(calc.showRevVal).toBe(true);
    });

    it('becomes true when a non-default alternate is selected', () => {
      const withAltns = {
        ...baseFlight,
        alternates: [{ icao: 'RJOO', burn: 2.0, time: 30 }, { icao: 'RJBB', burn: 2.5, time: 35 }],
        selected_altn: 'RJBB',
      };
      const calc = calculateFuelEngine(withAltns);
      expect(calc.showRevVal).toBe(true);
    });
  });

  describe('processedAlternates', () => {
    it('does not bleed the selected alternate\'s trip fuel into a non-selected alternate lacking its own burn', () => {
      const withAltns = {
        ...baseFlight,
        alternates: [{ icao: 'RJOO', burn: 2.0, time: 30 }, { icao: 'RJBB', burn: 0, time: 35 }], // RJBB has no real burn
        selected_altn: 'RJOO',
      };
      const calc = calculateFuelEngine(withAltns);
      const rjbb = calc.processedAlternates.find((a: { icao: string; mdf: number | null; holdFuel: number | null; holdTime: string }) => a.icao === 'RJBB')!;

      expect(rjbb.mdf).toBeNull();
      expect(rjbb.holdFuel).toBeNull();
      expect(rjbb.holdTime).toBe('--');
    });

    it('still computes a real MDF for the selected alternate even in single-fallback-alternate mode', () => {
      const calc = calculateFuelEngine(baseFlight); // single fallback altn, RJOO selected
      const rjoo = calc.processedAlternates.find((a: { icao: string; mdf: number | null }) => a.icao === 'RJOO')!;

      expect(rjoo.mdf).not.toBeNull();
      expect(rjoo.mdf).toBeCloseTo(2.0 + baseFlight.fuel_reserve_ofp);
    });
  });
});
