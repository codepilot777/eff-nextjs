"use client";

export function ModalSNN({ flightData }: any) {
  return (
    <div className="w-full h-full font-sans">
      <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-5 md:p-6 shadow-lg relative overflow-hidden flex flex-col">
        
        {/* 🌟 醒目的橙色左邊界指示條 */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF9100]"></div>
        
        <div className="flex items-center gap-3 mb-4 border-b border-[#333] pb-3 shrink-0">
           {/* Warning Icon */}
           <div className="w-7 h-7 rounded-full bg-[#FF9100]/15 flex items-center justify-center text-[#FF9100] shrink-0 border border-[#FF9100]/30">
             <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <h3 className="text-white font-bold tracking-widest uppercase text-[0.95rem]">Active Dispatch Notes</h3>
        </div>

        {/* 🌟 SNN 內容區：使用字體稍微大一點的 font-mono 方便閱讀 */}
        <div className="font-mono text-[0.9rem] leading-relaxed whitespace-pre-wrap text-[#e2e8f0]">
          {flightData?.snn || <span className="text-[#8fa0a6] italic">No dispatch notes for this flight.</span>}
        </div>
        
      </div>
    </div>
  );
}