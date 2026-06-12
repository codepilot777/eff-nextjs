import { AircraftAHM560, FlightPayload } from './types';

export class LoadsheetEngine {
  private ahm: AircraftAHM560;
  private payload: FlightPayload;
  private baseCrewPantryWeight = 161968 - 152511 - 805; 
  private baseCrewPantryIndex = 741.09 - 745 - 53;      

  constructor(ahm: AircraftAHM560, payload: FlightPayload) {
    this.ahm = ahm;
    this.payload = payload;
  }

  private getWaterData() {
    const table = this.ahm.potableWaterTable;
    const fraction = this.payload.waterFraction;
    return table.find(w => w.fraction === fraction) || { weight: 0, index: 0 };
  }

  public calculateWeights() {
    const water = this.getWaterData();
    const DOW = this.ahm.basicData.BW + this.baseCrewPantryWeight + water.weight;

    const paxCount = this.payload.pax.zoneOA + this.payload.pax.zoneOB + this.payload.pax.zoneOC + this.payload.pax.zoneOD;
    const weightOA = this.payload.pax.zoneOA * this.payload.paxWeights.J;
    const weightOB = this.payload.pax.zoneOB * this.payload.paxWeights.Y;
    const weightOC = this.payload.pax.zoneOC * this.payload.paxWeights.Y;
    const weightOD = this.payload.pax.zoneOD * this.payload.paxWeights.Y;
    const totalPaxWeight = weightOA + weightOB + weightOC + weightOD;
    
    const totalCargoWeight = this.payload.cargo.hold1 + this.payload.cargo.hold2 + 
                             this.payload.cargo.hold3 + this.payload.cargo.hold4 + this.payload.cargo.bulk;

    const ZFW = DOW + totalPaxWeight + totalCargoWeight;
    const TOW = ZFW + this.payload.fuel.takeoff;
    const LAW = TOW - this.payload.fuel.trip;

    return { DOW, ZFW, TOW, LAW, weightOA, weightOB, weightOC, weightOD, paxCount, totalPaxWeight, totalCargoWeight };
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

  public calculateCG() {
    const w = this.calculateWeights();
    const water = this.getWaterData();
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

    const indexTOLR = this.interpolateTable(this.payload.fuel.tanks!.leftMain, this.ahm.individualFuelTables.mainLeftRight) + 
                      this.interpolateTable(this.payload.fuel.tanks!.rightMain, this.ahm.individualFuelTables.mainLeftRight);
    const indexTOCenter = this.interpolateTable(this.payload.fuel.tanks!.center, this.ahm.individualFuelTables.center);
    const LITOW = LIZFW + indexTOLR + indexTOCenter;
    const MACTOW = this.indexToMAC(w.TOW, LITOW);

    let burnCenter = Math.min(this.payload.fuel.trip, this.payload.fuel.tanks!.center);
    let remainingBurn = this.payload.fuel.trip - burnCenter;
    let burnMain = remainingBurn / 2;

    const indexLAWLR = this.interpolateTable(this.payload.fuel.tanks!.leftMain - burnMain, this.ahm.individualFuelTables.mainLeftRight) + 
                       this.interpolateTable(this.payload.fuel.tanks!.rightMain - burnMain, this.ahm.individualFuelTables.mainLeftRight);
    const indexLAWCenter = this.interpolateTable(this.payload.fuel.tanks!.center - burnCenter, this.ahm.individualFuelTables.center);
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

// 🤖 自動配載器 (AutoLoader)
export class AutoLoader {
  static generatePayload(targetZFW: number, ahm: AircraftAHM560, paxStandardWeight: number = 84): any {
    const requiredPayload = targetZFW - ahm.basicData.BW;
    const targetPaxWeight = requiredPayload * 0.6;
    const targetCargoWeight = requiredPayload * 0.4;
    const totalPax = Math.round(targetPaxWeight / paxStandardWeight);
    
    const pax = { zone0A: 0, zone0B: 0, zone0C: 0, zone0D: 0 };
    let remainingPax = totalPax;
    pax.zone0A = Math.min(remainingPax, ahm.stations.pax.zoneOA.maxPax); remainingPax -= pax.zone0A;
    pax.zone0B = Math.min(remainingPax, ahm.stations.pax.zoneOB.maxPax); remainingPax -= pax.zone0B;
    pax.zone0C = Math.min(remainingPax, ahm.stations.pax.zoneOC.maxPax); remainingPax -= pax.zone0C;
    pax.zone0D = Math.min(remainingPax, ahm.stations.pax.zoneOD.maxPax);

    return {
      pax: { zone0A: pax.zone0A, zone0B: pax.zone0B, zone0C: pax.zone0C, zone0D: pax.zone0D },
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