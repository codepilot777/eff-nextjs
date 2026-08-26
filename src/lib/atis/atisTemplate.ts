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
