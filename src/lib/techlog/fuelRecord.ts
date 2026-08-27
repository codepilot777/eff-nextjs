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
