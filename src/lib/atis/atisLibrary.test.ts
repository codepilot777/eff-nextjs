import { describe, expect, it } from 'vitest';
import { atisEntryKey, getActiveAtis, saveAtisEntry, setActiveAtis, deleteAtisEntry } from './atisLibrary';
import { applyFlightDirectives } from '../flight/directives';

const a = { icao: 'VHHH', type: 'ARRIVAL', ident: 'A', content: 'HONG KONG ARRIVAL INFO A 0600Z\nQNH 990' };
const b = { ...a, ident: 'B', content: 'HONG KONG ARRIVAL INFO B 0630Z\nQNH 995' };

describe('ATIS library lesson workflow', () => {
  it('preloads multiple identifiers, switches live replies, and preserves delivered messages', () => {
    let library = saveAtisEntry([], a);
    library = saveAtisEntry(library, b);
    expect(library).toHaveLength(2);
    expect(getActiveAtis(library, 'VHHH', 'ARRIVAL')?.ident).toBe('A');
    const delivered = { icao: 'VHHH', type: 'ARRIVAL', time: '0600Z', status: 'DELIVERED', response: a.content };
    const pending = { icao: 'VHHH', type: 'ARRIVAL', time: '0630Z', status: 'PENDING RESPONSE' };
    library = setActiveAtis(library, b);
    const result = applyFlightDirectives({ atis_library: library, atis_requests: [delivered, pending] }, {
      atisAutoDeliver: { icao: 'VHHH', type: 'ARRIVAL' },
    });
    expect(result.atis_requests).toEqual([delivered, { ...pending, status: 'DELIVERED', response: b.content }]);
  });

  it('keeps airport and arrival/departure selections independent', () => {
    const departure = { ...a, type: 'DEPARTURE' };
    const other = { ...a, icao: 'RCTP' };
    const library = setActiveAtis([a, b, departure, other], b);
    expect(getActiveAtis(library, 'VHHH', 'ARRIVAL')?.ident).toBe('B');
    expect(getActiveAtis(library, 'VHHH', 'DEPARTURE')).toEqual(departure);
    expect(getActiveAtis(library, 'RCTP', 'ARRIVAL')).toEqual(other);
  });

  it('replaces one identifier without dropping others or changing the active version', () => {
    const library = saveAtisEntry(saveAtisEntry([a], b), { ...b, content: 'UPDATED B' });
    expect(library).toHaveLength(2);
    expect(getActiveAtis(library, 'VHHH', 'ARRIVAL')?.ident).toBe('A');
    expect(library.find((entry) => entry.ident === 'B')?.content).toBe('UPDATED B');
    const renamed = saveAtisEntry(library, { ...a, ident: 'C' }, atisEntryKey(a));
    expect(renamed.map((entry) => entry.ident)).toEqual(['B', 'C']);
    expect(getActiveAtis(renamed, 'VHHH', 'ARRIVAL')?.ident).toBe('C');
  });

  it('supports legacy entries without identifiers or active flags', () => {
    const { ident: _ident, ...legacy } = a;
    expect(atisEntryKey(legacy)).toBe(atisEntryKey(a));
    expect(getActiveAtis([legacy], 'VHHH', 'ARRIVAL')).toBe(legacy);
    const library = saveAtisEntry([legacy], b);
    expect(getActiveAtis(library, 'VHHH', 'ARRIVAL')?.content).toBe(a.content);
  });

  it('deletes only the chosen identifier and never silently activates a different one', () => {
    const library = saveAtisEntry([a], b);
    expect(deleteAtisEntry(library, b)).toHaveLength(1);
    const remaining = deleteAtisEntry(library, a);
    expect(remaining.map((entry) => entry.ident)).toEqual(['B']);
    expect(getActiveAtis(remaining, 'VHHH', 'ARRIVAL')).toBeUndefined();
    expect(getActiveAtis(saveAtisEntry(remaining, { ...a, ident: 'C' }), 'VHHH', 'ARRIVAL')).toBeUndefined();
    const result = applyFlightDirectives({ atis_library: remaining, atis_requests: [
      { icao: 'VHHH', type: 'ARRIVAL', status: 'PENDING RESPONSE' },
    ] }, { atisAutoDeliver: { icao: 'VHHH', type: 'ARRIVAL' } });
    expect(JSON.stringify(result.atis_requests)).toContain('NO DATA AVAILABLE');
  });
});
