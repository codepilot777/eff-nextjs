"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-lido-950 text-slate-300 font-sans p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-3">✈️ Cathay Pacific Flight Training Hub</h1>
        <h2 className="text-xl text-status-teal font-bold">EFF & eTechLog Simulator Portal (Next.js)</h2>
      </div>

      <div className="flex gap-6 w-full max-w-4xl">
        <Link href="/flight-select?role=Trainee" className="flex-1 block">
          <button className="w-full h-80 flex flex-col items-center justify-center bg-lido-800 border-2 border-[#333333] rounded-xl hover:border-[#00bfa5] hover:bg-lido-800 hover:shadow-[0_0_20px_rgba(0,191,165,0.4)] transition-all group">
            <span className="text-5xl mb-4">👨‍✈️</span>
            <span className="text-2xl font-bold text-white mb-2">TRAINEE PILOT PORTAL</span>
            <span className="text-text-muted text-center px-4">Access EFB, sign documents,<br/>and communicate with ATC.</span>
          </button>
        </Link>

        <Link href="/instructor" className="flex-1 block">
          <button className="w-full h-80 flex flex-col items-center justify-center bg-lido-800 border-2 border-[#333333] rounded-xl hover:border-[#00bfa5] hover:bg-lido-800 hover:shadow-[0_0_20px_rgba(0,191,165,0.4)] transition-all group">
            <span className="text-5xl mb-4">📡</span>
            <span className="text-2xl font-bold text-white mb-2">IOS INSTRUCTOR STATION</span>
            <span className="text-text-muted text-center px-4">Inject defects, dispatch paperwork,<br/>upload OFP and manage payload.</span>
          </button>
        </Link>
      </div>
    </div>
  );
}