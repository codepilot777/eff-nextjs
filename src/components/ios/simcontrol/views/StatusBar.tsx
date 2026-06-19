"use client";
import { useState } from "react";
import { setSimPause } from "@/services/pmdgService";
import InitModal from "./InitModal"; 
import SettingsModal from "./SettingsModal"; // 🌟 引入新 Modal

export default function StatusBar({ isConnected, sendToFSUIPC, currentModuleDesc }: any) {
  const [isPaused, setIsPaused] = useState(false);
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 🌟 新增設定狀態

  const handlePauseToggle = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    setSimPause(sendToFSUIPC, nextState);
  };

  return (
    <>
      <div className="flex justify-between items-center bg-[#1E1E1E] border border-[#333] rounded-xl p-4 shrink-0 shadow-lg relative z-10">
        
        {/* 左側狀態 */}
        <div className="flex flex-col gap-1 relative pl-8">
          {/* ⚙️ 設定按鈕 (絕對定位在左側) */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2979FF] transition-colors hover:rotate-90 duration-300"
            title="System Settings"
          >
            ⚙️
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#00E676] animate-pulse' : 'bg-[#FF1744]'}`} />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8fa0a6]">
              {isConnected ? "P3D SIMULATOR LINKED" : "SIMULATOR OFFLINE"}
            </span>
          </div>
          <span className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
            Current Module: {currentModuleDesc}
          </span>
        </div>
        
        {/* 右側按鈕區 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInitModalOpen(true)}
            className="px-6 py-2.5 rounded-xl font-black text-xs tracking-widest uppercase transition-all active:scale-95 bg-[#252525] border border-[#00bfa5] text-[#00bfa5] hover:bg-[#00bfa5] hover:text-black shadow-[0_0_10px_rgba(0,191,165,0.2)]"
          >
            🚀 INIT SCENARIO
          </button>

          <button
            onClick={handlePauseToggle}
            disabled={!isConnected}
            className={`px-8 py-2.5 rounded-xl font-black text-xs tracking-widest uppercase transition-all active:scale-95 ${
              !isConnected 
                ? 'bg-[#333] text-[#555] cursor-not-allowed border border-[#222]'
                : isPaused 
                  ? 'bg-[#FF9100] text-black shadow-lg animate-pulse'
                  : 'bg-[#00E676] text-black shadow-lg'
            }`}
          >
            {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
          </button>
        </div>
      </div>

      <InitModal isOpen={isInitModalOpen} onClose={() => setIsInitModalOpen(false)} sendToFSUIPC={sendToFSUIPC} />
      
      {/* 🌟 掛載 Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}