// src/services/dualDispatchService.ts
import { MEL_TO_PMDG_MAP } from "@/data/melToPmdgMap";
import { getFailureByPmdgId } from "@/data/pmdgCommands";
import { fireCDUMacro, sendPMDGControl } from "@/services/pmdgService";

/**
 * 🚀 雙軌派發核心：攔截 MEL 簽發事件，自動決定是否向模擬機灌入物理故障
 */
export async function executeDualDispatch(
  melCode: string,
  sendToFSUIPC: (payload: any) => void
): Promise<{ dispatchedToSim: boolean; pmdgTitle?: string; macroPending?: boolean }> {

  // 1. 去字典查吓呢條 MEL 有冇對應嘅 PMDG 物理故障
  const mapping = MEL_TO_PMDG_MAP[melCode.trim()];

  // ❌ 找不到映射：代表呢條 MEL 無物理表現（例如客艙無熱水、廁所壞）
  if (!mapping) {
    console.log(`[🔗 Dual Dispatch] MEL ${melCode} has no physical simulation mapping. Text-Only Dispatch.`);
    return { dispatchedToSim: false };
  }

  // 🎯 搵到映射！但要再睇吓呢個失效有冇已經寫好、驗證過嘅 CDU macro
  const failure = getFailureByPmdgId(mapping.pmdgId);
  const hasRealDispatch = !!(failure?.macroSequence || failure?.eventId);

  if (!hasRealDispatch) {
    // 🌟 有 MEL 映射，但暫時未有實測過嘅按鍵路徑 —— 誠實咁話俾用家知，唔好亂射 keystroke
    console.warn(`[🔗 Dual Dispatch] MEL ${melCode} -> ${mapping.pmdgId}: mapped, no macro authored yet.`);
    return { dispatchedToSim: false, macroPending: true, pmdgTitle: mapping.pmdgTitle };
  }

  console.log(`[🔥 Dual Dispatch] MATCH FOUND! MEL ${melCode} ➔ Triggering Sim Failure: ${mapping.pmdgTitle}`);

  try {
    if (failure!.macroSequence) {
      await fireCDUMacro(sendToFSUIPC, failure!.macroSequence);
    } else if (failure!.eventId) {
      sendPMDGControl(sendToFSUIPC, failure!.eventId, 1);
    }

    return { dispatchedToSim: true, pmdgTitle: mapping.pmdgTitle };
  } catch (error) {
    console.error("[❌ Sim Dispatch Failed]", error);
    throw error;
  }
}
