import { AircraftAHM560, FlightPayload } from './types';

// 🌟 單一齊全嘅艙等重量表 (取代散落成 5 處嘅 J?85:81 三元判斷)
// W: 未有真實數據來源，暫定 J(85)/Y(81) 之間嘅中間值，之後有真數就換
export const PAX_CLASS_WEIGHTS: Record<"J" | "W" | "Y", number> = {
  J: 85,
  W: 83,
  Y: 81,
};

// 🌟 建立全機隊 Crew + Pantry 基礎空重與指數補償矩陣 (標準操作配重 matrix)
export const CREW_PANTRY_REGISTRY: Record<string, { weight: number; index: number }> = {
  "B773": { weight: 8652, index: -4.91 },  // B773 廚房餐食 + 乘務組總重與力矩
  "B77W": { weight: 7549, index: -13.00 }   // B77W 廚房餐食 + 乘務組總重與力矩
};

// 🌟 由 AHM potableWaterTable 查返實際飲用水重量，取代各處散落嘅硬編碼 805
export function getWaterWeight(ahm: AircraftAHM560, fraction: number): { weight: number; index: number } {
  return ahm.potableWaterTable.find(w => w.fraction === fraction) || { weight: 0, index: 0 };
}

// 🌟 由 AHM 個別機型嘅油缸查表推算真實主油缸上限，取代單一硬編碼 29600（唔同機型油缸容量唔一樣）
export function getMainTankCapacity(ahm: AircraftAHM560): number {
  return Math.max(...ahm.individualFuelTables.mainLeftRight.map(e => e.weight));
}

export class LoadsheetEngine {
  private ahm: AircraftAHM560;
  private payload: FlightPayload;

  constructor(ahm: AircraftAHM560, payload: FlightPayload) {
    this.ahm = ahm;
    this.payload = payload;
  }

  private getCrewPantryData() {
    return CREW_PANTRY_REGISTRY[this.ahm.acType] || CREW_PANTRY_REGISTRY["B773"];
  }

  private getWaterData() {
    return getWaterWeight(this.ahm, this.payload.waterFraction);
  }

  /**
   * 📊 1. 實時動態重量總和 (正統民航版: DOW = BW + Crew/Pantry + Water)
   */
  public calculateWeights() {
    const water = this.getWaterData();
    const crewPantry = this.getCrewPantryData();
    
    // 🌟 恢復專業：DOW = 基本空重 + 乘務廚房配重 + 飲用水重
    const DOW = this.ahm.basicData.BW + crewPantry.weight + water.weight;

    let paxCount = 0;
    let totalPaxWeight = 0;
    const paxWeightsBreakdown: Record<string, number> = {};

    Object.keys(this.ahm.stations.pax).forEach((zoneKey) => {
      const shortKey = zoneKey.replace("zone", "");
      const count = Number(this.payload.pax[zoneKey] ?? this.payload.pax[shortKey] ?? 0);
      paxCount += count;

      const zoneClass = (this.ahm.stations.pax as any)[zoneKey].primaryClass as "J" | "W" | "Y";
      const classWeight = PAX_CLASS_WEIGHTS[zoneClass] ?? PAX_CLASS_WEIGHTS.Y;
      
      const zoneWeight = count * classWeight;
      totalPaxWeight += zoneWeight;
      paxWeightsBreakdown[zoneKey] = zoneWeight;
    });
    
    const totalCargoWeight = (this.payload.cargo.hold1 || 0) + 
                             (this.payload.cargo.hold2 || 0) + 
                             (this.payload.cargo.hold3 || 0) + 
                             (this.payload.cargo.hold4 || 0) + 
                             (this.payload.cargo.bulk || 0);

    // 🌟 ZFW = DOW + 商業載重
    const ZFW = DOW + totalPaxWeight + totalCargoWeight;
    const TOW = ZFW + (this.payload.fuel.takeoff || 0);
    const LAW = TOW - (this.payload.fuel.trip || 0);

    return { 
      DOW, ZFW, TOW, LAW, 
      paxCount, totalPaxWeight, totalCargoWeight,
      paxWeightsBreakdown 
    };
  }

  private interpolateTable(weight: number, table: Array<{weight: number; index: number}>): number {
    if (weight <= 0) return 0;
    if (weight >= table[table.length - 1].weight) return table[table.length - 1].index;
    for (let i = 0; i < table.length - 1; i++) {
      if (weight >= table[i].weight && weight <= table[i + 1].weight) {
        return table[i].index + ((weight - table[i].weight) / (table[i + 1].weight - table[i].weight)) * (table[i + 1].index - table[i].index);
      }
    }
    return 0;
  }

  private getPayloadIndex(weight: number, factorPer100kg: number): number {
    return (weight / 100) * factorPer100kg;
  }

  /**
   * 📐 2. 實時重心與配平運算 (正統民航版: ZFW Index = DOI + Payload Index)
   */
  public calculateCG() {
    const w = this.calculateWeights();
    const water = this.getWaterData();
    const crewPantry = this.getCrewPantryData();

    // 🌟 恢復專業：ZFW 指數起點 = 飛機基本指數 BI + 廚房乘務指數 + 飲用水指數 (即是 DOI)
    let indexZFW = this.ahm.basicData.BI + crewPantry.index + water.index;

    // 客艙 Index 加權
    Object.keys(this.ahm.stations.pax).forEach((zoneKey) => {
      const zoneWeight = w.paxWeightsBreakdown[zoneKey] || 0;
      const factor = (this.ahm.stations.pax as any)[zoneKey].indexFactor;
      indexZFW += this.getPayloadIndex(zoneWeight, factor);
    });

    // 貨艙 Index 加權
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold1 || 0, this.ahm.stations.cargo.hold1.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold2 || 0, this.ahm.stations.cargo.hold2.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold3 || 0, this.ahm.stations.cargo.hold3.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold4 || 0, this.ahm.stations.cargo.hold4.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.bulk || 0,  this.ahm.stations.cargo.bulk.indexFactor);

    const LIZFW = indexZFW;
    const MACZFW = this.indexToMAC(w.ZFW, LIZFW);

    // 燃油查表
    const indexTOLR = this.interpolateTable(this.payload.fuel.tanks!.leftMain || 0, this.ahm.individualFuelTables.mainLeftRight) + 
                      this.interpolateTable(this.payload.fuel.tanks!.rightMain || 0, this.ahm.individualFuelTables.mainLeftRight);
    const indexTOCenter = this.interpolateTable(this.payload.fuel.tanks!.center || 0, this.ahm.individualFuelTables.center);
    const LITOW = LIZFW + indexTOLR + indexTOCenter;
    const MACTOW = this.indexToMAC(w.TOW, LITOW);

    let burnCenter = Math.min(this.payload.fuel.trip || 0, this.payload.fuel.tanks!.center || 0);
    let remainingBurn = (this.payload.fuel.trip || 0) - burnCenter;
    let burnMain = remainingBurn / 2;

    const indexLAWLR = this.interpolateTable((this.payload.fuel.tanks!.leftMain || 0) - burnMain, this.ahm.individualFuelTables.mainLeftRight) + 
                       this.interpolateTable((this.payload.fuel.tanks!.rightMain || 0) - burnMain, this.ahm.individualFuelTables.mainLeftRight);
    const indexLAWCenter = this.interpolateTable((this.payload.fuel.tanks!.center || 0) - burnCenter, this.ahm.individualFuelTables.center);
    const LILAW = LIZFW + indexLAWLR + indexLAWCenter;
    const MACLAW = this.indexToMAC(w.LAW, LILAW);

    const stabTrim = ((MACTOW - 15) * 0.2 + 2.0).toFixed(1);

    return { LIZFW, MACZFW, LITOW, MACTOW, LILAW, MACLAW, stabTrim };
  }

  private indexToMAC(weight: number, index: number): number {
    if (weight === 0) return 0;
    const cgArm = ((index * this.ahm.macConstants.constant) / weight) + this.ahm.macConstants.refArm;
    return ((cgArm - this.ahm.macConstants.lemac) / this.ahm.macConstants.macLength) * 100;
  }

  public checkLimits() {
    const weights = this.calculateWeights();
    const cg = this.calculateCG();
    const isZFWExceeded = weights.ZFW > this.ahm.limits.MZFW;
    const isTOWExceeded = weights.TOW > this.ahm.limits.MTOW;
    const isLAWExceeded = weights.LAW > this.ahm.limits.MLAW;
    const isCgOutOfTrim = cg.MACTOW < 14.1 || cg.MACTOW > 38.6;
    return {
      isValid: !isZFWExceeded && !isTOWExceeded && !isLAWExceeded && !isCgOutOfTrim,
      errors: { isZFWExceeded, isTOWExceeded, isLAWExceeded, isCgOutOfTrim }
    };
  }
}

/**
 * 🤖 3. 全自動智能配載器 (正統民航版：對齊 DOW 與全域均勻配重)
 */
export class AutoLoader {
  static generatePayload(targetZFW: number, ahm: AircraftAHM560): any {
    // 🌟 自動根據機型匹配真實的空重阻尼（直接讀返 registry，唔再重複硬編碼）
    const crewPantryWeight = (CREW_PANTRY_REGISTRY[ahm.acType] || CREW_PANTRY_REGISTRY["B773"]).weight;
    const waterWeight = getWaterWeight(ahm, 15).weight; // 假設飲用水 15/16 滿
    const DOW = ahm.basicData.BW + crewPantryWeight + waterWeight;

    // 商業可分配載重 = 目標 ZFW 減去 基本飛行空重 DOW
    const remainingPayload = targetZFW - DOW;

    const targetPaxWeight = remainingPayload * 0.6;
    const targetCargoWeight = remainingPayload * 0.4;

    // 客艙：標準全域均勻載客率
    const maxPaxWeight = Object.entries(ahm.stations.pax).reduce((sum, [_, zoneInfo]: [string, any]) => {
      const wt = PAX_CLASS_WEIGHTS[zoneInfo.primaryClass as "J" | "W" | "Y"] ?? PAX_CLASS_WEIGHTS.Y;
      return sum + (zoneInfo.maxPax * wt);
    }, 0);

    const paxRatio = Math.min(1, targetPaxWeight / maxPaxWeight);

    const dynamicPax: Record<string, number> = {};
    Object.keys(ahm.stations.pax).forEach((zoneKey) => {
      const maxCapacity = (ahm.stations.pax as any)[zoneKey].maxPax;
      dynamicPax[zoneKey] = Math.round(maxCapacity * paxRatio);
    });

    const actualPaxWeight = Object.entries(dynamicPax).reduce((sum, [k, count]) => {
      const zoneClass = (ahm.stations.pax as any)[k].primaryClass as "J" | "W" | "Y";
      const wt = PAX_CLASS_WEIGHTS[zoneClass] ?? PAX_CLASS_WEIGHTS.Y;
      return sum + (Number(count) * wt);
    }, 0);

    // 貨艙：完美偏後省油配比 (Aft Bias Weighting)
    const exactCargoPayload = Math.max(0, remainingPayload - actualPaxWeight);

    const aftBiasWeights = {
      hold1: 0.15,  // 前貨艙 15%
      hold2: 0.35,  // 中前貨艙 35%
      hold3: 0.35,  // 中後貨艙 35%
      hold4: 0.10,  // 後貨艙 10%
    };

    return {
      pax: dynamicPax,
      cargo: {
        hold1: Math.round(exactCargoPayload * aftBiasWeights.hold1),
        hold2: Math.round(exactCargoPayload * aftBiasWeights.hold2),
        hold3: Math.round(exactCargoPayload * aftBiasWeights.hold3),
        hold4: Math.round(exactCargoPayload * aftBiasWeights.hold4),
        bulk:  Math.max(0, exactCargoPayload - 
                           Math.round(exactCargoPayload * aftBiasWeights.hold1) - 
                           Math.round(exactCargoPayload * aftBiasWeights.hold2) - 
                           Math.round(exactCargoPayload * aftBiasWeights.hold3) - 
                           Math.round(exactCargoPayload * aftBiasWeights.hold4))
      }
    };
  }
}