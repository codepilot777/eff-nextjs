"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InstructorHub() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState("");
  const [flights, setFlights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 建立新航班的表單與狀態
  const [sbUser, setSbUser] = useState("EFFSIM");
  const [fltNo, setFltNo] = useState("CPA 564");
  const [dep, setDep] = useState("VHHH");
  const [arr, setArr] = useState("RJBB");
  
  // 🌟 將覆寫欄位移到這裡，作為「必須先輸入」的欄位
  const [editZfw, setEditZfw] = useState<number>(0);
  const [editCmdr, setEditCmdr] = useState<string>("");
  
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("instructor_user") || "Unknown";
    setCurrentUser(user);
    fetchFlights();
  }, []);

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

  const isAdmin = currentUser.toLowerCase() === "admin";
  const visibleFlights = flights.filter(f => isAdmin || f.created_by === currentUser);

  const getSimbriefUrl = () => {
    const parts = fltNo.split(" ");
    const airline = parts.length > 0 ? parts[0] : "CPA";
    const fltnum = parts.length > 1 ? parts[1] : "564";
    return `https://www.simbrief.com/system/dispatch.php?airline=${airline}&fltnum=${fltnum}&orig=${dep}&dest=${arr}`;
  };

  const handleFetchPreview = async () => {
    if (!sbUser) return alert("Please enter a SimBrief Username.");
    
    setIsFetchingPreview(true);
    try {
      const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?username=${sbUser}&json=1`);
      const data = await res.json();
      
      if (data?.fetch?.status !== 'Success') {
        alert(`SimBrief Error: ${data?.fetch?.status || 'Unknown error'}`);
        return;
      }
      
      setPreviewHtml(data.text?.plan_html || "<p>No briefing HTML available.</p>");
      
      // 如果教官沒有輸入 Commander 或 ZFW，自動以 SimBrief 運算的數值補上
      if (!editZfw) {
         setEditZfw(parseFloat(data.weights?.est_zfw || 0) / 1000);
      }
      if (!editCmdr) {
         setEditCmdr(data.general?.captain || "INSTRUCTOR");
      }
      
    } catch (error) {
      console.error("Fetch Simbrief preview error:", error);
      alert("Network error fetching SimBrief.");
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const handleConfirmCreate = async (publish: boolean) => {
    setIsCreatingSession(true);
    try {
      const res = await fetch('/api/simbrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: sbUser,
          flightNo: fltNo,
          created_by: currentUser,
          is_published: publish,
          zfw_override: editZfw, // 帶入教官先設定好的 ZFW
          commander_override: editCmdr // 帶入教官先設定好的 Commander
        })
      });

      const result = await res.json();

      if (res.ok) {
        setPreviewHtml(null); 
        await fetchFlights(); 
        alert(`✅ Flight ${result.flight_no} successfully created ${publish ? 'and published!' : 'as DRAFT!'}`);
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

  const handleDeleteFlight = async (id: string) => {
    if (!confirm(`Are you sure you want to permanently delete flight ${id}?`)) return;
    try {
      const res = await fetch('/api/flight/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchFlights();
      } else {
        alert("Failed to delete flight.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublishFlight = async (flightData: any) => {
    try {
      const updatedData = { ...flightData, is_published: true };
      const res = await fetch('/api/flight/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flightData._db_id, data: updatedData })
      });
      if (res.ok) {
        await fetchFlights();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-lido-950 text-slate-300 font-sans p-8 overflow-y-auto">
      
      <div className="flex justify-between items-center mb-8 border-b-2 border-[#333333] pb-4">
        <div>
          <h1 className="text-3xl font-black text-status-teal">📡 IOS INSTRUCTOR STATION</h1>
          <h2 className="text-text-muted font-bold mt-1 flex items-center gap-3">
            Session Management Hub 
            <span className="bg-lido-800 px-3 py-1 rounded-full text-xs border border-[#404040] text-white">
              👤 Logged in as: {currentUser}
            </span>
          </h2>
        </div>
        <Link href="/">
          <button className="bg-lido-800 border border-[#404040] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#34495e] transition-colors">
            🚪 LOGOUT
          </button>
        </Link>
      </div>

      {/* ========================================== */}
      {/* 1. 現有航班列表 (Active & Draft Sessions)    */}
      {/* ========================================== */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-white mb-4">▶ Your Simulator Sessions</h3>
        
        {isLoading ? (
          <div className="text-status-teal animate-pulse font-bold">Loading database...</div>
        ) : visibleFlights.length === 0 ? (
          <div className="bg-lido-800 border border-[#333333] rounded-xl p-8 text-center text-text-muted">
            No sessions found for your account. Please create a new flight below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleFlights.map((f) => (
              <div key={f._db_id} className="bg-lido-800 border border-[#333333] rounded-xl p-5 hover:border-[#00bfa5] hover:shadow-[0_0_15px_rgba(0,191,165,0.2)] transition-all flex flex-col relative">
                
                <button 
                  onClick={() => handleDeleteFlight(f._db_id)}
                  className="absolute top-4 right-4 text-text-muted hover:text-[#FF1744] font-black text-xl transition-colors"
                  title="Delete Session"
                >
                  🗑️
                </button>

                <div className="flex justify-start items-center mb-3 gap-3 pr-8">
                  <h4 className="text-status-teal font-black text-2xl m-0">{f.flight_no}</h4>
                  {f.is_published ? (
                    <span className="bg-[#00E676]/20 text-[#00E676] text-[0.65rem] font-bold px-2 py-1 rounded border border-[#00E676]">PUBLISHED</span>
                  ) : (
                    <span className="bg-[#FF9100]/20 text-[#FF9100] text-[0.65rem] font-bold px-2 py-1 rounded border border-[#FF9100]">DRAFT</span>
                  )}
                </div>
                
                <div className="text-text-main text-sm mb-1">
                  <strong className="text-text-muted">Route:</strong> {f.dep_icao} ➔ {f.arr_icao}
                </div>
                <div className="text-text-main text-sm mb-1">
                  <strong className="text-text-muted">Aircraft:</strong> {f.aircraft_reg} ({f.aircraft_type})
                </div>
                <div className="text-text-main text-[0.7rem] mb-4">
                  <strong className="text-text-muted">Created By:</strong> {f.created_by}
                </div>
                
                <div className="mt-auto flex gap-2">
                  <button 
                    onClick={() => router.push(`/instructor/ios?id=${encodeURIComponent(f._db_id)}`)}
                    className="flex-[2] py-3 bg-lido-800 border border-[#404040] text-white font-bold rounded-lg hover:bg-[#00bfa5] hover:text-black hover:border-[#00bfa5] transition-colors text-xs"
                  >
                    IOS PANEL
                  </button>
                  
                  {!f.is_published && (
                    <button 
                      onClick={() => handlePublishFlight(f)}
                      className="flex-[1.5] py-3 bg-[#00E676]/20 border border-[#00E676] text-[#00E676] font-bold rounded-lg hover:bg-[#00E676] hover:text-black transition-colors text-xs"
                    >
                      🚀 PUBLISH
                    </button>
                  )}
                </div>
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
        
        <div className="bg-lido-800 border border-[#333333] rounded-xl p-6 flex flex-col lg:flex-row gap-8">
          
          {/* 左側：基礎參數 */}
          <div className="flex-[1.5] flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">SimBrief Username</label>
                <input type="text" value={sbUser} onChange={(e) => setSbUser(e.target.value)} className="w-full bg-lido-950 border border-[#404040] rounded-md p-2 text-white focus:border-[#00bfa5] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Flight Number</label>
                <input type="text" value={fltNo} onChange={(e) => setFltNo(e.target.value)} className="w-full bg-lido-950 border border-[#404040] rounded-md p-2 text-white focus:border-[#00bfa5] outline-none" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">DEP ICAO</label>
                <input type="text" value={dep} onChange={(e) => setDep(e.target.value)} className="w-full bg-lido-950 border border-[#404040] rounded-md p-2 text-white focus:border-[#00bfa5] outline-none uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">ARR ICAO</label>
                <input type="text" value={arr} onChange={(e) => setArr(e.target.value)} className="w-full bg-lido-950 border border-[#404040] rounded-md p-2 text-white focus:border-[#00bfa5] outline-none uppercase" />
              </div>
            </div>
            
            {/* 🌟 Commander 與 ZFW 移至此處，強制輸入 */}
            <hr className="border-[#333333] my-1" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#FF9100] uppercase mb-1">Commander Name</label>
                <input 
                  type="text" 
                  value={editCmdr} 
                  placeholder="e.g. CAPT. YEUNG"
                  onChange={e => setEditCmdr(e.target.value)} 
                  className="w-full bg-[#0a0a0a] border border-[#FF9100] rounded-md p-2 text-white outline-none focus:border-[#00bfa5] uppercase" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#FF9100] uppercase mb-1">ZFW Target (Tons)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={editZfw || ''} 
                  placeholder="Leave 0 for Auto"
                  onChange={e => setEditZfw(parseFloat(e.target.value) || 0)} 
                  className="w-full bg-[#0a0a0a] border border-[#FF9100] rounded-md p-2 text-[#FF9100] font-black outline-none focus:border-[#00bfa5]" 
                />
              </div>
            </div>
          </div>

          {/* 右側：抓取流程 */}
          <div className="flex-1 flex flex-col justify-center gap-4 bg-[#0a0a0a] p-6 rounded-lg border border-[#1d2733]">
            <h4 className="text-status-teal font-bold mb-2">🚀 Dispatch Workflow</h4>
            
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
                  ? "bg-[#34495e] text-text-muted cursor-not-allowed" 
                  : "bg-[#00bfa5]/20 border-2 border-[#00bfa5] text-status-teal hover:bg-[#00bfa5] hover:text-black"
              }`}
            >
              {isFetchingPreview ? "⏳ FETCHING FROM SIMBRIEF..." : "2️⃣ PREVIEW FLIGHT PLAN"}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. 預覽與進階覆寫視窗 (Review & Override)    */}
      {/* ========================================== */}
      {previewHtml && (
        <div className="mt-8 bg-lido-800 border border-[#00bfa5] rounded-xl p-6 shadow-[0_0_20px_rgba(0,191,165,0.15)] animate-fade-in-up">
          <h4 className="text-status-teal font-bold text-xl mb-4">📝 Review SimBrief Plan</h4>
          
          <div 
            className="bg-[#0a0a0a] text-text-main p-4 rounded-lg overflow-y-auto max-h-[400px] border border-[#404040]"
            style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "13px", lineHeight: "1.3" }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />

          <div className="flex gap-4 mt-6">
            <button 
              onClick={() => setPreviewHtml(null)} 
              className="flex-1 py-4 bg-lido-800 border border-[#404040] text-white rounded-lg font-bold hover:bg-[#FF1744] transition-colors"
            >
              ❌ CANCEL
            </button>
            <button 
              onClick={() => handleConfirmCreate(false)} 
              disabled={isCreatingSession}
              className="flex-1 py-4 bg-[#FF9100]/20 border border-[#FF9100] text-[#FF9100] font-black rounded-lg hover:bg-[#FF9100] hover:text-black transition-all"
            >
              💾 SAVE AS DRAFT
            </button>
            <button 
              onClick={() => handleConfirmCreate(true)} 
              disabled={isCreatingSession}
              className="flex-1 py-4 bg-[#C6FF00] text-black font-black rounded-lg hover:bg-[#00c853] shadow-[0_4px_15px_rgba(0,230,118,0.4)] transition-all"
            >
              ✅ PUBLISH TO EFB
            </button>
          </div>
        </div>
      )}

    </div>
  );
}