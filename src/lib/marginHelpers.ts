// 🌟 共用嘅 ZFW/TOW/LW margin 邏輯，Dashboard FuelWeightColumn 同 TechLog panels 都用返
// 同一套，唔再各自維護一份（仲有各自嘅 hardcoded fallback）。

interface ZfwCalc {
  showRevVal: boolean;
  actualZfw: number;
  ofpZfw: number;
}

export function getZfwValue(calc: ZfwCalc | null | undefined): number {
  if (!calc) return 0;
  return calc.showRevVal ? (calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw) : (calc.ofpZfw ?? 0);
}

export function getMargin(value: number, limitKg: number): number {
  return value - (limitKg / 1000);
}

export function getMarginStr(m: number): string {
  return m > 0 ? `+${m.toFixed(1)}` : m.toFixed(1);
}

export function getMarginColor(m: number): string {
  return m > 0 ? 'text-[#FF1744] font-black' : 'text-[#8fa0a6]';
}
