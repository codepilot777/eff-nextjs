import { describe, expect, it } from 'vitest';
import { parseRunsheet, toggleRunsheetItem, getRunsheetProgress, SAMPLE_RUNSHEET } from './lessonRunsheet';

describe('parseRunsheet', () => {
  it('parses ## and ### headers, checked/unchecked items, and plain text lines', () => {
    const md = [
      '## Pre-flight',
      '- [ ] Brief trainee',
      '- [x] Dispatch OFP',
      '### Notes',
      'Free-form reminder line',
      '',
    ].join('\n');

    const lines = parseRunsheet(md);
    expect(lines).toEqual([
      { type: 'header', level: 2, text: 'Pre-flight', lineIndex: 0 },
      { type: 'item', text: 'Brief trainee', done: false, lineIndex: 1 },
      { type: 'item', text: 'Dispatch OFP', done: true, lineIndex: 2 },
      { type: 'header', level: 3, text: 'Notes', lineIndex: 3 },
      { type: 'text', text: 'Free-form reminder line', lineIndex: 4 },
    ]);
  });

  it('is case-insensitive on the checked marker ([X] counts as done)', () => {
    const lines = parseRunsheet('- [X] Done already');
    expect(lines).toEqual([{ type: 'item', text: 'Done already', done: true, lineIndex: 0 }]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseRunsheet('')).toEqual([]);
    expect(parseRunsheet('   \n\n  ')).toEqual([]);
  });
});

describe('toggleRunsheetItem', () => {
  it('flips an unchecked item to checked', () => {
    const result = toggleRunsheetItem('- [ ] Task one', 0);
    expect(result).toBe('- [x] Task one');
  });

  it('flips a checked item back to unchecked', () => {
    const result = toggleRunsheetItem('- [x] Task one', 0);
    expect(result).toBe('- [ ] Task one');
  });

  it('only touches the targeted line, leaving the rest of the document untouched', () => {
    const md = ['## Section', '- [ ] First', '- [ ] Second'].join('\n');
    const result = toggleRunsheetItem(md, 2);
    expect(result).toBe(['## Section', '- [ ] First', '- [x] Second'].join('\n'));
  });

  it('is a no-op when the targeted line is not a checklist item or out of range', () => {
    const md = ['## Section', '- [ ] First'].join('\n');
    expect(toggleRunsheetItem(md, 0)).toBe(md);
    expect(toggleRunsheetItem(md, 99)).toBe(md);
  });
});

describe('getRunsheetProgress', () => {
  it('counts done vs total items, ignoring headers and plain text', () => {
    const lines = parseRunsheet(SAMPLE_RUNSHEET);
    const progress = getRunsheetProgress(lines);
    expect(progress.total).toBe(10);
    expect(progress.done).toBe(1);
  });
});
