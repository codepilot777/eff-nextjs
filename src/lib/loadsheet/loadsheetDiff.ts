// src/lib/loadsheet/loadsheetDiff.ts

// 🌟 HistoryPanel.tsx 用嚟畀 FINAL loadsheet 同上一個 PRELIM 版本做 highlight diff
// 嘅邏輯，抽出嚟做獨立、可測試嘅 module。
//
// 修復：以前純粹用「第 i 行 對 第 i 行」逐行比較——一旦兩份文字嘅行數唔一致
// （例如 FINAL 而家會喺 TTL PAX 之下多插咗成段 CHANGE FROM PRELIM 區塊），
// 插入點之後所有行都會「錯位」，令一大堆其實同 PRELIM 完全一樣、淨係位置
// 郁咗嘅內容（CMDR NAME/SIGN/SI/NOTOC 呢啲）都被誤 highlight。而家改用
// LCS（最長共同子序列）搵返兩份文字入面真正對應（一字不差）嘅「錨點」行，
// 淨係喺兩個錨點之間嘅缺口先逐行 token 比較；缺口入面 new 比 old 多出嚟嘅
// 行（例如成段新插入嘅 CHANGE FROM PRELIM），先當係真正新增，成行 highlight。

export interface DiffToken {
  text: string;
  highlight: boolean;
}

export interface DiffLine {
  text: string;
  // 🌟 undefined = 呢行同 old 果邊一字不差，唔使 highlight 任何嘢
  tokens?: DiffToken[];
}

// 🌟 標準 LCS DP，揾出 oldLines/newLines 之間「一字不差」嘅行可以點樣逐對
// 對應（按原本順序），做 diff 嘅錨點
function computeLcsPairs(oldLines: string[], newLines: string[]): Array<[number, number]> {
  const n = oldLines.length;
  const m = newLines.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = oldLines[i] === newLines[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const pairs: Array<[number, number]> = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (oldLines[i] === newLines[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return pairs;
}

function diffLineTokens(oldLine: string, newLine: string): DiffToken[] {
  const oldTokens = oldLine.split(/(\s+)/);
  const newTokens = newLine.split(/(\s+)/);
  return newTokens.map((token, idx) => ({
    text: token,
    highlight: token.trim() !== '' && token !== oldTokens[idx],
  }));
}

// 🌟 一整行喺 old 度搵唔到任何對應——當成真正新增，非空白 token 全部 highlight
function fullyHighlightedLine(line: string): DiffLine {
  const tokens = line.split(/(\s+)/).map((token) => ({ text: token, highlight: token.trim() !== '' }));
  return { text: line, tokens };
}

export function diffLoadsheetText(newText: string, oldText: string): DiffLine[] {
  if (!oldText || !newText) return newText.split('\n').map((text) => ({ text }));

  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const anchors = computeLcsPairs(oldLines, newLines);

  const result: DiffLine[] = [];
  let oldCursor = 0;
  let newCursor = 0;

  // 🌟 兩個錨點之間嘅「缺口」——逐個位置一一對應做 token diff；new 缺口
  // 比 old 缺口長嘅尾巴（例如插入咗成段新內容），冇對應 old 行可以比較，
  // 成行當新增 highlight
  const processGap = (oldGap: string[], newGap: string[]) => {
    const shared = Math.min(oldGap.length, newGap.length);
    for (let k = 0; k < shared; k++) {
      const oLine = oldGap[k];
      const nLine = newGap[k];
      result.push(oLine === nLine ? { text: nLine } : { text: nLine, tokens: diffLineTokens(oLine, nLine) });
    }
    for (let k = shared; k < newGap.length; k++) {
      result.push(fullyHighlightedLine(newGap[k]));
    }
  };

  for (const [oi, ni] of anchors) {
    processGap(oldLines.slice(oldCursor, oi), newLines.slice(newCursor, ni));
    result.push({ text: newLines[ni] }); // 錨點本身：一字不差，唔 highlight
    oldCursor = oi + 1;
    newCursor = ni + 1;
  }
  processGap(oldLines.slice(oldCursor), newLines.slice(newCursor));

  return result;
}
