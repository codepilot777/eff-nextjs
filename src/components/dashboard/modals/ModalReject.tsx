"use client";
import { useState } from "react";

export function ModalReject({ flightData, updateFlightData, setActiveModal, type }: any) {
  const [rejectReason, setRejectReason] = useState("");
  const isFinal = type === "FINAL";
  const version = isFinal ? (flightData?.final_ls_version || 1) : (flightData?.prelim_ls_version || 1);
  const formattedVersion = version.toString().padStart(2, '0');

  const handleSubmit = () => {
    if(!rejectReason.trim()) { 
      alert("Please enter a reason."); 
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
    <div className="flex flex-col h-full max-w-lg mx-auto w-full justify-center animate-fade-in-up">
      <div className="bg-[#0a0a0a] border border-[#404040] rounded-xl p-6 shadow-2xl">
        <h3 className="text-[#FF1744] font-black text-2xl mb-2">Reject {type} Loadsheet</h3>
        <p className="text-text-muted text-sm mb-4">
          Please provide a reason for rejecting {type} V{formattedVersion}. This will notify the Instructor IOS.
        </p>
        
        <textarea 
          className="w-full h-32 bg-lido-800 border border-[#404040] rounded p-3 text-white outline-none focus:border-[#FF1744] mb-6 resize-none" 
          placeholder="Enter rejection reason (e.g. ZFW discrepancy)..." 
          value={rejectReason} 
          onChange={e => setRejectReason(e.target.value)} 
        />
        
        <div className="flex gap-4">
          {/* 🌟 全新升級的「返回」按鈕 */}
          <button 
            onClick={() => setActiveModal('Loadsheet')} 
            className="flex-1 py-3 bg-[#2a2a2a] border border-[#404040] text-[#8fa0a6] font-bold tracking-widest text-xs rounded-lg hover:text-white hover:bg-[#404040] transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">🔙</span> BACK TO LOADSHEET
          </button>
          
          <button 
            onClick={handleSubmit} 
            className="flex-[1.2] py-3 bg-[#FF1744] text-white font-black tracking-widest text-xs rounded-lg hover:bg-[#D50000] transition-colors shadow-[0_4px_15px_rgba(255,23,68,0.3)]"
          >
            SUBMIT REJECTION
          </button>
        </div>
      </div>
    </div>
  );
}