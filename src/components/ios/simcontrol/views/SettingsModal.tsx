"use client";
import { useState, useEffect } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [fsuipcUrl, setFsuipcUrl] = useState("ws://127.0.0.1:2048/fsuipc");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedUrl = localStorage.getItem("ios_fsuipc_url");
      if (savedUrl) setFsuipcUrl(savedUrl);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem("ios_fsuipc_url", fsuipcUrl);
    setIsSaved(true);
    
    setTimeout(() => {
      onClose();
      alert("⚙️ WebSocket IP Saved! Please refresh the page to reconnect.");
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col">
        
        <div className="flex justify-between items-center p-6 border-b border-[#333] bg-[#222]">
          <h3 className="text-[#2979FF] font-black text-lg tracking-widest uppercase flex items-center gap-3 m-0">
            <span>⚙️ SYSTEM SETTINGS</span>
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">FSUIPC WebSocket Server URL</label>
            <input 
              type="text" 
              value={fsuipcUrl}
              onChange={(e) => setFsuipcUrl(e.target.value)}
              placeholder="e.g. ws://192.168.1.100:2048/fsuipc"
              className="bg-black border border-[#444] text-[#00E676] font-mono text-sm p-3 rounded-lg focus:outline-none focus:border-[#2979FF] w-full"
            />
            <p className="text-[0.65rem] text-gray-500 font-mono mt-1">
              * The IP address of the PC running P3D and FSUIPC WebSocket Server.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[#333] bg-[#111] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg font-bold text-xs tracking-widest uppercase text-gray-400 hover:text-white transition-all">
            CANCEL
          </button>
          <button 
            onClick={handleSave}
            className={`px-8 py-2.5 rounded-lg font-black text-xs tracking-widest uppercase transition-all shadow-md ${
              isSaved ? "bg-[#00E676] text-black" : "bg-[#2979FF] text-white hover:bg-[#2979FF]/80 active:scale-95"
            }`}
          >
            {isSaved ? "✅ SAVED" : "💾 SAVE CONFIG"}
          </button>
        </div>

      </div>
    </div>
  );
}