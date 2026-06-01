"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InstructorHub() {
  const router = useRouter();
  const [flights, setFlights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 建立新航班的表單與狀態
  const [sbUser, setSbUser] = useState("EFFSIM");
  const [fltNo, setFltNo] = useState("CPA 564");
  const [dep, setDep] = useState("VHHH");
  const [arr, setArr] = useState("RJBB");
  
  // 預覽與建立的狀態
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const fetchFlights = async () => {
    try {
      const res = await fetch('/api/flights');
      if (res.ok) {
        const data = await res.json();
        setFlights(data);
      }
    } catch (error) {
      console.error("Failed to load flights", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  const getSimbriefUrl = () => {
    const parts = fltNo.split(" ");
    const airline = parts.length > 0 ? parts[0] : "CPA";
    const fltnum = parts.length > 1 ? parts[1] : "564";
    return `https://www.simbrief.com/system/dispatch.php?airline=${airline}&fltnum=${fltnum}&orig=${dep}&dest=${arr}`;
  };

  // 🌟 步驟一：先從 SimBrief 獲取預覽 HTML
  const handleFetchPreview = async () => {
    if (!sbUser) return alert("Please enter a SimBrief Username.");
    
    setIsFetchingPreview(true);
    try {
      // 透過 Client-side Fetch 拿取 SimBrief 數據 (CORS is supported by SimBrief)
      const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?username=${sbUser}&json=1`);
      const data = await res.json();
      
      if (data?.fetch?.status !== 'Success') {
        alert(`SimBrief Error: ${data?.fetch?.status || 'Unknown error'}`);
        return;
      }
      
      setPreviewHtml(data.text?.plan_html || "<p>No briefing HTML available.</p>");
      
    } catch (error) {
      console.error("Fetch Simbrief preview error:", error);
      alert("Network error fetching SimBrief.");
    } finally {
      setIsFetchingPreview(false);
    }
  };

  // 🌟 步驟二：確認後呼叫後端 API 儲存進 SQLite
  const handleConfirmCreate = async () => {
    setIsCreatingSession(true);
    try {
      const res = await fetch('/api/simbrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: sbUser,
          flightNo: fltNo
        })
      });

      const result = await res.json();

      if (res.ok) {
        setPreviewHtml(null); // 關閉預覽
        await fetchFlights(); // 重新載入航班清單
        alert(`✅ Flight ${result.flight_no} successfully fetched and created!`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Create session error:", error);
      alert("Network error while creating session.");
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0d] text-slate-300 font-sans p-8 overflow-y-auto">
      
      {/* 頂部標題與導航 */}
      <div className="flex justify-between items-center mb-8 border-b-2 border-[#242f3d] pb-4">
        <div>
          <h1 className="text-3xl font-black text-[#00bfa5]">📡 IOS INSTRUCTOR STATION</h1>
          <h2 className="text-[#8fa0a6] font-bold mt-1">Session Management Hub</h2>
        </div>
        <Link href="/">
          <button className="bg-[#17202a] border border-[#34495e] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#34495e] transition-colors">
            🚪 LOGOUT
          </button>
        </Link>
      </div>

      {/* ========================================== */}
      {/* 1. 現有航班列表 (Active Sessions)            */}
      {/* ========================================== */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-white mb-4">▶ Active Simulator Sessions</h3>
        
        {isLoading ? (
          <div className="text-[#00bfa5] animate-pulse font-bold">Loading database...</div>
        ) : flights.length === 0 ? (
          <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-8 text-center text-[#8fa0a6]">
            No active sessions found. Please create a new flight below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flights.map((f) => (
              <div key={f._db_id} className="bg-[#11161d] border border-[#242f3d] rounded-xl p-5 hover:border-[#00bfa5] hover:shadow-[0_0_15px_rgba(0,191,165,0.2)] transition-all flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-[#00bfa5] font-black text-2xl">{f.flight_no}</h4>
                  <span className="bg-[#00E676]/20 text-[#00E676] text-xs font-bold px-2 py-1 rounded border border-[#00E676]">
                    V{f.ofp_version || 1}
                  </span>
                </div>
                
                <div className="text-[#e2e8f0] text-sm mb-1">
                  <strong className="text-[#8fa0a6]">Route:</strong> {f.dep_icao} ➔ {f.arr_icao}
                </div>
                <div className="text-[#e2e8f0] text-sm mb-4">
                  <strong className="text-[#8fa0a6]">Aircraft:</strong> {f.aircraft_reg} ({f.aircraft_type})
                </div>
                
                <button 
                  onClick={() => router.push(`/instructor/ios?id=${encodeURIComponent(f._db_id)}`)}
                  className="mt-auto w-full py-3 bg-[#17202a] border border-[#34495e] text-white font-bold rounded-lg hover:bg-[#00bfa5] hover:text-black hover:border-[#00bfa5] transition-colors"
                >
                  ENTER IOS PANEL
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 2. 建立新航班 (Create New Session)           */}
      {/* ========================================== */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">➕ Create New Simulator Flight</h3>
        
        <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-6 flex flex-col lg:flex-row gap-8">
          
          {/* 左側：輸入表單 */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-[#8fa0a6] uppercase mb-1">SimBrief Username</label>
              <input 
                type="text" 
                value={sbUser} 
                onChange={(e) => setSbUser(e.target.value)}
                className="w-full bg-[#080a0d] border border-[#34495e] rounded-md p-2 text-white focus:border-[#00bfa5] outline-none"
              />
            </div>
            <hr className="border-[#242f3d] my-2" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#8fa0a6] uppercase mb-1">Flight Number</label>
                <input type="text" value={fltNo} onChange={(e) => setFltNo(e.target.value)} className="w-full bg-[#080a0d] border border-[#34495e] rounded-md p-2 text-white focus:border-[#00bfa5] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#8fa0a6] uppercase mb-1">DEP</label>
                  <input type="text" value={dep} onChange={(e) => setDep(e.target.value)} className="w-full bg-[#080a0d] border border-[#34495e] rounded-md p-2 text-white focus:border-[#00bfa5] outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8fa0a6] uppercase mb-1">ARR</label>
                  <input type="text" value={arr} onChange={(e) => setArr(e.target.value)} className="w-full bg-[#080a0d] border border-[#34495e] rounded-md p-2 text-white focus:border-[#00bfa5] outline-none uppercase" />
                </div>
              </div>
            </div>
          </div>

          {/* 右側：動作流程 */}
          <div className="flex-1 flex flex-col justify-center gap-4 bg-[#0a0a0a] p-6 rounded-lg border border-[#1d2733]">
            <h4 className="text-[#00bfa5] font-bold mb-2">🚀 Dispatch Workflow</h4>
            
            <a href={getSimbriefUrl()} target="_blank" rel="noreferrer" className="w-full">
              <button className="w-full bg-[#FF9100] text-black font-black py-3 rounded-lg hover:bg-[#ffA000] shadow-[0_4px_10px_rgba(255,145,0,0.3)] transition-all">
                1️⃣ OPEN SIMBRIEF & GENERATE
              </button>
            </a>
            
            <button 
              onClick={handleFetchPreview}
              disabled={isFetchingPreview}
              className={`w-full font-black py-3 rounded-lg transition-all ${
                isFetchingPreview 
                  ? "bg-[#34495e] text-[#8fa0a6] cursor-not-allowed" 
                  : "bg-[#00bfa5]/20 border-2 border-[#00bfa5] text-[#00bfa5] hover:bg-[#00bfa5] hover:text-black"
              }`}
            >
              {isFetchingPreview ? "⏳ FETCHING FROM SIMBRIEF..." : "2️⃣ PREVIEW FLIGHT PLAN"}
            </button>
            <p className="text-xs text-[#8fa0a6] text-center mt-2">
              Preview the OFP before injecting it into the EFF database.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. 預覽視窗 (Briefing Preview)               */}
      {/* ========================================== */}
      {previewHtml && (
        <div className="mt-8 bg-[#11161d] border border-[#242f3d] rounded-xl p-6 shadow-2xl animate-fade-in-up">
          <h4 className="text-[#00bfa5] font-bold text-xl mb-2">📝 Review Flight Briefing</h4>
          <p className="text-[#8fa0a6] mb-4">Review the briefing below and confirm to create the session.</p>
          
          {/* LIDO 電報顯示區 */}
          <div 
            className="bg-[#0a0a0a] text-[#e2e8f0] p-4 rounded-lg overflow-y-auto max-h-[500px] border border-[#34495e]"
            style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "13px", lineHeight: "1.3" }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />

          <div className="flex gap-4 mt-6">
            <button 
              onClick={() => setPreviewHtml(null)} 
              className="flex-1 py-4 bg-[#17202a] border border-[#34495e] text-white rounded-lg font-bold hover:bg-[#34495e] transition-colors"
            >
              ❌ CANCEL
            </button>
            <button 
              onClick={handleConfirmCreate} 
              disabled={isCreatingSession}
              className={`flex-1 py-4 font-black rounded-lg transition-all ${
                isCreatingSession 
                  ? "bg-[#34495e] text-[#8fa0a6] cursor-not-allowed" 
                  : "bg-[#00bfa5] text-black hover:bg-[#00E676] shadow-[0_0_15px_rgba(0,230,118,0.4)]"
              }`}
            >
              {isCreatingSession ? "⏳ CREATING SESSION..." : "✅ CONFIRM AND CREATE SESSION"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}