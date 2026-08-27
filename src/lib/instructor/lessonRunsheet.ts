// 🌟 教官自己打（或者叫 AI 幫手寫）嘅 lesson plan runsheet，用 GitHub-style
// markdown task list 格式（`- [ ] ...` / `- [x] ...`），存喺 flights.data 嘅
// lesson_runsheet 欄位（純文字）——checked 狀態直接編碼喺 `[x]`/`[ ]` 入面，
// 唔使額外開多個欄位存 done/undone 嘅 state，剔一剔即係改返嗰行文字

export type RunsheetLine =
  | { type: 'header'; level: 2 | 3; text: string; lineIndex: number }
  | { type: 'item'; text: string; done: boolean; lineIndex: number }
  | { type: 'text'; text: string; lineIndex: number };

const HEADER_RE = /^(#{2,3})\s+(.*)$/;
const ITEM_RE = /^-\s+\[([ xX])\]\s+(.*)$/;

export function parseRunsheet(markdown: string): RunsheetLine[] {
  const rawLines = markdown.split('\n');
  const lines: RunsheetLine[] = [];

  rawLines.forEach((raw, lineIndex) => {
    const headerMatch = raw.match(HEADER_RE);
    if (headerMatch) {
      lines.push({ type: 'header', level: headerMatch[1].length as 2 | 3, text: headerMatch[2].trim(), lineIndex });
      return;
    }
    const itemMatch = raw.match(ITEM_RE);
    if (itemMatch) {
      lines.push({ type: 'item', text: itemMatch[2].trim(), done: itemMatch[1].toLowerCase() === 'x', lineIndex });
      return;
    }
    if (raw.trim().length > 0) {
      lines.push({ type: 'text', text: raw.trim(), lineIndex });
    }
  });

  return lines;
}

// 🌟 剔一剔淨係翻轉嗰一行嘅 [ ]/[x]，其餘文字原封不動——保證教官自己打嘅
// wording/縮排/空行完全唔會因為剔咗嘢而被重新排版
export function toggleRunsheetItem(markdown: string, lineIndex: number): string {
  const rawLines = markdown.split('\n');
  const target = rawLines[lineIndex];
  if (target === undefined) return markdown;

  const itemMatch = target.match(ITEM_RE);
  if (!itemMatch) return markdown;

  const nextMark = itemMatch[1].toLowerCase() === 'x' ? ' ' : 'x';
  rawLines[lineIndex] = target.replace(ITEM_RE, `- [${nextMark}] $2`);
  return rawLines.join('\n');
}

export function getRunsheetProgress(lines: RunsheetLine[]): { done: number; total: number } {
  const items = lines.filter((l): l is Extract<RunsheetLine, { type: 'item' }> => l.type === 'item');
  return { done: items.filter((i) => i.done).length, total: items.length };
}

export const SAMPLE_RUNSHEET = `## Pre-flight Briefing
- [ ] Brief trainee on scenario objectives
- [ ] Confirm OFP dispatched and reviewed
- [x] Set weather: CAVOK departure, marginal arrival

## Enroute Events
- [ ] At TOC, inject minor hydraulic defect (deferred, MEL)
- [ ] Approve PDC clearance when requested
- [ ] Deliver ATIS on request

## Approach & Landing
- [ ] Monitor fuel discrepancy handling
- [ ] Observe go-around decision if weather deteriorates

## Debrief
- [ ] Review defect handling with trainee
- [ ] Discuss fuel management decisions
`;
