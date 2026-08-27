"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-lido-950 text-slate-300 font-sans p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-3">✈️ Electronic Flight Folder Mock Up</h1>
        <h2 className="text-xl text-status-teal font-bold">For training purpose only, not for operational use.</h2>
      </div>

      <div className="flex gap-6 w-full max-w-4xl">
        <Link href="/flight-select?role=Trainee" className="flex-1 block">
          <button className="w-full h-80 flex flex-col items-center justify-center bg-lido-800 border-2 border-[#333333] rounded-xl hover:border-[#00bfa5] hover:bg-lido-800 hover:shadow-[0_0_20px_rgba(0,191,165,0.4)] transition-all group">
            <span className="text-5xl mb-4">👨‍✈️</span>
            <span className="text-2xl font-bold text-white">Trainee</span>
          </button>
        </Link>

        <Link href="/instructor" className="flex-1 block">
          <button className="w-full h-80 flex flex-col items-center justify-center bg-lido-800 border-2 border-[#333333] rounded-xl hover:border-[#00bfa5] hover:bg-lido-800 hover:shadow-[0_0_20px_rgba(0,191,165,0.4)] transition-all group">
            <span className="text-5xl mb-4">📡</span>
            <span className="text-2xl font-bold text-white">Instructor</span>
          </button>
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="uppercase tracking-widest text-slate-600 font-bold">Trainee Guides</span>
          <a href="https://claude.ai/code/artifact/928a97e2-ecef-4f19-93d6-98ceb48a965c" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-status-teal transition-colors">Quick Start</a>
          <a href="https://claude.ai/code/artifact/046dfdc1-1962-4cdf-8021-cdada5e954d6" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-status-teal transition-colors">Operating Procedures</a>
        </div>
        <div className="flex items-center gap-3">
          <span className="uppercase tracking-widest text-slate-600 font-bold">Instructor Guides</span>
          <a href="https://claude.ai/code/artifact/4a854464-f15d-4e9f-9f3c-c290ed1d8f4a" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-status-teal transition-colors">Quick Start</a>
          <a href="https://claude.ai/code/artifact/54afdb61-3840-4642-b2d3-5f1f8c481572" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-status-teal transition-colors">Operating Procedures</a>
        </div>
      </div>
    </div>
  );
}