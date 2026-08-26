import { describe, expect, it } from 'vitest';
import { identMatches, findRouteHighlightSpan } from './routeHighlight';

describe('identMatches', () => {
  it('matches identical identifiers case-insensitively', () => {
    expect(identMatches('elato1a', 'ELATO1A')).toBe(true);
    expect(identMatches('ELATO1A', 'ELATO1A')).toBe(true);
  });

  it('regression: matches SimBrief\'s real-world one-letter drift between general.star_ident and the printed flightplan_text token', () => {
    // real observed sample: general.star_ident = "ABEY4A" but atc.flightplan_text
    // prints "ABBEY4A" (one extra "B") -- exact-match alone made the Highlight
    // Route button permanently disabled and Clear Highlight never appear
    expect(identMatches('ABBEY4A', 'ABEY4A')).toBe(true);
    expect(identMatches('ABEY4A', 'ABBEY4A')).toBe(true);
  });

  it('does not fuzzy-match short identifiers, to avoid false positives on airways/DCT', () => {
    expect(identMatches('A1', 'A2')).toBe(false);
    expect(identMatches('DCT', 'DCA')).toBe(false);
  });

  it('does not match identifiers more than 1 edit apart', () => {
    expect(identMatches('ELATO1A', 'SUNGI1A')).toBe(false);
    expect(identMatches('ARLON1A', 'ELATO1A')).toBe(false);
  });

  it('returns false for empty/missing input', () => {
    expect(identMatches('', 'ELATO1A')).toBe(false);
    expect(identMatches('ELATO1A', '')).toBe(false);
  });
});

describe('findRouteHighlightSpan', () => {
  it('finds the SID-to-STAR span with exact matches', () => {
    const fplParts = '-N0480F350 ELATO1A ELATO Y11 SUNGI DCT NTS DCT KAGOS ARLON1A'.split(/(\s+)/);
    const span = findRouteHighlightSpan(fplParts, 'ELATO1A', 'ARLON1A');
    const tokens = span.routeTokenPartIndices.map((i) => fplParts[i]);
    expect(tokens).toEqual(['ELATO1A', 'ELATO', 'Y11', 'SUNGI', 'DCT', 'NTS', 'DCT', 'KAGOS', 'ARLON1A']);
  });

  it('regression: finds the span even when the STAR is spelled slightly differently in the printed text than general.star_ident', () => {
    // mirrors the real SimBrief sample: general.sid_ident="DALBI1", general.star_ident="ABEY4A",
    // but the flightplan_text route line prints "...V522 ABBEY ABBEY4A"
    const fplParts = '-N0482F360 DALBI1 DALBI Y120 TAPPI Y12 ARIKA Y14 MIHOU Y45 HKC Y50\n IGMON A1 BULAN DCT APU/N0483F380 A1 ELATO V522 ABBEY ABBEY4A'.split(/(\s+)/);
    const span = findRouteHighlightSpan(fplParts, 'DALBI1', 'ABEY4A');
    expect(span.sidPartIdx).toBeGreaterThan(-1);
    expect(span.starPartIdx).toBeGreaterThan(-1);
    expect(span.routeTokenPartIndices.length).toBeGreaterThan(0);
    const tokens = span.routeTokenPartIndices.map((i) => fplParts[i]);
    expect(tokens[0]).toBe('DALBI1');
    expect(tokens[tokens.length - 1]).toBe('ABBEY4A');
  });

  it('returns an empty span when the SID cannot be found at all', () => {
    const fplParts = '-N0480F350 DCT OCEAN DCT MKG DCT'.split(/(\s+)/);
    const span = findRouteHighlightSpan(fplParts, 'ELATO1A', 'ARLON1A');
    expect(span.routeTokenPartIndices).toEqual([]);
  });

  it('returns an empty span when sidIdent/starIdent are null', () => {
    const fplParts = '-N0480F350 ELATO1A ELATO DCT ARLON1A'.split(/(\s+)/);
    expect(findRouteHighlightSpan(fplParts, null, 'ARLON1A').routeTokenPartIndices).toEqual([]);
    expect(findRouteHighlightSpan(fplParts, 'ELATO1A', null).routeTokenPartIndices).toEqual([]);
  });
});
