"use client";
import { useEffect, useState } from "react";

export default function TelemetryView({ telemetry, readSimData, isConnected }: any) {
  const [autoRefresh, setAutoRefresh] = useState(false);

  // ⏱️ 實時跳字核心：當 Auto-Refresh 開啟且連線中，每 1 秒自動發射讀取指令
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isConnected) {
      interval = setInterval(() => {
        readSimData();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, isConnected, readSimData]);

  // 解析 FSUIPC 傳返嚟嘅 JSON 字串
  let simData: any = {};
  try {
    simData = JSON.parse(telemetry);
  } catch (e) {
    // 忽略初次 Render 或者解析失敗嘅 Error
  }

  // 計算真實數值 (FSUIPC IAS 公式: 數值 / 128)
  const iasKnots = simData.ias ? Math.round(simData.ias / 128) : 0;
  const aircraftName = simData.aircraftTitle || "UNKNOWN AIRCRAFT";

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      
      {/* 頂部控制列 */}
      <div className="flex justify-between items-center shrink-0 bg-[#151515] p-3 rounded-xl border border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <span className="text-[#00E676] font-bold font-mono text-sm tracking-widest pl-2">LIVE TELEMETRY</span>
          {autoRefresh && <span className="w-2 h-2 rounded-full bg-[#00E676] animate-ping" />}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            disabled={!isConnected}
            className={`font-black text-xs px-5 py-2.5 rounded-lg uppercase tracking-widest transition-all active:scale-95 shadow-md ${
              !isConnected 
                ? "bg-[#333] text-gray-500 cursor-not-allowed" 
                : autoRefresh 
                  ? "bg-[#00E676] text-black shadow-[0_0_10px_rgba(0,230,118,0.4)]" 
                  : "bg-[#252525] border border-[#444] text-gray-300 hover:bg-[#333]"
            }`}
          >
            {autoRefresh ? "⏹ AUTO-POLL ON" : "▶ AUTO-POLL OFF"}
          </button>

          {!autoRefresh && (
            <button 
              onClick={readSimData}
              disabled={!isConnected}
              className="bg-[#2979FF] hover:bg-[#2979FF]/80 text-white font-black text-xs px-5 py-2.5 rounded-lg uppercase tracking-widest transition-all active:scale-95 shadow-md disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              📡 MANUAL REFRESH
            </button>
          )}
        </div>
      </div>

      {/* 儀表板數據區 */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4 content-start">
        
        {/* 卡片 1: 飛機型號 */}
        <div className="col-span-2 md:col-span-4 bg-[#1a1a1a] border border-[#333] p-4 rounded-xl flex flex-col justify-center items-center shadow-inner">
          <span className="text-[0.65rem] font-mono text-gray-500 uppercase tracking-widest mb-1">AIRCRAFT PROFILE</span>
          <span className="text-lg font-black text-[#00bfa5] tracking-widest text-center">{aircraftName}</span>
        </div>

        {/* 卡片 2: 空速 IAS */}
        <div className="bg-[#1a1a1a] border border-[#333] p-5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-[0.65rem] font-mono text-gray-500 uppercase tracking-widest absolute top-3 left-3">IAS</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-mono font-black text-white">{iasKnots}</span>
            <span className="text-xs font-bold text-gray-500">KTS</span>
          </div>
        </div>

        {/* 預留卡片: 高度 (Altitude) */}
        <div className="bg-[#1a1a1a] border border-[#333] p-5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden opacity-50">
          <span className="text-[0.65rem] font-mono text-gray-500 uppercase tracking-widest absolute top-3 left-3">ALTITUDE</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-mono font-black text-white">---</span>
            <span className="text-xs font-bold text-gray-500">FT</span>
          </div>
        </div>
        
        {/* 預留卡片: 航向 (Heading) */}
        <div className="bg-[#1a1a1a] border border-[#333] p-5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden opacity-50">
          <span className="text-[0.65rem] font-mono text-gray-500 uppercase tracking-widest absolute top-3 left-3">HEADING</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-mono font-black text-white">---</span>
            <span className="text-xs font-bold text-gray-500">DEG</span>
          </div>
        </div>

        {/* 預留卡片: 距離下降頂點 (Dist to T/D) */}
        <div className="bg-[#1a1a1a] border border-[#333] p-5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden opacity-50">
          <span className="text-[0.65rem] font-mono text-gray-500 uppercase tracking-widest absolute top-3 left-3">DIST TO T/D</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-mono font-black text-[#FF9100]">---</span>
            <span className="text-xs font-bold text-gray-500">NM</span>
          </div>
        </div>

      </div>

      {/* Raw JSON Debug 折疊窗 (留返畀你做 Debug 用) */}
      <div className="mt-auto bg-black border border-[#2a2a2a] rounded-xl p-3 h-24 overflow-y-auto shadow-inner shrink-0">
         <span className="text-[0.6rem] text-gray-600 font-mono mb-1 block">RAW FSUIPC DATALINK:</span>
         <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap">{telemetry}</pre>
      </div>

    </div>
  );
}