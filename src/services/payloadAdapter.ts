import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";

export interface PmdgPayloadOutput {
  paxCabins: {
    fwd: number; // 填入 PMDG FMC LSK 1L (FWD CABIN)
    mid: number; // 填入 PMDG FMC LSK 2L (MID CABIN)
    aft: number; // 填入 PMDG FMC LSK 3L (AFT CABIN)
  };
  cargoHolds: {
    fwd: number;  // 填入 PMDG FMC LSK 4L (FWD CARGO)
    aft: number;  // 填入 PMDG FMC LSK 5L (AFT CARGO)
    bulk: number; // 填入 PMDG FMC LSK 6L (BULK CARGO)
  };
  totalPayloadKg: number;
}

/**
 * ✈️ Payload Adapter 跨界適配大腦
 * @param efbLoadingData 來自你前端/DB 的實時分區配載數據 (單位: kg 或人數，此處假設傳入已計好嘅總重量 kg)
 * @param reg 飛機註冊編號 (例如 "B-HNQ")
 */
export function adaptEfbPayloadToPmdg(efbLoadingData: any, reg: string): PmdgPayloadOutput {
  const acConfig = AIRCRAFT_REGISTRY[reg];
  
  if (!acConfig) {
    throw new Error(`[Adapter Error] Aircraft registration ${reg} not found in registry.`);
  }

  // 1️⃣ 提取 EFB 客艙分區重量 (假設前端已經將人數 * 標准體重計好咗各 Zone 的總 kg)
  const zoneOA = efbLoadingData?.paxWeights?.zoneOA || 0;
  const zoneOB = efbLoadingData?.paxWeights?.zoneOB || 0;
  const zoneOC = efbLoadingData?.paxWeights?.zoneOC || 0;
  const zoneOD = efbLoadingData?.paxWeights?.zoneOD || 0;

  // 2️⃣ 提取 EFB 貨艙分區重量 (單位: kg)
  const hold1 = efbLoadingData?.cargoWeights?.hold1 || 0;
  const hold2 = efbLoadingData?.cargoWeights?.hold2 || 0;
  const hold3 = efbLoadingData?.cargoWeights?.hold3 || 0;
  const hold4 = efbLoadingData?.cargoWeights?.hold4 || 0;
  const bulk  = efbLoadingData?.cargoWeights?.bulk  || 0;

  // ========================================================
  // 🎯 核心算法：4-Zone Pax 歸納為 3-Cabin PMDG Slots
  // 根據 AHM560 的 Index Factor (力臂方向)，進行物理分配：
  // Zone OA (-5) 絕對是 FWD; Zone OD (+4) 絕對是 AFT
  // 中間的 OB (-2) 同 OC (+1) 採取交叉加權分配，以保護重心 (CG) 趨勢
  // ========================================================
  const pmdgFwdCabin = Math.round(zoneOA + (zoneOB * 0.3));
  const pmdgMidCabin = Math.round((zoneOB * 0.7) + (zoneOC * 0.6));
  const pmdgAftCabin = Math.round((zoneOC * 0.4) + zoneOD);

  // ========================================================
  // 🎯 核心算法：5-Hold Cargo 歸納為 3-Hold PMDG Slots
  // PMDG 777 FMC 的前貨艙對應 Hold 1+2; 後貨艙對應 Hold 3+4; Bulk 獨立
  // ========================================================
  const pmdgFwdCargo = Math.round(hold1 + hold2);
  const pmdgAftCargo = Math.round(hold3 + hold4);
  const pmdgBulkCargo = Math.round(bulk);

  // 3️⃣ 計算總重，作最終校對
  const totalPayloadKg = pmdgFwdCabin + pmdgMidCabin + pmdgAftCabin + pmdgFwdCargo + pmdgAftCargo + pmdgBulkCargo;

  return {
    paxCabins: {
      fwd: pmdgFwdCabin,
      mid: pmdgMidCabin,
      aft: pmdgAftCabin
    },
    cargoHolds: {
      fwd: pmdgFwdCargo,
      aft: pmdgAftCargo,
      bulk: pmdgBulkCargo
    },
    totalPayloadKg
  };
}