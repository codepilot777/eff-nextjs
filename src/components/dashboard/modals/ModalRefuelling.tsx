"use client";
export function ModalRefuelling({ flightData, updateFlightData, setActiveModal }: any) {
  return (
            <div className="flex flex-col">
              <div className="text-[1.1rem] font-bold color-[#00bfa5] mb-4 uppercase">Fuel Supplier Receipt</div>
              
              {!flightData?.fuel_receipt_sent ? (
                <div className="bg-lido-800 border border-[#FF9100] text-[#FF9100] p-6 rounded-lg text-center font-bold">
                  ⏳ Waiting for fuel supplier tender.
                </div>
              ) : (
                <div className="bg-lido-800 border border-[#333333] rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-text-muted text-xs font-bold uppercase mb-1">Supplier Code</div>
                      <div className="font-mono text-white text-lg">AFSC (HKIA)</div>
                      <div className="text-text-muted text-xs font-bold uppercase mt-4 mb-1">Date</div>
                      <div className="font-mono text-white text-lg">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs font-bold uppercase mb-1">Product</div>
                      <div className="font-mono text-white text-lg">JET A-1</div>
                      <div className="text-text-muted text-xs font-bold uppercase mt-4 mb-1">SG</div>
                      <div className="font-mono text-white text-lg">0.795</div>
                    </div>
                  </div>
                  
                  <hr className="border-[#404040] mb-6"/>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8 text-center">
                    <div className="bg-[#0a0a0a] border border-[#00bfa5] rounded-lg p-4">
                      <div className="text-text-muted text-xs font-bold uppercase mb-2">Uplifted</div>
                      <div className="text-4xl font-black text-white">{(flightData?.actual_uplift || 0).toFixed(1)} <span className="text-xl text-status-teal">T</span></div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#00bfa5] rounded-lg p-4">
                      <div className="text-text-muted text-xs font-bold uppercase mb-2">Total FOB</div>
                      <div className="text-4xl font-black text-[#00E676]">{((flightData?.trainee_log_fuel || 0) + (flightData?.actual_uplift || 0)).toFixed(1)} <span className="text-xl text-[#00E676]">T</span></div>
                    </div>
                  </div>
                  
                  {!flightData?.pilots_signed_fuel ? (
                    <button 
                      onClick={() => {
                        updateFlightData({ pilots_signed_fuel: true });
                        setActiveModal(null);
                      }}
                      className="w-full py-4 bg-[#00E676] text-black font-black text-xl rounded-lg hover:bg-[#00c853] shadow-[0_4px_15px_rgba(0,230,118,0.4)] transition-all"
                    >
                      ACCEPT FUEL RECEIPT
                    </button>
                  ) : (
                    <div className="bg-[#00E676]/20 border border-[#00E676] text-[#00E676] p-4 rounded-lg text-center font-bold text-lg">
                      ✅ FUEL RECEIPT ACCEPTED.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}