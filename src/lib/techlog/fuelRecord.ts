// 🌟 單一嘅 Fuel Record 衍生數值計算，畀 TaskFuelRecord.tsx（trainee 填緊嗰陣嘅
// live preview）同 TaskAcceptance.tsx（顯示返 trainee 已經填低嘅結果）共用，
// 兩邊唔會再各自砌一份可能會走樣嘅公式。Expected Uplift/Discrepancy 都係
// 由已經存低嘅 tl_prev_fob/tl_total_departure_fuel/tl_actual_uplift 即時計返
// 出嚟，唔使额外開多個欄位存呢啲衍生數
export function computeFuelDerived(fobBefore: number, totalDeparture: number, actualUplift: number) {
  const expectedUplift = Math.max(0, totalDeparture - fobBefore);
  const discrepancy = actualUplift - expectedUplift;
  return { expectedUplift, discrepancy };
}

export interface FuelRecordDerived {
  fobBefore: number;
  totalDeparture: number;
  actualUplift: number;
  expectedUplift: number;
  discrepancy: number;
}

// 🌟 History 個 sector 詳情冇存低 tl_prev_fob/tl_total_departure_fuel 呢類
// live-only 欄位，但每個 flights[] entry 都有 fuelUp（呢程實際 uplift 咗幾多）
// 同 fuelArr（呢程落地嗰陣仲有幾多），可以由「上一程（chronologically 早過
// 呢程，即係 flights array 入面下一個 index）嘅 fuelArr」推返出嚟做「呢程
// 起飛前嘅 FOB」。History 冇記錄過「原先預算幾多」，就假設冇 discrepancy
// （已經係塵埃落定嘅記錄，唔好夾硬砌一個從來冇發生過嘅落差出嚟）
export function deriveHistoricalFuelRecord(fuelUp: unknown, priorFuelArr: unknown): FuelRecordDerived {
  const actualUplift = parseFloat(String(fuelUp ?? 0)) || 0;
  const fobBefore = parseFloat(String(priorFuelArr ?? '10.5')) || 0;
  const totalDeparture = fobBefore + actualUplift;
  return { fobBefore, totalDeparture, actualUplift, expectedUplift: actualUplift, discrepancy: 0 };
}
