// 🌟 ATIS HEADER/FOOTER 一律用固定格式自動生成，instructor 淨係要打
// identifier（例如 "C"）就夠——以前 content 係一個大 freeform textarea，
// 教官改咗 identifier 好容易唔記得手動同步埋 footer 嗰句
// "ADVISE YOU HAVE INFORMATION X"，而家兩樣嘢一律由呢個 module 計，
// 唔會再有機會漏改其中一邊

export type AtisType = 'DEPARTURE' | 'ARRIVAL';

export function buildAtisHeader(icao: string, type: AtisType, ident: string): string {
  return `${icao.trim().toUpperCase()} ${type} ATIS INFORMATION ${ident.trim().toUpperCase()}`;
}

// 🌟 DEP 同 ARR 用唔同 facility（Delivery vs Approach）嚟 first contact，
// 呢個分支正正就係「教官手動打好易漏一邊」嗰個位
export function buildAtisFooter(type: AtisType, ident: string): string {
  const i = ident.trim().toUpperCase();
  return type === 'ARRIVAL'
    ? `ON FIRST CONTACT WITH APPROACH, ADVISE YOU HAVE INFORMATION ${i}.`
    : `ON FIRST CONTACT WITH DELIVERY, ADVISE YOU HAVE INFORMATION ${i}.`;
}

export function composeAtisContent(icao: string, type: AtisType, ident: string, body: string): string {
  const header = buildAtisHeader(icao, type, ident);
  const footer = buildAtisFooter(type, ident);
  const trimmedBody = body.trim();
  return [header, trimmedBody, footer].filter(Boolean).join('\n\n');
}


export interface ParsedAtisPaste {
  icao: string;
  ident: string;
  issuedAt: string | null;
  body: string;
  footer: string;
  content: string;
}

/** Parse a complete ATIS paste, including the compact header format. */
export function parseAtisPaste(input: string): ParsedAtisPaste | null {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const match = lines[0].match(
    /^([A-Z]{4})\s+(?:DEPARTURE\s+|ARRIVAL\s+)?ATIS\s+(?:INFO|INFORMATION)\s+([A-Z])(?:\s+(\d{4}Z))?$/i
  );
  if (!match) return null;

  let footerIndex = lines.length;
  if (/^(?:ADVISE\b|ON FIRST CONTACT\b)/i.test(lines[lines.length - 1])) {
    footerIndex -= 1;
  }

  return {
    icao: match[1].toUpperCase(),
    ident: match[2].toUpperCase(),
    issuedAt: match[3]?.toUpperCase() ?? null,
    body: lines.slice(1, footerIndex).join("\n"),
    footer: footerIndex < lines.length ? lines[footerIndex] : "",
    content: lines.join("\n"),
  };
}
