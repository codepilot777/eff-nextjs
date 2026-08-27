// 🌟 DUMMY 佔位資料——呢份唔係真實嘅 CX flight number/航點對照表，純粹等
// techlogContinuity.ts 起機呢刻有嘢用住先。用戶會 upload 一個 Excel（入面有
// 真實嘅 flight number 同航點）嚟取代呢個 table，到時淨係要改
// FLIGHT_NUMBER_TABLE 呢個 array，pickFlightNumber() 嘅邏輯唔使郁

export interface FlightNumberEntry {
  flightNo: string; // 例如 "CX500"
  dep: string; // IATA
  arr: string; // IATA
}

// 🌟 TODO：等用戶 upload 真實資料之後，成個 array 用嗰份 Excel 嘅內容取代
export const FLIGHT_NUMBER_TABLE: FlightNumberEntry[] = [
  { flightNo: 'CX500', dep: 'HKG', arr: 'NRT' },
  { flightNo: 'CX501', dep: 'NRT', arr: 'HKG' },
  { flightNo: 'CX530', dep: 'HKG', arr: 'KIX' },
  { flightNo: 'CX531', dep: 'KIX', arr: 'HKG' },
  { flightNo: 'CX540', dep: 'HKG', arr: 'NGO' },
  { flightNo: 'CX541', dep: 'NGO', arr: 'HKG' },
  { flightNo: 'CX450', dep: 'HKG', arr: 'ICN' },
  { flightNo: 'CX451', dep: 'ICN', arr: 'HKG' },
  { flightNo: 'CX400', dep: 'HKG', arr: 'TPE' },
  { flightNo: 'CX401', dep: 'TPE', arr: 'HKG' },
  { flightNo: 'CX300', dep: 'HKG', arr: 'PVG' },
  { flightNo: 'CX301', dep: 'PVG', arr: 'HKG' },
  { flightNo: 'CX700', dep: 'HKG', arr: 'BKK' },
  { flightNo: 'CX701', dep: 'BKK', arr: 'HKG' },
  { flightNo: 'CX710', dep: 'HKG', arr: 'KUL' },
  { flightNo: 'CX711', dep: 'KUL', arr: 'HKG' },
  { flightNo: 'CX780', dep: 'HKG', arr: 'CGK' },
  { flightNo: 'CX781', dep: 'CGK', arr: 'HKG' },
  { flightNo: 'CX900', dep: 'HKG', arr: 'MNL' },
  { flightNo: 'CX901', dep: 'MNL', arr: 'HKG' },
  { flightNo: 'CX715', dep: 'HKG', arr: 'SIN' },
  { flightNo: 'CX716', dep: 'SIN', arr: 'HKG' },
];

// 🌟 揾唔到 exact match（例如 dummy table 未覆蓋嗰個航點）就 fallback 返隨機
// CX 數字，唔會冇晒個 flight number 顯示
export function pickFlightNumber(dep: string, arr: string): string {
  const match = FLIGHT_NUMBER_TABLE.find((e) => e.dep === dep && e.arr === arr);
  if (match) return match.flightNo;
  return `CX${100 + Math.floor(Math.random() * 800)}`;
}
