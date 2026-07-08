// src/data/pmdgCommands.ts
import { MEL_TO_PMDG_MAP } from "@/data/melToPmdgMap";

// 🎯 PMDG 777 Left CDU Event IDs (從 PMDG SDK 提取)
export const CDU = {
  // 📄 頁面切換鍵 (Page Keys) - 🌟 新增 LEGS 及其他核心飛行頁面
  INIT_REF: 69972, RTE: 69973, DEP_ARR: 69974, ALTN: 69975,
  VNAV: 69976, FIX: 69977, LEGS: 69978, HOLD: 69979,
  FMC_COMM: 69980, PROG: 69981, MENU: 69982, NAV_RAD: 69983,

  // 導航與功能鍵
  PREV: 69984, NEXT: 69985, EXEC: 69986, CLR: 69987, DEL: 69987,
  
  // 左右兩排 LSK (Line Select Keys)
  L1: 69960, L2: 69961, L3: 69962, L4: 69963, L5: 69964, L6: 69965,
  R1: 69966, R2: 69967, R3: 69968, R4: 69969, R5: 69970, R6: 69971,

  // 🔢 數字鍵盤 (NumPad)
  NUM_0: 69998, NUM_1: 69988, NUM_2: 69989, NUM_3: 69990, NUM_4: 69991,
  NUM_5: 69992, NUM_6: 69993, NUM_7: 69994, NUM_8: 69995, NUM_9: 69996,
  DOT: 69997,   PLUS_MINUS: 69999
};

export interface PmdgCommand {
  id: string;
  name: string;
  category?: string;
  eventId?: number;
  macroSequence?: number[];
  severity?: "CRITICAL" | "WARNING" | "INFO";
  icon?: string;
  melRefs?: string[]; // 對應嘅 MEL code（淨係喺由 MEL map 自動生成嘅 entry 先會有）
}

// 🌟 ATA 章節（MEL code 頭兩位數字）→ Sim Control 故障分類
// 真實 ATA 章節分類，唔係亂估：每個 pmdgId group 都對應同一個 ATA chapter
const ATA_CHAPTER_TO_CATEGORY: Record<string, string> = {
  "21": "AIR", "24": "ELECTRICAL", "28": "FUEL",
  "29": "HYDRAULIC", "36": "AIR", "49": "APU", "73": "ENGINE",
};

// 🌟 由 MEL_TO_PMDG_MAP 自動推導失效清單，令呢個檔案永遠唔會同 melToPmdgMap.ts 各自修改而失步
// 呢啲 entry 冇 macroSequence/eventId —— 因為暫時未有實測過嘅 CDU 按鍵路徑
function deriveFailuresFromMelMap(): PmdgCommand[] {
  const byPmdgId = new Map<string, { pmdgTitle: string; melRefs: string[]; ataChapter: string }>();

  for (const [melCode, mapping] of Object.entries(MEL_TO_PMDG_MAP)) {
    const ataChapter = melCode.slice(0, 2);
    const entry = byPmdgId.get(mapping.pmdgId);
    if (entry) {
      entry.melRefs.push(melCode);
    } else {
      byPmdgId.set(mapping.pmdgId, { pmdgTitle: mapping.pmdgTitle, melRefs: [melCode], ataChapter });
    }
  }

  return Array.from(byPmdgId.entries()).map(([pmdgId, v]) => ({
    id: pmdgId,
    name: v.pmdgTitle,
    category: ATA_CHAPTER_TO_CATEGORY[v.ataChapter],
    melRefs: v.melRefs,
  }));
}

export const PMDG_GROUND_OPS: PmdgCommand[] = [
  { id: "door_1l", name: "Entry Door 1L", eventId: 83643, icon: "🚪" },
  { id: "cargo_fwd", name: "Fwd Cargo Door", eventId: 83653, icon: "📦" },
  { id: "ext_pwr_pri", name: "Primary EXT PWR", eventId: 69640, icon: "⚡" },
  { id: "ext_pwr_sec", name: "Secondary EXT PWR", eventId: 69639, icon: "⚡" },
];

export const PMDG_FAILURES: PmdgCommand[] = [
  {
    id: "eng1_sev_dmg",
    name: "Engine 1 Severe Damage",
    category: "ENGINE",
    macroSequence: [CDU.MENU, CDU.R5, CDU.L2, CDU.L1, CDU.L1],
    severity: "CRITICAL"
  },
  {
    id: "hyd_sys_l_leak",
    name: "Left Hyd System Leak",
    category: "HYDRAULIC",
    macroSequence: [CDU.MENU, CDU.R5, CDU.L2, CDU.L2, CDU.L1],
    severity: "WARNING"
  },
  ...deriveFailuresFromMelMap(),
];

// 🌟 俾 dualDispatchService 用嚟查返一個 MEL 對應嘅失效 entry（有冇真 macro）
export function getFailureByPmdgId(pmdgId: string): PmdgCommand | undefined {
  return PMDG_FAILURES.find((f) => f.id === pmdgId);
}

export const CDU_NAV = {
  GOTO_PAYLOAD: [CDU.MENU, CDU.R6, CDU.L1], // MENU -> FS ACTIONS -> PAYLOAD
  GOTO_FUEL:    [CDU.MENU, CDU.R6, CDU.L2], // MENU -> FS ACTIONS -> FUEL
};