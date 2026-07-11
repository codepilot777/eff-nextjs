"use client";
import { useState } from "react";

export function ModalReject({ flightData, updateFlightData, setActiveModal, type }: any) {
  const [rejectReason, setRejectReason] = useState("");
  const isFinal = type === "FINAL";
  const isFuel = type === "FUEL";

  // 🌟 核心修正：從歷史陣列中抽取出真正「最後發送」的版本號，防止點錯相
  const activeFinalVer = flightData?.final_history?.[flightData.final_history.length - 1]?.version || 1;
  const activePrelimVer = flightData?.prelim_history?.[flightData.prelim_history.length - 1]?.version || 1;

  const version = isFinal ? activeFinalVer : activePrelimVer;
  const formattedVersion = version.toString().padStart(2, '0');

  const handleSubmit = () => {
    if(!rejectReason.trim()) {
      alert("Please enter a reason.");
      return;
    }

    if (isFuel) {
      // 🌟 Fuel receipt 冇 version history array（唔似 prelim/final_history），一定係
      // 「拒收現有嗰張」，教官要重新 DISPATCH FUEL RECEIPT 先會清返呢個 rejected 狀態
      updateFlightData({ fuel_receipt_rejected: true, fuel_receipt_reject_reason: rejectReason.trim() });
      setActiveModal('Refuelling');
      return;
    }

    if (isFinal) {
      updateFlightData({ final_ls_rejected: true, final_ls_reject_reason: rejectReason.trim() });
    } else {
      updateFlightData({ prelim_ls_rejected: true, prelim_ls_reject_reason: rejectReason.trim() });
    }
    // 🌟 提交成功後，自動彈返去 Loadsheet 頁面睇最新狀態
    setActiveModal('Loadsheet');
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto w-full justify-center font-sans">
      <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* 🌟 鮮紅色左邊界指示條 */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF1744]"></div>
        
        {/* 標題與 Warning Icon */}
        <div className="flex items-center gap-4 mb-4 border-b border-[#333] pb-4 shrink-0">
           <div className="w-10 h-10 rounded-full bg-[#FF1744]/15 flex items-center justify-center text-[#FF1744] shrink-0 border border-[#FF1744]/30">
             <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <div>
             <h3 className="text-white font-bold tracking-widest uppercase text-[1.1rem] leading-none">{isFuel ? "Reject Fuel Receipt" : "Reject Loadsheet"}</h3>
             {/* 🌟 依家呢度會完美顯示 Reject PRELIM V01，唔會再偷跑去 V02。Fuel receipt 冇 version，淨係顯示個 type */}
             <span className="text-[#FF1744] text-[0.75rem] font-bold tracking-widest uppercase mt-1.5 block">{isFuel ? "FUEL RECEIPT" : `${type} V${formattedVersion}`}</span>
           </div>
        </div>

        <p className="text-[#8fa0a6] text-[0.8rem] mb-5 leading-relaxed">
          {isFuel
            ? "Please provide a detailed reason for rejecting this fuel receipt. This action will notify the Dispatcher (IOS) to resend a corrected receipt."
            : "Please provide a detailed reason for rejecting this loadsheet. This action will notify the Dispatcher (IOS) to revise the data."}
        </p>
        
        {/* 🌟 輸入框：純黑底色、內陰影 */}
        <textarea 
          className="w-full h-32 bg-[#0a0a0a] border border-[#333] rounded-xl p-4 text-[#e2e8f0] font-mono text-[0.85rem] outline-none focus:border-[#FF1744] mb-6 resize-none shadow-inner transition-colors placeholder:text-[#555]" 
          placeholder={isFuel ? "Enter rejection reason (e.g., Uplift discrepancy, wrong fuel type)..." : "Enter rejection reason (e.g., ZFW discrepancy, Pax count mismatch)..."}
          value={rejectReason} 
          onChange={e => setRejectReason(e.target.value)} 
        />
        
        <div className="flex gap-3 mt-auto">
          {/* 🌟 返回按鈕 (替換 Emoji 為精緻的 SVG 箭嘴) */}
          <button
            onClick={() => setActiveModal(isFuel ? 'Refuelling' : 'Loadsheet')}
            className="flex-1 py-3.5 bg-transparent border border-[#333] text-[#8fa0a6] font-bold tracking-widest text-[0.7rem] uppercase rounded-lg hover:text-white hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
          
          {/* 🌟 提交按鈕 (加入 disabled 狀態視覺反饋) */}
          <button 
            onClick={handleSubmit} 
            disabled={!rejectReason.trim()}
            className={`flex-[1.8] py-3.5 font-black tracking-widest text-[0.7rem] uppercase rounded-lg transition-all ${
              rejectReason.trim() 
                ? 'bg-[#FF1744] text-white hover:bg-[#D50000] shadow-[0_4px_15px_rgba(255,23,68,0.3)]' 
                : 'bg-[#1a1a1a] text-[#555] border border-[#333] cursor-not-allowed'
            }`}
          >
            Submit Rejection
          </button>
        </div>
      </div>
    </div>
  );
}