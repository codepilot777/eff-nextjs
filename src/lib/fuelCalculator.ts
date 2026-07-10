// 🌟 src/utils/fuelCalculator.ts

export function calculateFuelEngine(flightData: any) {
  const rawSb = flightData?.raw_simbrief || {};
  
  // ==========================================
  // 1. Alternates & 選項設定
  // ==========================================
  const alternates = flightData?.alternates || [];
  const altnList = alternates.length > 0 ? alternates : [{ icao: flightData?.altn_icao || 'N/A', burn: flightData?.fuel_altn_ofp || 0.0, time: 30 }];
  const altnOptions = altnList.map((a: any) => a.icao);
  const selectedAltn = flightData?.selected_altn || altnOptions[0] || 'N/A';
  
  const baseAltnOfp = altnList.find((a: any) => a.icao === selectedAltn)?.burn || flightData?.fuel_altn_ofp || 0.0;
  const currAltnOfp = baseAltnOfp; 

  // ==========================================
  // 2. OFP 原始數據 (Planned Baseline)
  // ==========================================
  const ofpZfw = flightData?.weight_zfw_ofp || 0.0;
  const ofpTaxi = flightData?.fuel_taxi_ofp || 0.0;
  const ofpTrip = flightData?.fuel_trip_ofp || 0.0;
  const ofpCont = flightData?.fuel_cont_ofp || 0.0;
  const ofpRes = flightData?.fuel_reserve_ofp || 0.0;
  
  // 確保 OFP 基礎變數有定義
  const ofpReqdBase = ofpTaxi + ofpTrip + ofpCont + baseAltnOfp + ofpRes;
  const ofpTotal = ofpReqdBase; 
  
  // ==========================================
  // 🌟 3. 完美修正引擎 (TOW / Weight Penalty Engine)
  // ==========================================
  const actualZfw = flightData?.trainee_input_zfw > 0 ? flightData.trainee_input_zfw : ofpZfw;
  // 🌟 修復：以前 showRevVal 淨係睇 actualZfw > 0，但 actualZfw 本身已經有 fallback 落
  // ofpZfw（幾乎恆定 > 0），令個 flag 幾乎恆定 true。真正嘅「學員改咗 ZFW」信號係呢個。
  const hasTraineeZfwInput = flightData?.trainee_input_zfw > 0;
  const deltaZfw = actualZfw - ofpZfw;
  
  const autoTaxi = ofpTaxi;
  const autoCont = ofpCont;

  // 💡 讀取正確嘅 SimBrief JSON Keys
  const impacts = rawSb.impacts || {};
  const p1000Burn = parseFloat(impacts?.zfw_plus_1000?.burn_difference);
  const m1000Burn = parseFloat(impacts?.zfw_minus_1000?.burn_difference);

  // 智能 Fallback：如果真係無 Data，先用 B773 平均 7.5T/hr 反推航程，每小時每噸懲罰 3%
  const estFlightHours = ofpTrip > 0 ? (ofpTrip / 7.5) : 1; 
  const fallbackCorr = estFlightHours * 0.03; 

  // 🌟 轉換為 Tons。注意 corrM 要用絕對值 Math.abs()，因為 deltaZfw 已經係負數！
  const corrP = !isNaN(p1000Burn) ? (p1000Burn / 1000) : fallbackCorr;  
  const corrM = !isNaN(m1000Burn) ? (Math.abs(m1000Burn) / 1000) : fallbackCorr; 

  // 💡 核心代數公式：解決「加油->變重->耗油增加->又要加油」嘅無限循環
  // 數學推導：DeltaTrip = DeltaFixedWeight * ( c / (1 - c) )
  const getLoopPenalty = (deltaFixedWeight: number) => {
    const c = deltaFixedWeight > 0 ? corrP : corrM;
    return deltaFixedWeight * (c / (1 - c));
  };

  // 狀況 A：Default 最低法定油量 (只有 ZFW 同 Altn 改變，無 Extra Fuel)
  const deltaFixedBase = deltaZfw + (currAltnOfp - baseAltnOfp);
  const minReqdTrip = ofpTrip + getLoopPenalty(deltaFixedBase);
  const minReqdTotal = autoTaxi + minReqdTrip + autoCont + currAltnOfp + ofpRes;

  // ==========================================
  // 🌟 4. 逆向推算引擎 (Desired Fuel Logic)
  // ==========================================
  const desiredFuelType = flightData?.desired_fuel_type || 'NONE';
  const desiredFuelVal = flightData?.desired_fuel_value || 0.0;
  
  let autoTrip = minReqdTrip;
  let autoExtra = 0.0;
  let autoTotal = minReqdTotal;

  if (desiredFuelType === 'OFF_BLOCK' && desiredFuelVal > minReqdTotal) {
    // 💡 邏輯：目標是固定 Total Fuel
    // 因為 Total Fuel 鎖死咗，TOW = ZFW + Total - Taxi
    const targetTow = actualZfw + desiredFuelVal - autoTaxi;
    const ofpTow = ofpZfw + ofpTotal - ofpTaxi;
    const deltaTow = targetTow - ofpTow;
    
    // TOW 已經包含所有油量，直接乘 Penalty Factor 就可以得出精準 Trip Fuel
    const c = deltaTow > 0 ? corrP : corrM;
    autoTrip = ofpTrip + (deltaTow * c);
    
    // Extra = 目標總油 - 最低要求 (剩返嘅空間先係真正嘅 Extra)
    autoExtra = desiredFuelVal - (autoTaxi + autoTrip + autoCont + currAltnOfp + ofpRes);
    autoTotal = desiredFuelVal;
    
  } else if (desiredFuelType === 'ON_LANDING') {
    // 💡 邏輯：目標是降落時的 EFOB
    const baseLandingFuel = autoCont + currAltnOfp + ofpRes;
    
    if (desiredFuelVal > baseLandingFuel) {
      // 想帶到目的地嘅「純 Extra」
      const targetExtra = desiredFuelVal - baseLandingFuel;
      
      // 因為帶呢舊 Extra 油起飛，成程機都會重咗，觸發無限循環 Penalty
      const deltaFixedWithExtra = deltaFixedBase + targetExtra;
      autoTrip = ofpTrip + getLoopPenalty(deltaFixedWithExtra);
      autoExtra = targetExtra;
      autoTotal = autoTaxi + autoTrip + autoCont + currAltnOfp + ofpRes + autoExtra;
    }
  }

  // 防禦浮點數誤差
  autoTrip = Math.max(0, autoTrip);
  autoExtra = Math.max(0, autoExtra);
  const autoReqdBase = autoTaxi + autoTrip + autoCont + currAltnOfp + ofpRes;

  // ==========================================
  // 5. 手動輸入引擎 (Manual Fuel Overrides)
  // ==========================================
  const isManual = flightData?.fuel_manual_mode || false;
  const mf = flightData?.manual_fuel || {};
  
  const currTaxi = isManual ? (mf.taxi ?? autoTaxi) : autoTaxi;
  const currTrip = isManual ? (mf.trip ?? autoTrip) : autoTrip;
  const currCont = isManual ? (mf.cont ?? autoCont) : autoCont;
  const currTank = isManual ? (mf.tankering ?? 0.0) : 0.0;
  
  const currExtra = isManual ? (mf.extra ?? 0.0) : autoExtra;
  const currReqdBase = currTaxi + currTrip + currCont + currAltnOfp + ofpRes;
  
  const currTotal = isManual ? (mf.total ?? (currReqdBase + currTank + currExtra)) : autoTotal;
  
  // 實時重量計算 (Dynamic Weights)
  const currTow = (actualZfw > 0 ? actualZfw : ofpZfw) + (currTotal - currTaxi);
  const currLw = currTow - currTrip;
  const showRevVal = isManual || hasTraineeZfwInput || (selectedAltn !== (altnOptions[0] || 'N/A')) || (autoExtra > 0);

  // ==========================================
  // 6. 動態 In-Flight Engine (EFOB & Alternates)
  // ==========================================
  const efobAtDest = Math.max(0, currTotal - currTaxi - currTrip);
  
  const rawAlternatesArray = Array.isArray(rawSb?.alternate) ? rawSb.alternate : (rawSb?.alternate ? [rawSb.alternate] : []);
  
  const processedAlternates = altnList.map((altn: any) => {
    const altnTripFuel = altn.burn || currAltnOfp; 
    const mdf = altnTripFuel + ofpRes;
    const holdFuel = efobAtDest - mdf;
    const holdMins = ofpRes > 0 ? Math.floor((Math.max(0, holdFuel) / ofpRes) * 30) : 0;
    
    let etaAltn = "----z";
    if (flightData?.sta_z) {
      const destH = parseInt(flightData.sta_z.substring(0, 2), 10);
      const destM = parseInt(flightData.sta_z.substring(2, 4), 10);
      if (!isNaN(destH) && !isNaN(destM)) {
        const rawData = rawAlternatesArray.find((r: any) => r.icao_code === altn.icao);
        const altnLegMins = rawData?.time_leg ? Math.round(parseInt(rawData.time_leg, 10) / 60) : (altn.time || 20);
        const totalMins = (destH * 60) + destM + 15 + altnLegMins;
        const newH = Math.floor(totalMins / 60) % 24;
        const newM = totalMins % 60;
        etaAltn = `${newH.toString().padStart(2, '0')}${newM.toString().padStart(2, '0')}z`;
      }
    }

    return { icao: altn.icao, mdf, holdFuel, holdTime: `${holdMins}m`, eta: etaAltn, burn: altnTripFuel, time: altn.time || 30 };
  });

  return {
    isManual, ofpZfw, ofpTaxi, ofpTrip, ofpCont, ofpRes, baseAltnOfp, ofpReqdBase, ofpTotal,
    actualZfw, hasTraineeZfwInput, deltaZfw, autoTaxi, autoCont, autoTrip, autoTotal, alternates, altnList, altnOptions, selectedAltn, currAltnOfp,
    mf, currTaxi, currTrip, currCont, currTank, currExtra, currReqdBase, currTotal, currTow, currLw, showRevVal,
    efobAtDest, processedAlternates
  };
}