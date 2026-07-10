"use client";
import { SectorCloseTheme, FOCUS_BORDER } from "./theme";

interface BlockTimesGridProps {
  theme: SectorCloseTheme;
  blocksOff: string; setBlocksOff: (v: string) => void;
  takeOff: string; setTakeOff: (v: string) => void;
  landing: string; setLanding: (v: string) => void;
  blocksOn: string; setBlocksOn: (v: string) => void;
}

export function BlockTimesGrid({ theme, blocksOff, setBlocksOff, takeOff, setTakeOff, landing, setLanding, blocksOn, setBlocksOn }: BlockTimesGridProps) {
  const focusBorder = FOCUS_BORDER[theme];
  return (
    <div className="grid grid-cols-4 gap-4">
      {['Blocks Off (Z)', 'Take Off (Z)', 'Landing (Z)', 'Blocks On (Z)'].map((label, i) => {
        const state = [blocksOff, takeOff, landing, blocksOn][i];
        const setter = [setBlocksOff, setTakeOff, setLanding, setBlocksOn][i];
        return (
          <div key={label}>
            <label className="block text-[0.6rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">{label}</label>
            <input
              type="text"
              value={state}
              onChange={e => setter(e.target.value)}
              className={`w-full bg-[#0a0a0a] border border-[#444] p-3.5 rounded-xl font-mono font-bold text-white text-center outline-none ${focusBorder} transition-colors shadow-inner placeholder:text-[#333]`}
              placeholder="e.g. 0345"
              maxLength={4}
            />
          </div>
        );
      })}
    </div>
  );
}
