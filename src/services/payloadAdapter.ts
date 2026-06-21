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
 * ✈️ Payload Adapter 跨界適配大腦 (全動態自適應版)
 * @param efbLoadingData 來自前端/DB 的實時分區配載數據
 * @param reg 飛機註冊編號 (例如 "B-HNQ" 或 "B-KPA")
 */
export function adaptEfbPayloadToPmdg(efbLoadingData: any, reg: string): PmdgPayloadOutput {
  const acConfig = AIRCRAFT_REGISTRY[reg.toUpperCase()];
  
  if (!acConfig) {
    throw new Error(`[Adapter Error] Aircraft registration ${reg} not found in registry.`);
  }

  // 初始化 PMDG 3 大客艙的小數累加器 (防止四捨五入提早斷差)
  let pmdgFwdCabinAcc = 0;
  let pmdgMidCabinAcc = 0;
  let pmdgAftCabinAcc = 0;

  // 1️⃣ 👥 核心解耦算法：動態客艙遍歷 (通殺 4-Zone / 5-Zone 布局)
  const paxWeights = efbLoadingData?.paxWeights || {};
  
  Object.keys(acConfig.stations.pax).forEach((zoneKey) => {
    const currentZoneWeight = paxWeights[zoneKey] || 0;
    const indexFactor = acConfig.stations.pax[zoneKey].indexFactor;

    // 💡 降維打擊黑魔法：利用 AHM 內置的 Index Factor 進行動態線性滑動融合
    // 基準定錨：PMDG 物理模型中，FWD 設在 -5 點，MID 設在 0 點，AFT 設在 +4 點
    if (indexFactor < 0) {
      // 🔴 負力臂（前段機身）：在前艙與中艙之間動態按比例切分
      const fwdRatio = -indexFactor / 5; // 當力臂為 -5 時權重為 1.0 (100%前艙)；力臂為 -2 時為 0.4 (40%前, 60%中)
      pmdgFwdCabinAcc += currentZoneWeight * fwdRatio;
      pmdgMidCabinAcc += currentZoneWeight * (1 - fwdRatio);
    } else {
      // 🔵 正力臂（後段機身）：在中艙與後艙之間動態按比例切分
      const aftRatio = indexFactor / 4;  // 當力臂為 +4 時權重為 1.0 (100%後艙)；力臂為 +1 時為 0.25 (25%後, 75%中)
      pmdgAftCabinAcc += currentZoneWeight * aftRatio;
      pmdgMidCabinAcc += currentZoneWeight * (1 - aftRatio);
    }
  });

  // 2️⃣ 📦 核心動態算法：貨艙安全讀取 (防止 Key 遺漏爆出 NaN / Undefined)
  const cargoWeights = efbLoadingData?.cargoWeights || {};
  
  const hold1 = cargoWeights.hold1 || 0;
  const hold2 = cargoWeights.hold2 || 0;
  const hold3 = cargoWeights.hold3 || 0;
  const hold4 = cargoWeights.hold4 || 0;
  const bulk  = cargoWeights.bulk  || 0;

  // PMDG 777 FMC 前貨艙 (Hold 1+2) ; 後貨艙 (Hold 3+4) ; Bulk 獨立
  const pmdgFwdCargo = Math.round(hold1 + hold2);
  const pmdgAftCargo = Math.round(hold3 + hold4);
  const pmdgBulkCargo = Math.round(bulk);

  // 3️⃣ 🎯 最終整數規整與總重量校對
  const finalFwdCabin = Math.round(pmdgFwdCabinAcc);
  const finalMidCabin = Math.round(pmdgMidCabinAcc);
  const finalAftCabin = Math.round(pmdgAftCabinAcc);

  const totalPayloadKg = finalFwdCabin + finalMidCabin + finalAftCabin + pmdgFwdCargo + pmdgAftCargo + pmdgBulkCargo;

  return {
    paxCabins: {
      fwd: finalFwdCabin,
      mid: finalMidCabin,
      aft: finalAftCabin
    },
    cargoHolds: {
      fwd: pmdgFwdCargo,
      aft: pmdgAftCargo,
      bulk: pmdgBulkCargo
    },
    totalPayloadKg
  };
}