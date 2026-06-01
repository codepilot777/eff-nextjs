"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [showPinModal, setShowPinModal] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "0564" && username.trim() !== "") {
      setShowPinModal(false);
      // 儲存教官名稱到 LocalStorage，供後續篩選權限使用
      localStorage.setItem("instructor_user", username.trim());
      router.push("/instructor");
    } else {
      setError("Invalid PIN or missing Username.");
      setPin("");
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setError("");
    setPin("");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#080a0d] text-slate-300 font-sans p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-3">✈️ Cathay Pacific Flight Training Hub</h1>
        <h2 className="text-xl text-[#00bfa5] font-bold">EFF & eTechLog Simulator Portal (Next.js)</h2>
      </div>

      <div className="flex gap-6 w-full max-w-4xl">
        <Link href="/flight-select?role=Trainee" className="flex-1 block">
          <button className="w-full h-80 flex flex-col items-center justify-center bg-[#11161d] border-2 border-[#242f3d] rounded-xl hover:border-[#00bfa5] hover:bg-[#17202a] hover:shadow-[0_0_20px_rgba(0,191,165,0.4)] transition-all group">
            <span className="text-5xl mb-4">👨‍✈️</span>
            <span className="text-2xl font-bold text-white mb-2">TRAINEE PILOT PORTAL</span>
            <span className="text-[#8fa0a6] text-center px-4">Access EFB, sign documents,<br/>and communicate with ATC.</span>
          </button>
        </Link>

        <div className="flex-1 block">
          <button 
            onClick={() => setShowPinModal(true)}
            className="w-full h-80 flex flex-col items-center justify-center bg-[#11161d] border-2 border-[#242f3d] rounded-xl hover:border-[#00bfa5] hover:bg-[#17202a] hover:shadow-[0_0_20px_rgba(0,191,165,0.4)] transition-all group"
          >
            <span className="text-5xl mb-4">📡</span>
            <span className="text-2xl font-bold text-white mb-2">IOS INSTRUCTOR STATION</span>
            <span className="text-[#8fa0a6] text-center px-4">Inject defects, dispatch paperwork,<br/>upload OFP and manage payload.</span>
          </button>
        </div>
      </div>

      {/* 密碼驗證與帳號輸入彈出視窗 */}
      {showPinModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-8 max-w-md w-full shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <h3 className="text-2xl font-bold text-[#00bfa5] mb-2 text-center">Instructor Login</h3>
            <p className="text-[#8fa0a6] mb-6 text-center text-sm">Enter your Name and IOS PIN (Default: 0564)<br/>Type "admin" to manage all sessions.</p>
            
            <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#080a0d] border border-[#34495e] rounded-lg p-3 text-white text-center font-bold focus:outline-none focus:border-[#00bfa5] transition-colors"
                placeholder="Username (e.g. Capt. Chan or admin)"
                required
                autoFocus
              />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-[#080a0d] border border-[#34495e] rounded-lg p-3 text-white text-center text-xl tracking-[0.5em] focus:outline-none focus:border-[#00bfa5] transition-colors"
                placeholder="••••"
                required
              />
              
              {error && <div className="text-[#FF1744] text-sm text-center font-bold animate-pulse">{error}</div>}
              
              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={closePinModal} 
                  className="flex-1 py-3 rounded-lg border border-[#34495e] text-[#8fa0a6] hover:bg-[#34495e] hover:text-white transition-colors font-bold"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-lg bg-[#00bfa5]/20 border border-[#00bfa5] text-[#00bfa5] hover:bg-[#00bfa5] hover:text-black transition-colors font-bold"
                >
                  AUTHORIZE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}