import { describe, expect, it } from 'vitest';
import { FLIGHT_NUMBER_TABLE, pickFlightNumber } from './flightNumbers';

describe('pickFlightNumber', () => {
  it('returns the table entry for a known route', () => {
    expect(pickFlightNumber('HKG', 'NRT')).toBe('CX500');
    expect(pickFlightNumber('NRT', 'HKG')).toBe('CX501');
  });

  it('falls back to a random CX number for an unknown route, instead of throwing', () => {
    expect(() => pickFlightNumber('XXX', 'YYY')).not.toThrow();
    expect(pickFlightNumber('XXX', 'YYY')).toMatch(/^CX\d+$/);
  });

  it('every table entry has a distinct flight number (no route collisions)', () => {
    const numbers = FLIGHT_NUMBER_TABLE.map((e) => e.flightNo);
    expect(new Set(numbers).size).toBe(numbers.length);
  });
});
