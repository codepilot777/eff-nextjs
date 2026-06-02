"use client";

export default function FuelTab({ flightData, updateFlightData }: { flightData: any, updateFlightData: any }) {
  if (!flightData.final_fuel_accepted) {
    return (
      <div className="bg-[#FF9100]/15 border border-[#FF9100] rounded-xl p-6 text-center">
        <div className="text-xl mb-2">⏳</div>
        <h5 className="text-[#FF9100] font-bold">Waiting for Trainee</h5>
        <p className="text-text-main text-sm">Trainee has not accepted the Final Fuel figure based on AZF yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-lido-800 border border-[#333333] rounded-xl p-6">
      <div className="bg-lido-800 border-l-4 border-[#FF9100] p-4 rounded mb-6">
        <span className="text-text-muted text-sm font-bold uppercase">Trainee Final Fuel Request</span>
        <div className="text-3xl font-black text-[#FF9100] mt-1">{flightData.final_fuel_request?.toFixed(1)} T</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div><label className="block text-xs text-text-muted mb-1">Flight Number</label><input type="text" disabled value={flightData.flight_no} className="w-full bg-lido-950 border border-[#404040] p-2 rounded text-text-main opacity-70" /></div>
        <div><label className="block text-xs text-text-muted mb-1">Supplier Code</label><input type="text" defaultValue="AFSC (HKIA)" className="w-full bg-lido-950 border border-[#404040] p-2 rounded text-text-main" /></div>
        <div><label className="block text-xs text-text-muted mb-1">Fuel Uplifted (Tons)</label><input id="fuel_uplift" type="number" step="0.1" defaultValue={Math.max(0, flightData.final_fuel_request - 5.0).toFixed(1)} className="w-full bg-lido-950 border border-[#404040] p-2 rounded text-text-main" /></div>
      </div>

      <button 
        onClick={() => {
          const uplift = parseFloat((document.getElementById('fuel_uplift') as HTMLInputElement).value);
          updateFlightData({ fuel_receipt_sent: true, actual_uplift: uplift });
        }}
        className="w-full bg-[#FF9100] text-black font-black py-4 rounded-lg hover:bg-[#ffA000] shadow-[0_4px_10px_rgba(255,145,0,0.3)] transition-all"
      >
        🚚 ISSUE FUEL RECEIPT TO COCKPIT
      </button>
      
      {flightData.pilots_signed_fuel && (
        <div className="mt-4 bg-[#00E676]/20 border border-[#00E676] text-[#00E676] p-4 rounded-lg text-center font-bold">
          ✅ Captain has digitally signed the Fuel Receipt.
        </div>
      )}
    </div>
  );
}