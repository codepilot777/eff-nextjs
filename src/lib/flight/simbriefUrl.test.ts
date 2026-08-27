import { describe, expect, it } from 'vitest';
import { buildSimbriefDispatchUrl } from './simbriefUrl';

describe('buildSimbriefDispatchUrl', () => {
  it('builds the expected URL for a normal flight number and route', () => {
    const url = buildSimbriefDispatchUrl('CPA 564', 'VHHH', 'RJBB');
    expect(url).toBe('https://www.simbrief.com/system/dispatch.php?airline=CPA&fltnum=564&orig=VHHH&dest=RJBB');
  });

  it('regression: URL-encodes characters a free-typed flight number/ICAO field could contain, instead of breaking the query string', () => {
    // "&"/"#" 呢啲字符如果直接砌落 template string，會整爛個 query string
    // 或者畀人可以夾硬加多個 query param（同 /api/simbrief/route.ts 之前
    // 修過嘅 username-encoding bug 係同一類問題）
    const url = buildSimbriefDispatchUrl('CX&hack=1 100#frag', 'VH HH', 'RJ&BB');
    expect(url).not.toContain('&hack=1');
    expect(url).not.toContain('#frag');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('airline')).toBe('CX&hack=1');
    expect(parsed.searchParams.get('orig')).toBe('VH HH');
    expect(parsed.searchParams.get('dest')).toBe('RJ&BB');
  });

  it('falls back to CPA 564 when the flight number is empty', () => {
    const url = buildSimbriefDispatchUrl('', 'VHHH', 'RJBB');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('airline')).toBe('CPA');
    expect(parsed.searchParams.get('fltnum')).toBe('564');
  });

  it('preserves the original (unusual) single-token parsing: airline becomes that token, fltnum still falls back to "564"', () => {
    // 🌟 舊 code 呢種情況（用戶淨係打咗一個 token，未打埋 flight number）會將
    // 個單一 token 讀做 airline，fltnum 就跌落去 fallback。呢個 helper 淨係
    // 修 encoding，冇改呢個既有（雖然有啲奇怪）嘅 parsing 決定
    const url = buildSimbriefDispatchUrl('564', 'VHHH', 'RJBB');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('airline')).toBe('564');
    expect(parsed.searchParams.get('fltnum')).toBe('564');
  });

  it('handles missing origin/destination without throwing', () => {
    const url = buildSimbriefDispatchUrl('CPA 564', '', '');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('orig')).toBe('');
    expect(parsed.searchParams.get('dest')).toBe('');
  });
});
