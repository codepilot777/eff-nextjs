// lib/airports/airportHelpers.ts

const formatWind = (windComp: string) => {
  if (!windComp) return "--";
  const isTail = windComp.startsWith('P');
  const val = parseInt(windComp.substring(1), 10);
  if (isNaN(val)) return "--";
  return `${val} ${isTail ? 'TWC' : 'HWC'}`;
};

const formatEte = (eteSecs: string) => {
  if (!eteSecs) return "--";
  const mins = Math.floor(parseInt(eteSecs, 10) / 60);
  if (isNaN(mins)) return "--";
  return `00${mins}`.slice(-4);
};

const calculateExactEta = (destStaZ: string, eteSecs: string) => {
  if (!destStaZ || destStaZ.includes('-')) return "----z";
  const h = parseInt(destStaZ.substring(0, 2), 10);
  const m = parseInt(destStaZ.substring(2, 4), 10);
  if (isNaN(h) || isNaN(m)) return "----z";
  
  const addMins = Math.floor((parseInt(eteSecs, 10) || 0) / 60);
  const totalMins = (h * 60) + m + addMins;
  
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${newH.toString().padStart(2, '0')}${newM.toString().padStart(2, '0')}z`;
};

const calculateEtaWindow = (etaZ: string) => {
  if (!etaZ || etaZ.includes('-')) return "----z/----z";
  const h = parseInt(etaZ.substring(0, 2), 10);
  const m = etaZ.substring(2, 4);
  if (isNaN(h)) return "----z/----z";
  
  const fromH = (h - 1 + 24) % 24;
  const toH = (h + 1) % 24;
  return `${fromH.toString().padStart(2, '0')}${m}z/${toH.toString().padStart(2, '0')}${m}z`;
};

const getAlternateMora = (altNavlog: any) => {
  let maxMora = 0;
  if (altNavlog?.fix) {
    const fixes = Array.isArray(altNavlog.fix) ? altNavlog.fix : [altNavlog.fix];
    fixes.forEach((f: any) => {
      const mora = parseInt(f.mora || f.grid_mora || '0', 10);
      if (!isNaN(mora) && mora > maxMora) maxMora = mora;
    });
  }
  return maxMora > 0 ? maxMora : '--';
};

// 🌟 替換：TAF 天氣智能解碼器 (Regex)
const extractForecastWeather = (icao: string, flightData: any, type: string) => {
  const wx = flightData?.raw_simbrief?.weather || {};
  let tafStr = "";

  if (type === 'DEP') tafStr = wx.orig_taf || "";
  else if (type === 'ARR') tafStr = wx.dest_taf || "";
  else if (type === 'ALTN') {
    const altnTafs = Array.isArray(wx.altn_taf) ? wx.altn_taf : (wx.altn_taf ? [wx.altn_taf] : []);
    tafStr = altnTafs.find((t: string) => t.includes(icao)) || "";
  }

  if (!tafStr) return { ceil: '----', vis: '----', wind: '---/--' };

  // 🌬️ 擷取預測風向 (支援 KT 同 MPS)
  const windMatch = tafStr.match(/\b(\d{3}|VRB)(\d{2,3})(G\d{2,3})?(KT|MPS)\b/);
  let wind = '---/--';
  if (windMatch) {
    const dir = windMatch[1];
    let spd = parseInt(windMatch[2], 10);
    let gustStr = windMatch[3] ? windMatch[3] : '';
    const unit = windMatch[4];

    // 如果係 MPS，自動轉換為 Knots (1 MPS ≈ 1.94384 KT)
    if (unit === 'MPS') {
      spd = Math.round(spd * 1.94384);
      if (gustStr) {
        const gustSpd = parseInt(gustStr.substring(1), 10);
        gustStr = 'G' + Math.round(gustSpd * 1.94384);
      }
    }
    wind = `${dir}/${spd}${gustStr}`;
  }

  // 👁️ 擷取能見度
  const visMatch = tafStr.match(/(?<=\s)(\d{4})(?=\s|$)/);
  const vis = visMatch ? visMatch[1] : '9999';

  // ☁️ 擷取最低雲底高
  const ceilMatches = [...tafStr.matchAll(/(BKN|OVC)(\d{3})/g)];
  let ceil = '9999'; 
  if (ceilMatches.length > 0) {
    const heights = ceilMatches.map(m => parseInt(m[2], 10) * 100);
    ceil = Math.min(...heights).toString();
  }

  return { ceil, vis, wind };
};

// 🌟 替換：自動計算 H/T WC 同 XWC 引擎
const calculateWindComponents = (windStr: string, rwyStr: string) => {
  if (!windStr || windStr === '---/--' || !rwyStr || rwyStr === '--') {
    return { ht: '--', xwc: '--' };
  }

  const rwyMatch = rwyStr.match(/^(\d{2})/);
  if (!rwyMatch) return { ht: '--', xwc: '--' };
  const rwyHdg = parseInt(rwyMatch[1], 10) * 10;

  const windParts = windStr.split('/');
  if (windParts.length !== 2) return { ht: '--', xwc: '--' };
  
  const wDirStr = windParts[0];
  const wSpdStr = windParts[1];

  if (wDirStr === 'VRB') return { ht: 'VRB', xwc: 'VRB' };

  const wDir = parseInt(wDirStr, 10);
  const wSpdMatch = wSpdStr.match(/^(\d+)/);
  if (!wSpdMatch || isNaN(wDir)) return { ht: '--', xwc: '--' };
  const wSpd = parseInt(wSpdMatch[1], 10);

  const angleRad = (wDir - rwyHdg) * (Math.PI / 180);
  
  const headwind = Math.cos(angleRad) * wSpd;
  const crosswind = Math.abs(Math.sin(angleRad) * wSpd);

  let htStr = "";
  if (Math.round(headwind) >= 0) {
    htStr = `${Math.round(headwind)}H`; 
  } else {
    htStr = `${Math.abs(Math.round(headwind))}T`; 
  }

  return { 
    ht: htStr, 
    xwc: `${Math.round(crosswind)}` // 🌟 已移除 'X' 尾綴
  };
};

export const parseAirportsData = (flightData: any, calc: any) => {
  const sb = flightData?.raw_simbrief || {};
  const origin = sb.origin || {};
  const dest = sb.destination || {};
  
  const alternatesRaw = Array.isArray(sb.alternate) ? sb.alternate : (sb.alternate ? [sb.alternate] : []);
  const altNavlogsRaw = Array.isArray(sb.alternate_navlog) ? sb.alternate_navlog : (sb.alternate_navlog ? [sb.alternate_navlog] : []);

  const stdZ = flightData?.std_z?.replace('Z', 'z') || "--z";
  const staZ = flightData?.sta_z?.replace('Z', 'z') || "--z";

  const depRwy = origin.plan_rwy || calc?.depRwy || "--";
  const arrRwy = dest.plan_rwy || calc?.arrRwy || "--";

  const depWx = extractForecastWeather(origin.icao_code || calc?.depIcao, flightData, 'DEP');
  const arrWx = extractForecastWeather(dest.icao_code || calc?.arrIcao, flightData, 'ARR');

  // 🌟 注入 Components
  const depComps = calculateWindComponents(depWx.wind, depRwy);
  const arrComps = calculateWindComponents(arrWx.wind, arrRwy);

  const dep = {
    type: "DEP",
    icao: origin.icao_code || calc?.depIcao || "----",
    fl: sb.general?.initial_altitude ? (parseInt(sb.general.initial_altitude, 10) / 100).toFixed(0) : "--",
    rwy: depRwy,
    eta: stdZ,
    window: calculateEtaWindow(stdZ),
    wx: { ...depWx, ...depComps },
    isHighlighted: false
  };

  const arr = {
    type: "ARR",
    icao: dest.icao_code || calc?.arrIcao || "----",
    dist: sb.general?.route_distance || "--",
    fl: sb.general?.initial_altitude ? (parseInt(sb.general.initial_altitude, 10) / 100).toFixed(0) : "--",
    rwy: arrRwy,
    eta: staZ,
    window: calculateEtaWindow(staZ),
    wx: { ...arrWx, ...arrComps },
    isHighlighted: false
  };

  const alternates = alternatesRaw.map((alt: any, idx: number) => {
    const calcAltn = calc?.processedAlternates?.find((a: any) => a.icao === (alt.icao_code || alt.icao));
    const mdf = calcAltn?.mdf || 0;
    const rwy = alt.plan_rwy || "--";
    
    const exactEta = calculateExactEta(staZ, alt.ete);
    const window = calculateEtaWindow(exactEta);
    const mora = getAlternateMora(altNavlogsRaw[idx]);
    const altnWx = extractForecastWeather(alt.icao_code || alt.icao, flightData, 'ALTN');
    
    // 🌟 注入 Components
    const altnComps = calculateWindComponents(altnWx.wind, rwy);
    
    return {
      type: "ALTN",
      icao: alt.icao_code || alt.icao || "----",
      mdf: mdf.toFixed(1),
      mtr: alt.track_mag || "--",
      dist: alt.distance || "--",
      fl: alt.cruise_altitude ? (parseInt(alt.cruise_altitude, 10) / 100).toFixed(0) : "--",
      mora: mora,
      tas: alt.tas || "--",
      windComp: formatWind(alt.avg_wind_comp),
      time: formatEte(alt.ete),
      eta: exactEta,
      window: window,
      rwy: rwy,
      route: alt.route || "NO ROUTE DATA AVAILABLE",
      wx: { ...altnWx, ...altnComps },
      isSelected: calc?.selectedAltn === (alt.icao_code || alt.icao)
    };
  });

  return { dep, arr, alternates };
};