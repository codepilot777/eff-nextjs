"use client";
import { SectorCloseTheme, FOCUS_BORDER } from "./theme";

interface EdtoAutolandSelectsProps {
  theme: SectorCloseTheme;
  edto: string; setEdto: (v: string) => void;
  autoland: string; setAutoland: (v: string) => void;
}

export function EdtoAutolandSelects({ theme, edto, setEdto, autoland, setAutoland }: EdtoAutolandSelectsProps) {
  const focusBorder = FOCUS_BORDER[theme];
  return (
    <div className="grid grid-cols-2 gap-5">
      <div>
        <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">EDTO</label>
        <div className="relative">
          <select value={edto} onChange={e => setEdto(e.target.value)} className={`w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-sans font-bold text-white text-[0.75rem] uppercase tracking-widest outline-none appearance-none cursor-pointer ${focusBorder} shadow-inner transition-colors`}>
            <option>No</option><option>60 mins</option><option>120 mins</option><option>180 mins</option><option>207 mins</option><option>240 mins</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#8fa0a6]">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Autoland</label>
        <div className="relative">
          <select value={autoland} onChange={e => setAutoland(e.target.value)} className={`w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-sans font-bold text-white text-[0.75rem] uppercase tracking-widest outline-none appearance-none cursor-pointer ${focusBorder} shadow-inner transition-colors`}>
            <option>Not Attempted</option><option>Successful</option><option>Unsuccessful</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#8fa0a6]">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
