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
            <table className="w-full text-left font-mono text-[0.72rem] whitespace-nowrap">
              <thead>
                <tr className="text-[#8fa0a6] text-[0.6rem] uppercase tracking-widest border-b border-[#333]">
                  <th className="pb-2 pr-4">Station of Unloading</th>
                  <th className="pb-2 pr-4">Air Waybill No.</th>
                  <th className="pb-2 pr-4">UN/ID No.</th>
                  <th className="pb-2 pr-4">Proper Shipping Name</th>
                  <th className="pb-2 pr-4">Class/Div</th>
                  <th className="pb-2 pr-4">Sub Hazard</th>
                  <th className="pb-2 pr-4">Net Qty</th>
                  <th className="pb-2 pr-4">Radioactive Categ.</th>
                  <th className="pb-2 pr-4">PG</th>
                  <th className="pb-2 pr-4">Emergency Phone</th>
                  <th className="pb-2 pr-4">IMP Code</th>
                  <th className="pb-2 pr-4">ERG</th>
                  <th className="pb-2 pr-4">CAO</th>
                  <th className="pb-2 pr-4">Loaded ULD/IOD</th>
                  <th className="pb-2">POS</th>
                </tr>
              </thead>
              <tbody>
                {notoc.items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-[#222] align-top">
                    <td className="py-2 pr-4 text-white">{item.station_of_unloading}</td>
                    <td className="py-2 pr-4 text-white">{item.awb_number}</td>
                    <td className="py-2 pr-4 text-[#FF9100] font-bold">{item.un_number}</td>
                    <td className="py-2 pr-4 text-white whitespace-normal min-w-[12rem]">{item.proper_shipping_name}</td>
                    <td className="py-2 pr-4">{item.class_division}</td>
                    <td className="py-2 pr-4">{item.sub_hazard}</td>
                    <td className="py-2 pr-4">{item.net_quantity}</td>
                    <td className="py-2 pr-4">{item.radioactive_category}</td>
                    <td className="py-2 pr-4">{item.packing_group}</td>
                    <td className="py-2 pr-4 text-[#8fa0a6]">{item.emergency_phone}</td>
                    <td className="py-2 pr-4">{item.imp_code}</td>
                    <td className="py-2 pr-4">{item.erg}</td>
                    <td className="py-2 pr-4">{item.cao}</td>
                    <td className="py-2 pr-4 text-[#00bfa5] font-bold">{item.loaded_uld}</td>
                    <td className="py-2 text-[#00bfa5] font-bold">{item.position}</td>
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
