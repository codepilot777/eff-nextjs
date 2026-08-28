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

  it('parses indented/nested sub-items (2-space indent before the dash)', () => {
    const md = ['- [ ] Parent step', '  - [ ] Nested sub-item', '  - [x] Nested done sub-item'].join('\n');
    expect(parseRunsheet(md)).toEqual([
      { type: 'item', text: 'Parent step', done: false, lineIndex: 0 },
      { type: 'item', text: 'Nested sub-item', done: false, lineIndex: 1 },
      { type: 'item', text: 'Nested done sub-item', done: true, lineIndex: 2 },
    ]);
  });

  it('parses numbered checklist items (`1. [ ] ...`)', () => {
    const md = ['1. [ ] First debrief point', '2. [x] Second debrief point'].join('\n');
    expect(parseRunsheet(md)).toEqual([
      { type: 'item', text: 'First debrief point', done: false, lineIndex: 0 },
      { type: 'item', text: 'Second debrief point', done: true, lineIndex: 1 },
    ]);
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

  it('preserves indentation when toggling a nested sub-item', () => {
    const md = ['- [ ] Parent', '  - [ ] Nested'].join('\n');
    expect(toggleRunsheetItem(md, 1)).toBe(['- [ ] Parent', '  - [x] Nested'].join('\n'));
  });

  it('preserves numbering when toggling a numbered item', () => {
    const result = toggleRunsheetItem('1. [ ] First debrief point', 0);
    expect(result).toBe('1. [x] First debrief point');
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
