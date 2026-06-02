"use client";

import TechLog from "../TechLog"; // 確保路徑指向你嘅主 TechLog 元件

export default function TechLogModal({ isOpen, onClose, flightData, updateFlightData }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in p-4 lg:p-10">
      
      {/* 獨立的大型 Modal 視窗 */}
      <div className="bg-[#0a0a0a] border-2 border-[#00bfa5] rounded-xl w-full max-w-[1600px] h-full max-h-[95vh] shadow-[0_0_50px_rgba(0,191,165,0.15)] flex flex-col overflow-hidden relative">
        
        {/* Modal 專屬 Top Header & Close Button */}
        <div className="bg-[#1a1a1a] border-b-2 border-[#00bfa5] px-6 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[#00bfa5] text-2xl">🔧</span>
            <h2 className="text-white font-black tracking-widest text-lg">AIRCRAFT E-TECHLOG (IOS MASTER ACCESS)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8fa0a6] hover:text-white hover:bg-[#FF1744] w-8 h-8 flex items-center justify-center rounded transition-colors text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* 核心 TechLog 內容區 (隱藏 Scrollbar 防止雙重滾動) */}
        <div className="flex-1 overflow-hidden p-2">
          {/* 將 flightData 傳入，佢自己會搞掂 API sync 同權限 */}
          <TechLog flightData={flightData} updateFlightData={updateFlightData} />
        </div>

      </div>
    </div>
  );
}