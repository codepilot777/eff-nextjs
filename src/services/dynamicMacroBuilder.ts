import { CDU } from "@/data/pmdgCommands";
import { PmdgPayloadOutput } from "./payloadAdapter";

/**
 * ⌨️ 基礎打字機：將數字/字串轉換為 CDU 按鍵序列
 * @param value 要輸入的數值 (例如: 14500.5)
 * @param targetLsk 目標輸入位 (例如: CDU.L4)
 * @param addClear 是否在輸入前撳一下 CLR (清除 Scratchpad 的錯誤訊息)
 */
export function buildTypingSequence(value: string | number, targetLsk: number, addClear: boolean = true): number[] {
  const sequence: number[] = [];
  
  // 防呆：撳一下 CLR 清除 Scratchpad 可能殘留嘅 "INVALID ENTRY"
  if (addClear) sequence.push(CDU.CLR);

  const strValue = String(value);

  // 逐個字元拆解並轉譯為 PMDG Event ID
  for (const char of strValue) {
    switch (char) {
      case '0': sequence.push(CDU.NUM_0); break;
      case '1': sequence.push(CDU.NUM_1); break;
      case '2': sequence.push(CDU.NUM_2); break;
      case '3': sequence.push(CDU.NUM_3); break;
      case '4': sequence.push(CDU.NUM_4); break;
      case '5': sequence.push(CDU.NUM_5); break;
      case '6': sequence.push(CDU.NUM_6); break;
      case '7': sequence.push(CDU.NUM_7); break;
      case '8': sequence.push(CDU.NUM_8); break;
      case '9': sequence.push(CDU.NUM_9); break;
      case '.': sequence.push(CDU.DOT); break;
      case '-': sequence.push(CDU.PLUS_MINUS); break;
      default: console.warn(`[MacroBuilder] Unsupported character: ${char}`); break;
    }
  }

  // 最後㩒 LSK 將 Scratchpad 嘅數字隊入去
  sequence.push(targetLsk);

  return sequence;
}

/**
 * ⚖️ 高階連技：生成完整 Payload 注入序列 (3-Cabin + 3-Hold)
 * 假設前提：FMC 畫面已經停留在 FS ACTIONS -> PAYLOAD 頁面
 * @param payload 經過 payloadAdapter 計算後的三艙三艙重
 */
export function buildFullPayloadMacro(payload: PmdgPayloadOutput): number[] {
  let fullSequence: number[] = [];

  console.log("👻 [Ghost Pilot] Compiling Payload Macro...");

  // 1. 打字入 FWD Cabin (LSK 1L)
  fullSequence = fullSequence.concat(buildTypingSequence(payload.paxCabins.fwd, CDU.L1));
  // 2. 打字入 MID Cabin (LSK 2L)
  fullSequence = fullSequence.concat(buildTypingSequence(payload.paxCabins.mid, CDU.L2, false)); // 之後唔使再 CLR
  // 3. 打字入 AFT Cabin (LSK 3L)
  fullSequence = fullSequence.concat(buildTypingSequence(payload.paxCabins.aft, CDU.L3, false));

  // 4. 打字入 FWD Cargo (LSK 4L)
  fullSequence = fullSequence.concat(buildTypingSequence(payload.cargoHolds.fwd, CDU.L4, false));
  // 5. 打字入 AFT Cargo (LSK 5L)
  fullSequence = fullSequence.concat(buildTypingSequence(payload.cargoHolds.aft, CDU.L5, false));
  // 6. 打字入 BULK Cargo (LSK 6L)
  fullSequence = fullSequence.concat(buildTypingSequence(payload.cargoHolds.bulk, CDU.L6, false));

  return fullSequence;
}

/**
 * ⛽ 高階連技：生成 Fuel 注入序列
 * 假設前提：FMC 畫面已經停留在 FS ACTIONS -> FUEL 頁面
 * @param totalFuelTons 目標燃油總重 (例如 42.4)
 */
export function buildFuelMacro(totalFuelTons: string | number): number[] {
  console.log(`👻 [Ghost Pilot] Compiling Fuel Macro for ${totalFuelTons}T...`);
  // 通常 PMDG 777 Fuel 頁面，入 Total KGS / LBS 係喺 LSK 1L
  // 假設我哋打 "42400" (kg) 落 LSK 1L
  const fuelKg = Math.round(Number(totalFuelTons) * 1000);
  return buildTypingSequence(fuelKg, CDU.L1);
}