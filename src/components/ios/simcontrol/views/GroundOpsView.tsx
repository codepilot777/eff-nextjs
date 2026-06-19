"use client";
import { PMDG_GROUND_OPS } from "@/data/pmdgCommands";
import { sendPMDGControl } from "@/services/pmdgService";

export default function GroundOpsView({ isConnected, sendToFSUIPC }: any) {
  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <h4 className="text-[#00bfa5] font-bold font-mono tracking-widest text-sm mb-2">DOORS & EXTERNAL POWER</h4>
      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 content-start">
        {PMDG_GROUND_OPS.map((cmd) => (
          <button
            key={cmd.id} disabled={!isConnected} onClick={() => sendPMDGControl(sendToFSUIPC, cmd.eventId!)}
            className={`p-5 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-md ${
              !isConnected ? "bg-[#222]/30 border-[#333] opacity-30 cursor-not-allowed" : "bg-[#252525] border-[#444] hover:bg-[#333] hover:border-[#00bfa5] text-white"
            }`}
          >
            <span className="text-3xl">{cmd.icon}</span>
            <span className="text-xs font-black uppercase tracking-wider text-center">{cmd.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}