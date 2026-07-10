import { describe, expect, it } from 'vitest';
import { buildAltnSelectUpdate } from './useFlightData';

describe('buildAltnSelectUpdate', () => {
  it('writes selected_altn as the real ICAO string, not through parseFloat into manual_fuel', () => {
    const update = buildAltnSelectUpdate('RJBB');
    expect(update).toEqual({ selected_altn: 'RJBB', final_fuel_accepted: false });
    expect(update).not.toHaveProperty('manual_fuel');
  });
});
