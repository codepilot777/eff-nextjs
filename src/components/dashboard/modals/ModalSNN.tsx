"use client";
export function ModalSNN({ flightData }: any) {
  return (
            <div>
              <div className="text-[#FF9100] mb-4 font-sans font-bold">-- SPECIAL NAVIGATION NOTE (SNN) --</div>
              <div className="bg-[#1c2630] border-l-4 border-[#FF9100] p-4 rounded text-text-main text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {flightData?.snn || "Check NOTAM for TWY closures. Expect radar vectors after departure. Monitor fuel temp closely due to cold airmass."}
              </div>
            </div>
          );
}