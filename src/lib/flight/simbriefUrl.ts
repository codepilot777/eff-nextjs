// src/lib/flight/simbriefUrl.ts

// 🌟 EDIT ON SIMBRIEF 呢個外部連結，以前喺 instructor/page.tsx 同 ConfigTab.tsx
// 兩個地方各自複製咗一份一模一樣嘅 getSimbriefUrl()，兩份都直接用 template
// string 砌 query string，冇 encodeURIComponent——airline/flight number/
// ICAO 呢幾個欄位全部都係教官自由輸入嘅 text input，唔係鎖死嘅下拉選單，
// 隨時可以打入空格/"&"/"#" 等字符，直接砌落 URL 會整爛個 query string
// （同 /api/simbrief/route.ts 之前修過嘅 username 冇 encode 個 bug 係同一類）。
// 抽出嚟做單一、有 encode、有測試嘅共用 helper，兩邊都改用返呢個。
export function buildSimbriefDispatchUrl(flightNo: string, depIcao: string, arrIcao: string): string {
  const parts = (flightNo || "CPA 564").split(" ");
  const airline = parts.length > 0 && parts[0] ? parts[0] : "CPA";
  const fltnum = parts.length > 1 && parts[1] ? parts[1] : "564";

  const params = new URLSearchParams({
    airline,
    fltnum,
    orig: depIcao || "",
    dest: arrIcao || "",
  });

  return `https://www.simbrief.com/system/dispatch.php?${params.toString()}`;
}
