import { AircraftAHM560, FlightPayload } from './types';

export class LoadsheetEngine {
  private ahm: AircraftAHM560;
  private payload: FlightPayload;
  
  // 假設 Crew 同 Pantry 嘅基本重量同指數 (扣除食水)
  private baseCrewPantryWeight = 161968 - 152511 - 805; // 舉例：(DOW - BW - 15/16 Water)
  private baseCrewPantryIndex = 741.09 - 745 - 53;      // 舉例：(DOI - BI - 15/16 Water Index)

  constructor(ahm: AircraftAHM560, payload: FlightPayload) {
    this.ahm = ahm;
    this.payload = payload;
  }

  // ==========================================
  // 🚰 1. 取得動態食水數據
  // ==========================================
  private getWaterData() {
    const table = this.ahm.potableWaterTable;
    const fraction = this.payload.waterFraction;
    
    // 搵對應嘅 n/16 食水重量同指數
    const waterEntry = table.find(w => w.fraction === fraction) || { weight: 0, index: 0 };
    return waterEntry;
  }

  // ==========================================
  // ⚖️ 2. 計算 Weights (動態計入 DOW)
  // ==========================================
  public calculateWeights() {
    const water = this.getWaterData();
    // 動態 DOW = Basic Weight + Crew/Pantry + 動態食水
    const DOW = this.ahm.basicData.BW + this.baseCrewPantryWeight + water.weight;

    // 🌟 補回總人數計算
    const paxCount = this.payload.pax.zoneOA + this.payload.pax.zoneOB + 
                     this.payload.pax.zoneOC + this.payload.pax.zoneOD;

    const weightOA = this.payload.pax.zoneOA * this.payload.paxWeights.J;
    const weightOB = this.payload.pax.zoneOB * this.payload.paxWeights.Y;
    const weightOC = this.payload.pax.zoneOC * this.payload.paxWeights.Y;
    const weightOD = this.payload.pax.zoneOD * this.payload.paxWeights.Y;
    
    // 🌟 補回總客重
    const totalPaxWeight = weightOA + weightOB + weightOC + weightOD;
    
    // 🌟 補回總貨重
    const totalCargoWeight = this.payload.cargo.hold1 + this.payload.cargo.hold2 + 
                             this.payload.cargo.hold3 + this.payload.cargo.hold4 + this.payload.cargo.bulk;

    const ZFW = DOW + totalPaxWeight + totalCargoWeight;
    const TOW = ZFW + this.payload.fuel.takeoff;
    const LAW = TOW - this.payload.fuel.trip;

    // 🌟 確保 Return 返晒所有 Frontend 需要用到嘅變數！
    return { 
      DOW, ZFW, TOW, LAW, 
      weightOA, weightOB, weightOC, weightOD, 
      paxCount, totalPaxWeight, totalCargoWeight 
    };
  }

  // ==========================================
  // 🧮 3. 共用查表 Function (線性插值)
  // ==========================================
  private interpolateTable(weight: number, table: Array<{weight: number; index: number}>): number {
    if (weight <= 0) return 0;
    if (weight >= table[table.length - 1].weight) return table[table.length - 1].index;

    for (let i = 0; i < table.length - 1; i++) {
      if (weight >= table[i].weight && weight <= table[i + 1].weight) {
        const w1 = table[i].weight, w2 = table[i + 1].weight;
        const i1 = table[i].index, i2 = table[i + 1].index;
        return i1 + ((weight - w1) / (w2 - w1)) * (i2 - i1);
      }
    }
    return 0;
  }

  private getPayloadIndex(weight: number, factorPer100kg: number): number {
    return (weight / 100) * factorPer100kg;
  }

  // ==========================================
  // 🎯 4. 終極重心與 %MAC 推演 (包含 Non-Standard Fuel Logic)
  // ==========================================
  public calculateCG() {
    const w = this.calculateWeights();
    const water = this.getWaterData();
    
    // --- 階段 1：ZERO FUEL WEIGHT (ZFW) ---
    // 🌟 動態 DOI = Basic Index + Crew/Pantry Index + 動態食水 Index
    let indexZFW = this.ahm.basicData.BI + this.baseCrewPantryIndex + water.index;

    indexZFW += this.getPayloadIndex(w.weightOA, this.ahm.stations.pax.zoneOA.indexFactor);
    indexZFW += this.getPayloadIndex(w.weightOB, this.ahm.stations.pax.zoneOB.indexFactor);
    indexZFW += this.getPayloadIndex(w.weightOC, this.ahm.stations.pax.zoneOC.indexFactor);
    indexZFW += this.getPayloadIndex(w.weightOD, this.ahm.stations.pax.zoneOD.indexFactor);

    indexZFW += this.getPayloadIndex(this.payload.cargo.hold1, this.ahm.stations.cargo.hold1.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold2, this.ahm.stations.cargo.hold2.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold3, this.ahm.stations.cargo.hold3.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.hold4, this.ahm.stations.cargo.hold4.indexFactor);
    indexZFW += this.getPayloadIndex(this.payload.cargo.bulk,  this.ahm.stations.cargo.bulk.indexFactor);

    const LIZFW = indexZFW;
    const MACZFW = this.indexToMAC(w.ZFW, LIZFW);

    // --- 階段 2 & 3：燃油計算 (支援 Standard 與 Non-Standard) ---
    let LITOW = 0, LILAW = 0;

    if (this.payload.fuel.isStandard) {
      // ✅ 情況 A：Standard Distribution (直接用 Image 3 Table)
      LITOW = LIZFW + this.interpolateTable(this.payload.fuel.takeoff, this.ahm.fuelTable);
      LILAW = LITOW - this.interpolateTable(this.payload.fuel.trip, this.ahm.fuelTable);
      
    } else {
      // ⚠️ 情況 B：Non-Standard Distribution
      const tanks = this.payload.fuel.tanks!;
      
      // 1. 計算 Takeoff Fuel Index (L & R Main Table + Center Table)
      const indexTOLR = this.interpolateTable(tanks.leftMain, this.ahm.individualFuelTables.mainLeftRight) + 
                        this.interpolateTable(tanks.rightMain, this.ahm.individualFuelTables.mainLeftRight);
      const indexTOCenter = this.interpolateTable(tanks.center, this.ahm.individualFuelTables.center);
      
      LITOW = LIZFW + indexTOLR + indexTOCenter;

      // 2. 模擬 B777 燒油邏輯 (Burn-off sequence: Center 優先燒完，然後 Left/Right 均勻燒)
      let burnCenter = 0;
      let burnMain = 0; // Each side

      if (this.payload.fuel.trip <= tanks.center) {
        // 如果 Trip Fuel 少過 Center Tank 油量，只燒 Center
        burnCenter = this.payload.fuel.trip;
        burnMain = 0;
      } else {
        // Center 燒乾，剩餘由 Main L/R 分擔
        burnCenter = tanks.center;
        const remainingBurn = this.payload.fuel.trip - burnCenter;
        burnMain = remainingBurn / 2;
      }

      // 3. 計算 Arrival 剩餘油量
      const arrLeftMain = tanks.leftMain - burnMain;
      const arrRightMain = tanks.rightMain - burnMain;
      const arrCenter = tanks.center - burnCenter;

      // 4. 計算 Landing Fuel Index
      const indexLAWLR = this.interpolateTable(arrLeftMain, this.ahm.individualFuelTables.mainLeftRight) + 
                         this.interpolateTable(arrRightMain, this.ahm.individualFuelTables.mainLeftRight);
      const indexLAWCenter = this.interpolateTable(arrCenter, this.ahm.individualFuelTables.center);

      // Landing 重心 = ZFW 重心 + 到步油量重心
      LILAW = LIZFW + indexLAWLR + indexLAWCenter;
    }

    const MACTOW = this.indexToMAC(w.TOW, LITOW);
    const MACLAW = this.indexToMAC(w.LAW, LILAW);

    const stabTrim = ((MACTOW - 15) * 0.2 + 2.0).toFixed(1);

    return { w, LIZFW, MACZFW, LITOW, MACTOW, LILAW, MACLAW, stabTrim };
  }

  // MAC 轉換常數
  // ==========================================
  // 🔄 4. Index -> CG Arm -> %MAC 轉換器 (已修正)
  // ==========================================
  private indexToMAC(weight: number, index: number): number {
    if (weight === 0) return 0;
    
    // 🌟 修正 1：絕對唔可以減 BI！Total Index 已經係 Total Moment！
    // 物理公式：CG = (Total Index * Constant / Total Weight) + RefArm
    const cgArm = ((index * this.ahm.macConstants.constant) / weight) + this.ahm.macConstants.refArm;
    
    // 將 CG 位置轉化為 MAC 百分比
    const percentMAC = ((cgArm - this.ahm.macConstants.lemac) / this.ahm.macConstants.macLength) * 100;
    
    return percentMAC;
  }
}