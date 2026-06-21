import { AircraftAHM560, FlightPayload } from './types';

// 🌟 建立全機隊 Crew + Pantry 基礎空重與指數補償矩陣
const CREW_PANTRY_REGISTRY: Record<string, { weight: number; index: number }> = {
  "B773": { weight: 161968 - 152511 - 805, index: 741.09 - 745 - 53 },
  "B77W": { weight: 178500 - 169612 - 1339, index: 530.0 - 544.0 - 89.0 } // 👈 師兄日後可以喺度微調 B77W 的真實 Pantry 基準
};

export class LoadsheetEngine {
  private ahm: AircraftAHM560;
  private payload: FlightPayload;

  constructor(ahm: AircraftAHM560, payload: FlightPayload) {
    this.ahm = ahm;
    this.payload = payload;
  }

  // 🔍 動態獲取當前機型的 Crew + Pantry 阻尼補償
  private getCrewPantryData() {
    return CREW_PANTRY_REGISTRY[this.ahm.acType] || CREW_PANTRY_REGISTRY["B773"];
  }

  private getWaterData() {
    const table = this.ahm.potableWaterTable;
    const fraction = this.payload.waterFraction;
    return table.find(w => w.fraction === fraction) || { weight: 0, index: 0 };
  }

  /**
   * 📊 1. 實時動態重量聚合 (Weights Calculation)
   */
  public calculateWeights() {
    const water = this.getWaterData();
    const crewPantry = this.getCrewPantryData();
    
    // 基礎空重 (DOW) = 基本重量 + 乘務廚房重 + 飲用水重
    const DOW = this.ahm.basicData.BW + crewPantry.weight + water.weight;

    let paxCount = 0;
    let totalPaxWeight = 0;
    const paxWeightsBreakdown: Record<string, number> = {};

    // 👥 靈魂改造：全面改用動態 Keys 遍歷，徹底消滅 zoneOA, OB, OC, OD 硬編碼！
    Object.keys(this.ahm.stations.pax).forEach((zoneKey) => {
      // 🛡️ 超級防禦性安全相容：同時相容 "zoneOA"、"OA"、"zone0A" 三種前端可能扔進來的 Key 格式
      const shortKey = zoneKey.replace("zone", "");
      const legacyKey = zoneKey.replace("zoneO", "zone0");
      
      const count = Number(
        this.payload.pax[zoneKey] ?? 
        this.payload.pax[shortKey] ?? 
        this.payload.pax[legacyKey] ?? 
        0
      );

      paxCount += count;

      // 首區 (例如 zoneOA) 通常為頭等/商務計 J Class 重點，其餘計 Y Class 標準重
      const isFirstZone = zoneKey === "zoneOA" || zoneKey === "zone0A";
      const classWeight = isFirstZone ? this.payload.paxWeights.J : this.payload.paxWeights.Y;
      
      const zoneWeight = count * classWeight;
      totalPaxWeight += zoneWeight;
      
      // 儲存分區重量供下級 LIZFW 重心函數調用
      paxWeightsBreakdown[zoneKey] = zoneWeight;
    });
    
    // 📦 貨艙防禦性加總
    const totalCargoWeight = (this.payload.cargo.hold1 || 0) + 
                             (this.payload.cargo.hold2 || 0) + 
                             (this.payload.cargo.hold3 || 0) + 
                             (this.payload.cargo.hold4 || 0) + 
                             (this.payload.cargo.bulk || 0);

    const ZFW = DOW + totalPaxWeight + totalCargoWeight;
    const TOW = ZFW + (this.payload.fuel.takeoff || 0);
    const LAW = TOW - (this.payload.fuel.trip || 0);

    return { 
      DOW, ZFW, TOW, LAW, 
      paxCount, totalPaxWeight, totalCargoWeight,
      paxWeightsBreakdown // 👈 將動態拆解好的分箱重量傳入下級
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
   * 📐 2. 實時動態重心與配平運算 (CG & Index Calculation)
   */
  public calculateCG() {
    const w = this.calculateWeights();
    const water = this.getWaterData();
    const crewPantry = this.getCrewPantryData();

    // 重心點發出：基本指數 + Pantry 指數 + 飲用水指數
    let indexZFW = this.ahm.basicData.BI + crewPantry.index + water.index;

    // 👥 👥 靈魂改造：客艙 Index 加權全部轉為自動動態配算！
    Object.keys(this.ahm.stations.pax).forEach((zoneKey) => {
      const zoneWeight = w.paxWeightsBreakdown[zoneKey] || 0;
      const factor = this.ahm.stations.pax[zoneKey].indexFactor;
      indexZFW += this.getPayloadIndex(zoneWeight, factor);
    });

    // 📦 貨艙 Index 加權
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold1 || 0, this.ahm.stations.cargo.hold1.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold2 || 0, this.ahm.stations.cargo.hold2.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold3 || 0, this.ahm.stations.cargo.hold3.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold4 || 0, this.ahm.stations.cargo.hold4.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.bulk || 0,  this.ahm.stations.cargo.bulk.indexFactor);

    const LIZFW = indexZFW;
    const MACZFW = this.indexToMAC(w.ZFW, LIZFW);

    // ⛽ 燃油 TOW 查表
    const indexTOLR = this.interpolateTable(this.payload.fuel.tanks!.leftMain || 0, this.ahm.individualFuelTables.mainLeftRight) + 
                      this.interpolateTable(this.payload.fuel.tanks!.rightMain || 0, this.ahm.individualFuelTables.mainLeftRight);
    const indexTOCenter = this.interpolateTable(this.payload.fuel.tanks!.center || 0, this.ahm.individualFuelTables.center);
    const LITOW = LIZFW + indexTOLR + indexTOCenter;
    const MACTOW = this.indexToMAC(w.TOW, LITOW);

    // ⛽ 燃油 飛行扣減與 LAW 查表
    let burnCenter = Math.min(this.payload.fuel.trip || 0, this.payload.fuel.tanks!.center || 0);
    let remainingBurn = (this.payload.fuel.trip || 0) - burnCenter;
    let burnMain = remainingBurn / 2;

    const indexLAWLR = this.interpolateTable((this.payload.fuel.tanks!.leftMain || 0) - burnMain, this.ahm.individualFuelTables.mainLeftRight) + 
                       this.interpolateTable((this.payload.fuel.tanks!.rightMain || 0) - burnMain, this.ahm.individualFuelTables.mainLeftRight);
    const indexLAWCenter = this.interpolateTable((this.payload.fuel.tanks!.center || 0) - burnCenter, this.ahm.individualFuelTables.center);
    const LILAW = LIZFW + indexLAWLR + indexLAWCenter;
    const MACLAW = this.indexToMAC(w.LAW, LILAW);

    // 🎯 保持你原本精準的波音 777 模擬配平公式
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
 * 🤖 3. 全自動盲盒智能配載器 (AutoLoader)
 */
export class AutoLoader {
  static generatePayload(targetZFW: number, ahm: AircraftAHM560, paxStandardWeight: number = 84): any {
    const requiredPayload = targetZFW - ahm.basicData.BW;
    const targetPaxWeight = requiredPayload * 0.6;
    const targetCargoWeight = requiredPayload * 0.4;
    const totalPax = Math.round(targetPaxWeight / paxStandardWeight);
    
    const dynamicPax: Record<string, number> = {};
    let remainingPax = totalPax;

    // 🎯 核心演算法：按字母排序（Zone OA -> OB -> OC...）進行前艙向後艙的遞進式安全填充
    const sortedZoneKeys = Object.keys(ahm.stations.pax).sort();

    sortedZoneKeys.forEach((zoneKey) => {
      const maxCapacity = ahm.stations.pax[zoneKey].maxPax;
      const allocatedPax = Math.min(remainingPax, maxCapacity);
      
      // 🌟 同時生成新舊兩種 Key（例如 zoneOA 和 zone0A），雙重保險，絕對不與前端任何 Sliders 打架！
      dynamicPax[zoneKey] = allocatedPax;
      const legacyKey = zoneKey.replace("zoneO", "zone0");
      dynamicPax[legacyKey] = allocatedPax;

      remainingPax -= allocatedPax;
    });

    return {
      pax: dynamicPax, // 傳出已對齊當前飛機 layout 總數的動態人數 Record
      cargo: {
        hold1: Math.round(targetCargoWeight * 0.35),
        hold2: Math.round(targetCargoWeight * 0.35),
        hold3: Math.round(targetCargoWeight * 0.15),
        hold4: Math.round(targetCargoWeight * 0.10),
        bulk:  Math.round(targetCargoWeight * 0.05),
      }
    };
  }
}