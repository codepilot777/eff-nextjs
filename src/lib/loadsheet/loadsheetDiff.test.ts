import { describe, expect, it } from 'vitest';
import { diffLoadsheetText, type DiffLine } from './loadsheetDiff';

// 🌟 幫手：畀返一行嘅「有冇 highlight 緊任何 token」，方便斷言
function isHighlighted(line: DiffLine): boolean {
  return !!line.tokens?.some((t) => t.highlight);
}

describe('diffLoadsheetText', () => {
  it('does not highlight lines that are byte-identical in both texts', () => {
    const oldText = 'CMDR NAME\nSIGN\nSI';
    const newText = 'CMDR NAME\nSIGN\nSI';
    const diff = diffLoadsheetText(newText, oldText);
    expect(diff.every((l) => l.tokens === undefined)).toBe(true);
  });

  it('highlights only the differing tokens on a line with the same position and structure', () => {
    const oldText = 'ZFW ACT 210814    MAX 224528      13714';
    const newText = 'ZFW ACT 212491    MAX 224528      12037';
    const diff = diffLoadsheetText(newText, oldText);
    expect(diff).toHaveLength(1);
    const line = diff[0];
    expect(line.tokens).toBeDefined();
    const highlighted = line.tokens!.filter((t) => t.highlight).map((t) => t.text);
    expect(highlighted).toEqual(['212491', '12037']);
  });

  it('regression: an inserted block does not shift and falsely highlight the unrelated lines that follow it', () => {
    // 模擬真實情況：PRELIM 冇 CHANGE FROM PRELIM 呢段，FINAL 就有；插入點之後
    // 嘅 CMDR NAME/SIGN/SI 三行喺兩份文字入面完全一樣，唔應該被 highlight
    const oldText = [
      'TTL PAX 438    UNDERLOAD   4769',
      '',
      'CMDR NAME',
      'SIGN',
      '',
      'SI',
      'NOTOC: NO',
    ].join('\n');

    const newText = [
      'TTL PAX 438    UNDERLOAD   1770',
      '',
      'CHANGE FROM PRELIM 01',
      'TOW CHG +2999KG',
      'MACTOW CHG -0.07%',
      '',
      'CMDR NAME',
      'SIGN',
      '',
      'SI',
      'NOTOC: NO',
    ].join('\n');

    const diff = diffLoadsheetText(newText, oldText);
    const byText = (t: string) => diff.find((l) => l.text === t)!;

    // TTL PAX 行本身數值變咗，應該 highlight（但淨係嗰個變咗嘅 token）
    expect(isHighlighted(byText('TTL PAX 438    UNDERLOAD   1770'))).toBe(true);

    // 新插入嘅成段 CHANGE FROM PRELIM 內容，理應成行 highlight
    expect(isHighlighted(byText('CHANGE FROM PRELIM 01'))).toBe(true);
    expect(isHighlighted(byText('TOW CHG +2999KG'))).toBe(true);
    expect(isHighlighted(byText('MACTOW CHG -0.07%'))).toBe(true);

    // 🎯 核心修復點：插入點之後、同 old 一字不差嘅內容，唔應該再被誤 highlight
    expect(byText('CMDR NAME').tokens).toBeUndefined();
    expect(byText('SIGN').tokens).toBeUndefined();
    expect(byText('SI').tokens).toBeUndefined();
    expect(byText('NOTOC: NO').tokens).toBeUndefined();
  });

  it('falls back to plain (no highlight) rendering when either text is empty', () => {
    expect(diffLoadsheetText('A\nB', '')).toEqual([{ text: 'A' }, { text: 'B' }]);
    expect(diffLoadsheetText('', 'A\nB')).toEqual([{ text: '' }]);
  });

  it('handles texts with no shared lines at all — everything is new', () => {
    const diff = diffLoadsheetText('X\nY', 'A\nB');
    expect(diff.every(isHighlighted)).toBe(true);
  });
});
