"use client";

import TechLog from "./TechLog"; // 確保路徑指向你嘅主 TechLog 元件

// 🌟 Props 清洗：只保留 isOpen 同 onClose，唔使再傳 flightData
export default function TechLogModal({ isOpen, onClose }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in p-4 lg:p-10 font-sans">
      
      {/* 獨立的大型 Modal 視窗 (黑魂工業風) */}
      <div className="bg-[#0a0a0a] border border-[#333] rounded-2xl w-full max-w-[1600px] h-full max-h-[95vh] shadow-[0_0_60px_rgba(0,230,118,0.1)] flex flex-col overflow-hidden relative">
        
        {/* Modal 專屬 Top Header & Close Button */}
        <div className="bg-[#1E1E1E] border-b border-[#333] px-6 py-4 flex justify-between items-center shrink-0 shadow-md z-50">
          <div className="flex items-center gap-3">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#00E676]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71-.505-.781-.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-[#00E676] font-black tracking-widest text-[0.85rem] uppercase">
              Aircraft E-Techlog (IOS Master Access)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8fa0a6] hover:text-[#FF1744] hover:bg-[#FF1744]/10 w-9 h-9 flex items-center justify-center rounded-lg transition-colors outline-none"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-2">
          {/* 🌟 淨係傳 forcedRole="instructor"，乾淨俐落！ */}
          <TechLog forcedRole="instructor" />
        </div>

      </div>
    </div>
  );
}