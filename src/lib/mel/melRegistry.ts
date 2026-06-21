// lib/mel/melRegistry.ts

import rawMelData from "./B777_MEL.json";

// 🔧 1. 嚴格定義航空公司級別的 MEL 數據結構
export interface MelItem {
  ataChapter: string;
  ataCode: string;
  title: string;
  category: "A" | "B" | "C" | "D";
  installed: number;
  required: number;
  operationalProcedures: boolean;
  maintenanceProcedures: boolean;
  remarks: string;
  maintenanceNote: string;         // 🛠️ 供工程師自動 Pre-fill 紀錄
  companyMaintenanceNote: string;  // 🏢 航司附加維修備註
  operationsNote: string;          // 🤫 供教官考核/學生查閱的放行限制
}

// 2. 將原始 JSON 強制轉型為以 ataCode 為 Key 嘅強型別對象
const FULL_MEL_DATABASE = rawMelData as Record<string, MelItem>;

/**
 * 🔍 接口 A：根據 ATA Code（例如 "49-11-01" 或 "21-31-01"）一秒鐘極速直取條款
 */
export const getMelItem = (ataCode: string): MelItem | null => {
  if (!ataCode) return null;
  return FULL_MEL_DATABASE[ataCode.trim().toUpperCase()] || null;
};

/**
 * 📑 接口 B：獲取全機所有 MEL 項目清單（供下拉選單或搜尋使用）
 */
export const getAllMelItems = (): MelItem[] => {
  return Object.values(FULL_MEL_DATABASE);
};

/**
 * 🔎 接口 C：智能模糊搜尋（打 "APU" 或者是 "Valv" 自動篩選出對應條款）
 */
export const searchMelItems = (keyword: string): MelItem[] => {
  const upperKey = keyword.toUpperCase();
  return Object.values(FULL_MEL_DATABASE).filter(
    (item) =>
      item.ataCode.includes(upperKey) || 
      item.title.toUpperCase().includes(upperKey)
  );
};