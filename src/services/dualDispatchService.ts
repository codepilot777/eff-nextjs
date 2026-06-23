// src/services/dualDispatchService.ts
import { MEL_TO_PMDG_MAP } from "@/data/melToPmdgMap";
import { fireCDUMacro } from "@/services/pmdgService";
import { CDU } from "@/data/pmdgCommands";

/**
 * 🚀 雙軌派發核心：攔截 MEL 簽發事件，自動決定是否向模擬機灌入物理故障
 */
export async function executeDualDispatch(
  melCode: string, 
  sendToFSUIPC: (payload: any) => void
): Promise<{ dispatchedToSim: boolean; pmdgTitle?: string }> {
  
  // 1. 去字典查吓呢條 MEL 有冇對應嘅 PMDG 物理故障
  const mapping = MEL_TO_PMDG_MAP[melCode.trim()];
  
  // ❌ 找不到映射：代表呢條 MEL 無物理表現（例如客艙無熱水、廁所壞）
  if (!mapping) {
    console.log(`[🔗 Dual Dispatch] MEL ${melCode} has no physical simulation mapping. Text-Only Dispatch.`);
    return { dispatchedToSim: false };
  }

  // 🎯 搵到映射！啟動「幽靈副機長」按鍵連技
  console.log(`[🔥 Dual Dispatch] MATCH FOUND! MEL ${melCode} ➔ Triggering Sim Failure: ${mapping.pmdgTitle}`);

  try {
    // 💡 這裡就是日後對接 PMDG CDU Failures 頁面的 Macro 連技
    // 模擬人手按鍵：MENU ➔ 進入 FAILURES ➔ 選擇對應系統 ➔ 按下 ARMED/ACTIVE
    const failureSequence = [
      CDU.MENU, 
      CDU.R6, // 假設 R6 進入 FS ACTIONS
      // ... 這裡會根據 mapping.pmdgId 自動配對它在 FMC 內部的具體頁面和按鍵路徑
    ];

    // 射擊！灌入 FSUIPC
    await fireCDUMacro(sendToFSUIPC, failureSequence);
    
    return { dispatchedToSim: true, pmdgTitle: mapping.pmdgTitle };
  } catch (error) {
    console.error("[❌ Sim Dispatch Failed]", error);
    throw error;
  }
}