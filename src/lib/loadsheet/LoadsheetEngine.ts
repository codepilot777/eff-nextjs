import { AircraftAHM560, FlightPayload } from './types';

export class LoadsheetEngine {
  private ahm: AircraftAHM560;
  private payload: FlightPayload;

  constructor(ahm: AircraftAHM560, payload: FlightPayload) {
    this.ahm = ahm;
    this.payload = payload;
  }

  /**
   * 📊 1. 實時動態重量聚合 (極簡版: DOW = BW)
   */
  public calculateWeights() {
    const DOW = this.ahm.basicData.BW;
    let paxCount = 0; let totalPaxWeight = 0; const paxWeightsBreakdown: Record<string, number> = {};

    Object.keys(this.ahm.stations.pax).forEach((zoneKey) => {
      const shortKey = zoneKey.replace("zone", "");
      const count = Number(this.payload.pax[zoneKey] ?? this.payload.pax[shortKey] ?? 0);
      paxCount += count;

      // 🌟 核心解耦：直接從 AHM 讀取該 Zone 的艙等屬性！
      const zoneClass = (this.ahm.stations.pax as any)[zoneKey].primaryClass;
      
      // J 艙用 J 的標準重 (85)，W 同 Y 艙用 Y 的標準重 (81)
      const classWeight = zoneClass === "J" ? this.payload.paxWeights.J : this.payload.paxWeights.Y;
      
      const zoneWeight = count * classWeight;
      totalPaxWeight += zoneWeight;
      paxWeightsBreakdown[zoneKey] = zoneWeight;
    });
    
    // 📦 貨艙加總
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
   * 📐 2. 實時動態重心與配平運算 (CG & Index Calculation)
   */
  public calculateCG() {
    const w = this.calculateWeights();

    // 🌟 極簡化：重心起點直接等如飛機基本指數 (BI)
    let indexZFW = this.ahm.basicData.BI;

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
 * 🤖 3. 全自動盲盒智能配載器 (極簡對齊版)
 */

export class AutoLoader {
  static generatePayload(targetZFW: number, ahm: AircraftAHM560): any {
    const remainingPayload = targetZFW - ahm.basicData.BW;
    const targetPaxWeight = remainingPayload * 0.6;
    const targetCargoWeight = remainingPayload * 0.4;
    const dynamicPax: Record<string, number> = {};
    let remainingPaxWeight = targetPaxWeight;

    const sortedZoneKeys = Object.keys(ahm.stations.pax).sort();

    sortedZoneKeys.forEach((zoneKey) => {
      const zoneInfo = (ahm.stations.pax as any)[zoneKey];
      const maxCapacity = zoneInfo.maxPax;
      
      // 🌟 核心解耦：AutoLoader 自動根據 AHM 的艙等決定填充權重
      const zoneClass = zoneInfo.primaryClass;
      const currentClassWeight = zoneClass === "J" ? 85 : 81;
      
      let neededPax = Math.round(remainingPaxWeight / currentClassWeight);
      let allocatedPax = Math.min(neededPax, maxCapacity);
      if (allocatedPax < 0) allocatedPax = 0;

      dynamicPax[zoneKey] = allocatedPax;
      remainingPaxWeight -= (allocatedPax * currentClassWeight);
    });

    // 餘下載重由貨艙填滿
    const actualPaxWeight = Object.entries(dynamicPax).reduce((sum, [k, count]) => {
      const zoneClass = (ahm.stations.pax as any)[k].primaryClass;
      const wt = zoneClass === "J" ? 85 : 81;
      return sum + (Number(count) * wt);
    }, 0);

    const exactCargoPayload = Math.max(0, remainingPayload - actualPaxWeight);

    return {
      pax: dynamicPax,
      cargo: {
        hold1: Math.round(exactCargoPayload * 0.35),
        hold2: Math.round(exactCargoPayload * 0.35),
        hold3: Math.round(exactCargoPayload * 0.15),
        hold4: Math.round(exactCargoPayload * 0.10),
        bulk:  Math.max(0, Math.round(exactCargoPayload * 0.05))
      }
    };
  }
}