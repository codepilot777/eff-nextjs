import { describe, expect, it } from 'vitest';
import { buildAtisHeader, buildAtisFooter, composeAtisContent, parseAtisPaste } from './atisTemplate';

describe('buildAtisHeader', () => {
  it('formats icao/type/ident uppercase, trimmed', () => {
    expect(buildAtisHeader(' vhhh ', 'DEPARTURE', ' c ')).toBe('VHHH DEPARTURE ATIS INFORMATION C');
    expect(buildAtisHeader('rjcc', 'ARRIVAL', 'q')).toBe('RJCC ARRIVAL ATIS INFORMATION Q');
  });
});

describe('buildAtisFooter', () => {
  it('uses DELIVERY for DEPARTURE', () => {
    expect(buildAtisFooter('DEPARTURE', 'c')).toBe('ON FIRST CONTACT WITH DELIVERY, ADVISE YOU HAVE INFORMATION C.');
  });

  it('uses APPROACH for ARRIVAL', () => {
    expect(buildAtisFooter('ARRIVAL', 'q')).toBe('ON FIRST CONTACT WITH APPROACH, ADVISE YOU HAVE INFORMATION Q.');
  });
});

describe('composeAtisContent', () => {
  it('joins header, body, footer with blank lines, and keeps footer in sync with a changed ident', () => {
    const content = composeAtisContent('VHHH', 'DEPARTURE', 'c', 'RWY 07L IN USE. WIND 090/10.');
    expect(content).toBe(
      'VHHH DEPARTURE ATIS INFORMATION C\n\nRWY 07L IN USE. WIND 090/10.\n\nON FIRST CONTACT WITH DELIVERY, ADVISE YOU HAVE INFORMATION C.'
    );
  });

  it('regression: changing only the ident updates both header and footer identically, so they can never drift apart', () => {
    const before = composeAtisContent('VHHH', 'ARRIVAL', 'c', 'BODY TEXT');
    const after = composeAtisContent('VHHH', 'ARRIVAL', 'q', 'BODY TEXT');
    expect(before).toContain('INFORMATION C');
    expect(before).toContain('HAVE INFORMATION C.');
    expect(after).toContain('INFORMATION Q');
    expect(after).toContain('HAVE INFORMATION Q.');
    expect(after).not.toContain('INFORMATION C');
  });

  it('drops an empty body without leaving a stray blank line', () => {
    const content = composeAtisContent('VHHH', 'DEPARTURE', 'c', '  ');
    expect(content).toBe(
      'VHHH DEPARTURE ATIS INFORMATION C\n\nON FIRST CONTACT WITH DELIVERY, ADVISE YOU HAVE INFORMATION C.'
    );
  });
});

describe('parseAtisPaste formats', () => {
  it('imports the Hong Kong arrival sample and preserves the full bulletin', () => {
    const text = `HONG KONG ARRIVAL INFO A 0600Z
RWY 07L IN USE
WIND 010/20G32KT
VIS 4000 -RA FEW008 BKN015 OVC030
TEMP 26 DEWPOINT 24 QNH 990
TREND BECMG FM0900 36024G36KT 6000
ARR METERING IN FORCE
ADVISE ATC ON INITIAL CONTACT YOU HAVE INFO A`;
    expect(parseAtisPaste(text)).toEqual({
      icao: 'VHHH', type: 'ARRIVAL', ident: 'A', issuedAt: '0600Z',
      body: text.split('\n').slice(1, -1).join('\n'),
      footer: 'ADVISE ATC ON INITIAL CONTACT YOU HAVE INFO A', content: text,
    });
  });

  it('keeps compact ICAO headers compatible with the selected type', () => {
    expect(parseAtisPaste('RCTP ATIS INFO A 0650Z\nWIND 010/20KT'))
      .toMatchObject({ icao: 'RCTP', type: null, ident: 'A', issuedAt: '0650Z', body: 'WIND 010/20KT' });
  });

  it('supports explicit ICAO types, INFORMATION, quotes and CRLF', () => {
    expect(parseAtisPaste('"vhhh departure atis information c 0700z\r\nQNH 1000\r\n"'))
      .toMatchObject({ icao: 'VHHH', type: 'DEPARTURE', ident: 'C', issuedAt: '0700Z' });
  });

  it('rejects unknown airport names and malformed headers', () => {
    expect(parseAtisPaste('UNKNOWN ARRIVAL INFO A 0600Z\nQNH 1000')).toBeNull();
    expect(parseAtisPaste('HONG KONG ARRIVAL INFO 0600Z')).toBeNull();
  });
});
