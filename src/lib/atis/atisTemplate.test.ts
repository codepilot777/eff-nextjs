import { describe, expect, it } from 'vitest';
import { buildAtisHeader, buildAtisFooter, composeAtisContent } from './atisTemplate';

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
