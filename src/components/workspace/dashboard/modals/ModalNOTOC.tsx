"use client";

export function ModalNOTOC({ flightData }: any) {
  const notoc = flightData?.notoc;
  const hasDg = Boolean(notoc?.hasDg);
  const accentColor = hasDg ? "#FF9100" : "#00E676";

  return (
    <div className="w-full h-full font-sans">
      <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-5 md:p-6 shadow-lg relative overflow-hidden flex flex-col">
        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: accentColor }}></div>

        <div className="flex items-center gap-3 mb-4 border-b border-[#333] pb-3 shrink-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border"
            style={{ backgroundColor: `${accentColor}26`, color: accentColor, borderColor: `${accentColor}4d` }}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-white font-bold tracking-widest uppercase text-[0.95rem]">Notification to Captain (NOTOC)</h3>
        </div>

        {!hasDg ? (
          <div className="font-mono text-[0.9rem] text-[#8fa0a6] italic">
            NIL — No Dangerous Goods This Flight.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[0.8rem]">
              <thead>
                <tr className="text-[#8fa0a6] text-[0.65rem] uppercase tracking-widest border-b border-[#333]">
                  <th className="pb-2 pr-4">UN No</th>
                  <th className="pb-2 pr-4">Proper Shipping Name</th>
                  <th className="pb-2 pr-4">Class</th>
                  <th className="pb-2 pr-4">PG</th>
                  <th className="pb-2 pr-4">Qty</th>
                  <th className="pb-2 pr-4">Pos</th>
                  <th className="pb-2">Handling Note</th>
                </tr>
              </thead>
              <tbody>
                {notoc.items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-[#222] align-top">
                    <td className="py-2 pr-4 text-[#FF9100] font-bold">{item.un_number}</td>
                    <td className="py-2 pr-4 text-white">{item.proper_shipping_name}</td>
                    <td className="py-2 pr-4">{item.class_division}</td>
                    <td className="py-2 pr-4">{item.packing_group}</td>
                    <td className="py-2 pr-4">{item.quantity}</td>
                    <td className="py-2 pr-4 text-[#00bfa5] font-bold">{item.position}</td>
                    <td className="py-2 text-[#8fa0a6]">{item.handling_note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
