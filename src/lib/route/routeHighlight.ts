// 🌟 抽出嚟做獨立、可測試嘅 module：搵出 ATS flight plan 文字入面由 SID 到 STAR
// 之間可以 highlight/share 嘅 route token span（ModalFMS.tsx 嘅 Highlight Route /
// Share Route 兩個功能共用）

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[rows - 1][cols - 1];
}

// 🌟 修復：SimBrief 有時 general.sid_ident/star_ident 同 atc.flightplan_text 入面
// 實際印出嚟嘅字會差一個字母——真實 sample 觀察到嘅案例：star_ident 係
// "ABEY4A"，但 flightplan_text 個 route 行入面印住嘅係 "ABBEY4A"（多咗一個
// "B"）。以前用 exact string equality 搵，搵完全match唔到就令
// canHighlightRoute 恆定 false，成個 Highlight Route 掣睇落「壞咗」（撳極
// 都冇反應，因為 disabled），Clear Highlight 掣亦都因為 highlightCount 永遠
// 郁唔到而永遠唔會出現。而家 exact match 搵唔到就試埋 edit distance <= 1
// 嘅寬鬆比對；太短（3 個字或以下）嘅 identifier 唔玩 fuzzy，避免亂咁撞中
// 第啲完全唔相關嘅短 waypoint/airway 代號（例如 "A1"、"DCT"）
export function identMatches(token: string, ident: string): boolean {
  if (!token || !ident) return false;
  const a = token.trim().toUpperCase();
  const b = ident.trim().toUpperCase();
  if (!a || !b) return false;
  if (a === b) return true;
  if (Math.max(a.length, b.length) <= 3) return false;
  return levenshteinDistance(a, b) <= 1;
}

export interface RouteHighlightSpan {
  sidPartIdx: number;
  starPartIdx: number;
  routeTokenPartIndices: number[];
}

// 🌟 由 fplParts（ATS flight plan 文字用 /(\s+)/ split 咗嘅 array，奇數 index 係
// whitespace/newline separator）度，搵出由 SID identifier 個 token 開始，去到
// （喺佢之後）第一個 STAR identifier token 為止嘅可 highlight span
export function findRouteHighlightSpan(
  fplParts: string[],
  sidIdent: string | null,
  starIdent: string | null
): RouteHighlightSpan {
  let sidPartIdx = -1;
  if (sidIdent) sidPartIdx = fplParts.findIndex((p) => identMatches(p, sidIdent));

  let starPartIdx = -1;
  if (starIdent) {
    for (let i = Math.max(sidPartIdx, 0); i < fplParts.length; i++) {
      if (identMatches(fplParts[i], starIdent)) { starPartIdx = i; break; }
    }
  }

  const routeTokenPartIndices: number[] = [];
  if (sidPartIdx >= 0 && starPartIdx >= sidPartIdx) {
    for (let i = sidPartIdx; i <= starPartIdx; i++) {
      if (fplParts[i].trim().length > 0) routeTokenPartIndices.push(i);
    }
  }

  return { sidPartIdx, starPartIdx, routeTokenPartIndices };
}
