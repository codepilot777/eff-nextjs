"use client";

export function ModalRefuelling({ flightData, updateFlightData, setActiveModal }: any) {
  
  // 提取日期格式
  const receiptDate = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', month: 'short', year: 'numeric' 
  }).replace(/ /g, '-').toUpperCase();

  // 計算 Total FOB
  // 🌟 修復：以前讀緊 trainee_log_fuel，一個成個 codebase 都未寫過嘅欄位（恆定 0）。
  // 真正嘅「派發之前機上殘油」係 fob_before_uplift（喺 PayloadTab 送 receipt 嗰刻凍結），
  // 冇嘅話 fallback 落即時嘅 fuel_on_board（例如舊 flight 未有呢個欄位嘅情況）。
  const totalFob = ((flightData?.fob_before_uplift ?? flightData?.fuel_on_board ?? 0) + (flightData?.actual_uplift || 0)).toFixed(1);

  return (
    <div className="w-full h-full font-sans flex flex-col min-h-0">
      
      {!flightData?.fuel_receipt_sent ? (
        // 🌟 Pending 狀態：虛線外框 + 居中提示
        <div className="flex-1 flex flex-col items-center justify-center bg-[#1E1E1E] border-2 border-dashed border-[#333] rounded-2xl p-8 text-center min-h-[300px]">
          <div className="text-4xl mb-4 animate-bounce text-[#FF9100]">⏳</div>
          <h3 className="text-[#FF9100] font-bold text-[0.85rem] uppercase tracking-widest">Waiting for Fuel Tender</h3>
          <p className="text-[#8fa0a6] text-xs mt-2 max-w-xs leading-relaxed">
            The fuel supplier has not dispatched the receipt to the cockpit yet. Please stand by.
          </p>
        </div>
      ) : (
        // 🌟 收到油單狀態：專業深色表單
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-6 shadow-lg flex flex-col">
          
          {/* 上半部：油站與產品資訊 */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-6 pb-6 border-b border-[#333] shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Supplier Code</span>
              <span className="font-mono text-[1.1rem] text-white leading-none mt-1">AFSC (HKIA)</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Product</span>
              <span className="font-mono text-[1.1rem] text-white leading-none mt-1">JET A-1</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Date</span>
              <span className="font-mono text-[1.1rem] text-white leading-none mt-1">{receiptDate}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Specific Gravity (SG)</span>
              <span className="font-mono text-[1.1rem] text-white leading-none mt-1">0.795</span>
            </div>
          </div>
          
          {/* 中半部：油量大字報 */}
          <div className="grid grid-cols-2 gap-5 mb-8 shrink-0">
            {/* Uplifted */}
            <div className="bg-[#0a0a0a] border border-[#333] rounded-xl p-5 flex flex-col items-center justify-center shadow-inner">
              <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest mb-2">Uplifted</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-mono font-black text-white">{(flightData?.actual_uplift || 0).toFixed(1)}</span>
                <span className="text-lg font-bold text-[#8fa0a6]">T</span>
              </div>
            </div>
            
            {/* Total FOB */}
            <div className="bg-[#0a0a0a] border border-[#333] rounded-xl p-5 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
              {/* 加入一條極幼的綠色頂邊代表這是最終確認油量 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#00E676]"></div>
              <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest mb-2">Total FOB</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-mono font-black text-[#00E676]">{totalFob}</span>
                <span className="text-lg font-bold text-[#00E676]">T</span>
              </div>
            </div>
          </div>
          
          {/* 下半部：操作按鈕 */}
          <div className="mt-auto shrink-0">
            {!flightData?.pilots_signed_fuel ? (
              <button 
                onClick={() => {
                  updateFlightData({ pilots_signed_fuel: true });
                  setActiveModal(null);
                }}
                className="w-full py-3.5 bg-[#C6FF00] text-black font-black text-[0.8rem] uppercase tracking-widest rounded-lg hover:bg-[#b0e600] shadow-md transition-colors"
              >
                Accept Fuel Receipt
              </button>
            ) : (
              <div className="bg-[#00E676]/15 border border-[#00E676]/30 text-[#00E676] p-3.5 rounded-lg flex items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs">✓</span>
                <span className="font-bold text-[0.8rem] uppercase tracking-widest mt-px">Fuel Receipt Accepted</span>
              </div>
            )}
          </div>

        </div>
      )}
      
    </div>
  );
}