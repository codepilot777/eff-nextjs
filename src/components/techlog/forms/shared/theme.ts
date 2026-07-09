// 🌟 3 個 sector-close form 共用嘅主題色 token，實際 class 字串要保持 literal
// （唔可以用 `border-[${hex}]` 咁樣砌），Tailwind JIT 掃 source 先搵到 class 用
export type SectorCloseTheme = "green" | "red" | "orange";

export const FOCUS_BORDER: Record<SectorCloseTheme, string> = {
  green: "focus:border-[#00E676]",
  red: "focus:border-[#FF1744]",
  orange: "focus:border-[#FF9100]",
};
