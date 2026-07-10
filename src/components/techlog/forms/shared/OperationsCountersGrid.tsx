"use client";
import { SectorCloseTheme, FOCUS_BORDER } from "./theme";

interface OperationsCountersGridProps {
  theme: SectorCloseTheme;
  landingsCount: string; setLandingsCount: (v: string) => void;
  overshoots: string; setOvershoots: (v: string) => void;
  touchGo: string; setTouchGo: (v: string) => void;
}

export function OperationsCountersGrid({ theme, landingsCount, setLandingsCount, overshoots, setOvershoots, touchGo, setTouchGo }: OperationsCountersGridProps) {
  const focusBorder = FOCUS_BORDER[theme];
  return (
    <div className="grid grid-cols-3 gap-5">
      {[
        { label: 'Landings', state: landingsCount, setter: setLandingsCount },
        { label: 'Overshoots', state: overshoots, setter: setOvershoots },
        { label: 'Touch-and-gos', state: touchGo, setter: setTouchGo }
      ].map(item => (
        <div key={item.label}>
          <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">{item.label}</label>
          <input
            type="number" min="0"
            value={item.state}
            onChange={e => item.setter(e.target.value)}
            className={`w-full bg-[#0a0a0a] border border-[#444] p-3.5 rounded-xl font-mono font-bold text-white text-center outline-none ${focusBorder} transition-colors shadow-inner`}
          />
        </div>
      ))}
    </div>
  );
}
