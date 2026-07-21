"use client";

export function ModalCrew({ flightData }: any) {
  const cmdrName = flightData?.commander_override || "SCOTT HILHORST";
  const roster = flightData?.crew_roster;
  const flightDeck = roster?.flight_deck || [];
  const cabinCrew = roster?.cabin_crew || [];

  return (
    <div className="w-full h-full font-sans flex flex-col gap-5">
      <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-5 shadow-lg">
        <h3 className="text-white font-bold tracking-widest uppercase text-[0.9rem] mb-3">Flight Deck</h3>
        <table className="w-full text-left font-mono text-[0.85rem]">
          <tbody>
            <tr className="border-b border-[#222]">
              <td className="py-2 pr-4 text-[#C6FF00]">✓</td>
              <td className="py-2 pr-4 text-white">{cmdrName}</td>
              <td className="py-2 text-[#8fa0a6] text-[0.7rem] bg-[#333] px-1.5 rounded w-max">T-CN</td>
            </tr>
            {flightDeck.length === 0 ? (
              <tr><td colSpan={3} className="py-2 text-[#8fa0a6] italic">No additional flight deck crew assigned.</td></tr>
            ) : (
              flightDeck.map((m: any, idx: number) => (
                <tr key={idx} className="border-b border-[#222] last:border-0">
                  <td className="py-2 pr-4 text-[#C6FF00]">{m.on_duty ? "✓" : "⊗"}</td>
                  <td className={`py-2 pr-4 ${m.on_duty ? "text-white" : "text-[#8fa0a6]"}`}>{m.name}</td>
                  <td className="py-2 text-[#8fa0a6] text-[0.7rem] bg-[#333] px-1.5 rounded w-max">{m.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-5 shadow-lg">
        <h3 className="text-white font-bold tracking-widest uppercase text-[0.9rem] mb-3 flex items-center gap-2">
          Cabin Crew
          <span className="text-[#8fa0a6] text-xs font-mono font-normal">({cabinCrew.length})</span>
        </h3>
        {cabinCrew.length === 0 ? (
          <div className="text-[#8fa0a6] italic text-sm">No cabin crew assigned.</div>
        ) : (
          <table className="w-full text-left font-mono text-[0.85rem]">
            <tbody>
              {cabinCrew.map((m: any, idx: number) => (
                <tr key={idx} className="border-b border-[#222] last:border-0">
                  <td className="py-2 pr-4 w-6 text-[#C6FF00]">{m.on_duty ? "✓" : "⊗"}</td>
                  <td className={`py-2 pr-4 ${m.on_duty ? "text-white" : "text-[#8fa0a6]"}`}>{m.name}</td>
                  <td className="py-2 text-[#8fa0a6] text-[0.7rem] bg-[#333] px-1.5 rounded w-max">{m.role}</td>
                  <td className="py-2 text-right text-[0.7rem] text-[#555]">{m.on_duty ? "On Duty" : "Off Duty"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
