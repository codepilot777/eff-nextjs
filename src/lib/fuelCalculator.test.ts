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
});
