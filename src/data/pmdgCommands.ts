// 🎯 PMDG 777 Left CDU Event IDs (從 PMDG SDK 提取)
export const CDU = {
  // 導航與功能鍵
  MENU: 69982, NEXT: 69985, PREV: 69984, CLR: 69987, DEL: 69987, EXEC: 69986,
  
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
  }
];

export const CDU_NAV = {
  GOTO_PAYLOAD: [CDU.MENU, CDU.R6, CDU.L1], // MENU -> FS ACTIONS -> PAYLOAD
  GOTO_FUEL:    [CDU.MENU, CDU.R6, CDU.L2], // MENU -> FS ACTIONS -> FUEL
};