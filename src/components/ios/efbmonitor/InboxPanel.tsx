"use client";
import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦
import { useTechlogData } from "@/hooks/useTechlogData";

// 🌟 Props 大清洗：剷走晒 flightData 同 updateFlightData
export default function InboxPanel() {
  const [isGeneratingAtis, setIsGeneratingAtis] = useState<number | null>(null);

  // 🌟 ATIS Library（教官預先上傳）嘅表格 state
  const [libIcao, setLibIcao] = useState("");
  const [libType, setLibType] = useState("DEPARTURE");
  const [libContent, setLibContent] = useState("");
  const [libEditingKey, setLibEditingKey] = useState<string | null>(null);
  const [isGeneratingLib, setIsGeneratingLib] = useState(false);

  // 🌟 從天上直接抽取 Data 同 Update Function (全域共用，自帶樂觀更新！)
  const { flightData, updateFlightData, sendFlightDirective } = useFlightData();

  // 🌟 修復：tl_accept 淨係存喺獨立嘅 techlogs 表（keyed by aircraft reg），
  // 唔喺 flights 表嘅 flightData 度——之前直接讀 flightData.tl_accept 永遠
  // undefined，令 Aircraft Accepted 狀態卡死喺 PENDING。跟返 RefuelAircraftColumn.tsx
  // 個做法，獨立自主 fetch 返 techlog data
  const { data: techlogData } = useTechlogData(flightData);

  // 🌟 防呆保護：如果未 Load 到 Data，就唔好 Render
  if (!flightData) return null;

  const generateAtis = async (idx: number, req: any) => {
    setIsGeneratingAtis(idx);
    try {
      const plainText = `Create a realistic ${req.type} ATIS for ${req.icao}. Flight ${flightData?.flight_no || 'CPA564'}.`;
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType: "ATIS", plainText, stdZ: flightData?.std_z || "0000Z", staZ: flightData?.sta_z || "0000Z" })
      });
      const data = await res.json();
      if (res.ok) {
        const input = document.getElementById(`ios_atis_input_${idx}`) as HTMLTextAreaElement;
        if (input) input.value = data.text;
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("AI Service Error");
    } finally {
      setIsGeneratingAtis(null);
    }
  };

  // 🌟 教官預先上傳/覆寫嘅 ATIS 內容庫，keyed by icao+type——trainee 側
  // AtisController.tsx request ATIS 之後 15 秒，會由 server 直接讀呢個
  // array 攞返對應嗰個版本出嚟（睇 atisAutoDeliver directive）
  const atisLibrary: any[] = flightData.atis_library || [];

  const generateLibAtis = async () => {
    if (!libIcao.trim()) return;
    setIsGeneratingLib(true);
    try {
      const plainText = `Create a realistic ${libType} ATIS for ${libIcao.trim().toUpperCase()}. Flight ${flightData?.flight_no || 'CPA564'}.`;
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType: "ATIS", plainText, stdZ: flightData?.std_z || "0000Z", staZ: flightData?.sta_z || "0000Z" })
      });
      const data = await res.json();
      if (res.ok) setLibContent(data.text);
      else alert(data.error);
    } catch (e) {
      alert("AI Service Error");
    } finally {
      setIsGeneratingLib(false);
    }
  };

  const resetLibForm = () => {
    setLibIcao(""); setLibContent(""); setLibEditingKey(null);
  };

  const handleSaveLibEntry = () => {
    const icao = libIcao.trim().toUpperCase();
    if (!icao || !libContent.trim()) {
      alert("ICAO and content are required.");
      return;
    }
    // 🌟 Upsert：keyed by icao+type，一個機場+type 淨係得一份「而家嗰個版本」
    const withoutExisting = atisLibrary.filter((e: any) => !(e.icao === icao && e.type === libType));
    updateFlightData({ atis_library: [...withoutExisting, { icao, type: libType, content: libContent.trim() }] });
    resetLibForm();
  };

  const handleEditLibEntry = (entry: any) => {
    setLibIcao(entry.icao);
    setLibType(entry.type);
    setLibContent(entry.content);
    setLibEditingKey(`${entry.icao}-${entry.type}`);
  };

  const handleDeleteLibEntry = (entry: any) => {
    updateFlightData({ atis_library: atisLibrary.filter((e: any) => !(e.icao === entry.icao && e.type === entry.type)) });
    if (libEditingKey === `${entry.icao}-${entry.type}`) resetLibForm();
  };

  return (
    // 🌟 min-w-0：同 instructor/ios/page.tsx 嗰邊嘅 flex-[2.6] 兄弟 div 一齊修復——
    // 冇 min-w-0 呢個 flex child 唔會縮得過自己內容嘅 intrinsic 寬度，令成行喺 iPad
    // 寬度爆出嚟俾 overflow-hidden 靜靜雞裁走
    <div className="md:flex-[1.4] min-w-0 flex flex-col gap-4 md:overflow-y-auto pr-0 md:pr-2 pb-4 md:pb-10">
      <h4 className="text-status-teal font-bold text-lg mb-2">📥 INBOX & TELEMETRY</h4>
      
      <div className="bg-lido-800 border border-[#333333] rounded-xl p-4 shadow-sm">
        <div className="text-text-muted text-xs font-bold mb-3 uppercase">Trainee Progress</div>
        <div className="flex justify-between border-b border-dashed border-[#333333] py-2 text-sm">
          <span>Flight Plan:</span>
          {flightData.activated_version > 0 ? <span className="text-[#00E676] font-bold">V{flightData.activated_version} Activated</span> : <span className="text-[#FF9100] font-bold">NOT ACTIVATED</span>}
        </div>
        <div className="flex justify-between border-b border-dashed border-[#333333] py-2 text-sm">
          <span>Aircraft Accepted:</span>
          {techlogData?.tl_accept ? <span className="text-[#00E676] font-bold">YES</span> : <span className="text-[#FF9100] font-bold">PENDING</span>}
        </div>
        <div className="flex justify-between border-b border-dashed border-[#333333] py-2 text-sm">
          <span>Final Fuel:</span>
          {flightData.final_fuel_accepted ? <span className="text-[#00E676] font-bold">ACCEPTED ({flightData.trainee_input_zfw || 0}T ZFW)</span> : <span className="text-[#FF9100] font-bold">WAITING</span>}
        </div>
        <div className="flex justify-between border-b border-dashed border-[#333333] py-2 text-sm">
          <span>Fuel Receipt:</span>
          {flightData.fuel_receipt_rejected ? <span className="text-[#FF1744] font-bold">❌ REJECTED ({flightData.fuel_receipt_reject_reason})</span> :
           flightData.pilots_signed_fuel ? <span className="text-[#00E676] font-bold">ACCEPTED ({(flightData.actual_uplift || 0).toFixed(1)}T)</span> :
           flightData.fuel_receipt_sent ? <span className="text-[#FF9100] font-bold">SENT (AWAITING SIGN)</span> :
           <span className="text-[#FF9100] font-bold">PENDING</span>}
        </div>
        <div className="flex justify-between border-b border-dashed border-[#333333] py-2 text-sm">
          <span>Loadsheet Status:</span>
          {flightData.final_ls_rejected ? <span className="text-[#FF1744] font-bold">❌ REJECTED (FINAL) — {flightData.final_ls_reject_reason}</span> :
           flightData.pilots_signed_final ? <span className="text-[#00E676] font-bold">SIGNED (FINAL)</span> :
           flightData.prelim_ls_rejected ? <span className="text-[#FF1744] font-bold">❌ REJECTED (PRELIM) — {flightData.prelim_ls_reject_reason}</span> :
           flightData.prelim_ls_sent ? <span className="text-[#FF9100] font-bold">SENT (PRELIM)</span> :
           <span className="text-[#FF9100] font-bold">NO</span>}
        </div>
        <div className="flex justify-between py-2 text-sm">
          <span>PDC Clearance:</span>
          {/* 🌟 修復：pilots_accepted_pdc 之前淨係 PdcController.tsx（trainee 側）
              自己讀自己寫，教官呢邊完全冇路睇到 trainee 真係撳咗「Accept Clearance」
              未——同 tl_accept 個 bug 一樣嘅缺口，呢次係成行冇顯示過，唔係讀錯欄位 */}
          {flightData.pilots_accepted_pdc ? <span className="text-[#00E676] font-bold">ACCEPTED</span> :
           (flightData.pdc_requests || []).some((r: any) => r.status === "APPROVED") ? <span className="text-[#FF9100] font-bold">PENDING</span> :
           <span className="text-[#8fa0a6] font-bold">N/A</span>}
        </div>
      </div>

      {/* 🌟 ATIS Library：教官預先上傳想要嘅機場 ATIS 內容，trainee side 撳
          「Send ATIS Req」15 秒後會自動送呢度預先寫定嘅版本落 cockpit，唔使
          教官逐個 request 手動打/AI 生成再撳送——同下面 PENDING ATIS REQUEST
          嗰張卡（手動 override）獨立並存，邊個先送到都得 */}
      <div className="bg-lido-800 border border-[#333333] rounded-xl p-4 shadow-sm">
        <div className="text-text-muted text-xs font-bold mb-3 uppercase">📻 ATIS Library (Pre-loaded)</div>

        {atisLibrary.length === 0 ? (
          <div className="text-text-muted text-xs italic mb-3">No pre-loaded ATIS yet — a request will get a &quot;not available&quot; fallback after 15s until you add one below.</div>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {atisLibrary.map((entry: any) => (
              <div key={`${entry.icao}-${entry.type}`} className="bg-lido-950 border border-[#333333] rounded-lg p-2 flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="text-status-teal font-bold text-xs">{entry.icao} {entry.type}</div>
                  <div className="text-text-muted text-[0.65rem] truncate">{entry.content}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEditLibEntry(entry)} className="text-[0.6rem] px-2 py-1 rounded bg-[#333] text-white hover:bg-[#444] transition-colors">EDIT</button>
                  <button onClick={() => handleDeleteLibEntry(entry)} className="text-[0.6rem] px-2 py-1 rounded bg-[#FF1744]/20 text-[#FF1744] hover:bg-[#FF1744] hover:text-white transition-colors">DEL</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-2">
          <input
            type="text" maxLength={4} value={libIcao} onChange={(e) => setLibIcao(e.target.value.toUpperCase())}
            placeholder="ICAO" className="w-20 bg-lido-950 border border-[#404040] rounded-lg px-2 py-1.5 text-xs text-white uppercase outline-none focus:border-[#00bfa5]"
          />
          <select value={libType} onChange={(e) => setLibType(e.target.value)} className="flex-1 bg-lido-950 border border-[#404040] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#00bfa5] cursor-pointer">
            <option value="DEPARTURE">DEPARTURE</option>
            <option value="ARRIVAL">ARRIVAL</option>
          </select>
          <button
            onClick={generateLibAtis} disabled={isGeneratingLib || !libIcao.trim()}
            className="text-[0.65rem] px-2 rounded bg-[#00bfa5]/20 text-status-teal hover:bg-[#00bfa5] hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isGeneratingLib ? "⏳" : "✨ AI"}
          </button>
        </div>
        <textarea
          value={libContent} onChange={(e) => setLibContent(e.target.value)}
          placeholder="ATIS content..."
          className="w-full bg-lido-950 border border-[#404040] rounded-lg p-2 text-xs text-status-teal font-mono h-20 outline-none focus:border-[#00bfa5] resize-none mb-2"
        />
        <div className="flex gap-2">
          <button onClick={handleSaveLibEntry} className="flex-1 bg-[#00bfa5]/20 border border-[#00bfa5] text-status-teal py-1.5 rounded-lg text-xs font-bold hover:bg-[#00bfa5] hover:text-black transition-colors">
            {libEditingKey ? "💾 UPDATE ENTRY" : "➕ ADD TO LIBRARY"}
          </button>
          {libEditingKey && (
            <button onClick={resetLibForm} className="px-3 bg-[#333] text-white rounded-lg text-xs font-bold hover:bg-[#444] transition-colors">CANCEL</button>
          )}
        </div>
      </div>

      {(flightData.pdc_requests || []).filter((r:any) => r.status === "PENDING CLEARANCE").map((req:any, idx:number) => (
        <div key={`pdc-${idx}`} className="bg-lido-800 border border-[#FF9100] rounded-xl p-4 shadow-[0_0_10px_rgba(255,145,0,0.15)]">
          <div className="text-[#FF9100] font-bold mb-1">⚠️ PDC REQUEST RECEIVED</div>
          <div className="text-xs text-text-main mb-3">Facility {req.facility || '----'} | Gate {req.gate} | ATIS {req.atis}</div>
          <textarea
            id={`ios_pdc_input_${idx}`}
            className="w-full bg-lido-950 border border-[#404040] rounded-lg p-3 text-[#00E676] font-mono text-sm h-32 outline-none focus:border-[#00bfa5] resize-none"
            defaultValue={`${flightData.flight_no.replace(' ', '')} CLRD TO ${flightData.arr_icao} VIA ...\nINIT CLIMB ...\nSQUAWK ...\nDEP FREQ ...\nACKNOWLEDGE ATIS ${req.atis} ON DEPARTURE`}
          ></textarea>
          <button
            onClick={async () => {
              const input = document.getElementById(`ios_pdc_input_${idx}`) as HTMLTextAreaElement;
              try {
                await sendFlightDirective({ pdcApprove: { time: req.time, clearance_payload: input.value } });
              } catch {
                alert("Failed to approve PDC");
              }
            }}
            className="mt-3 w-full bg-[#00E676]/20 border border-[#00E676] text-[#00E676] py-2 rounded-lg font-bold hover:bg-[#00E676] hover:text-black transition-colors"
          >
            🟢 APPROVE & TRANSMIT PDC
          </button>
        </div>
      ))}

      {(flightData.atis_requests || []).filter((r:any) => r.status === "PENDING RESPONSE").map((req:any, idx:number) => (
        <div key={`atis-${idx}`} className="bg-lido-800 border border-[#00bfa5] rounded-xl p-4 shadow-[0_0_10px_rgba(0,191,165,0.15)]">
          <div className="text-status-teal font-bold mb-1 flex justify-between items-center">
            <span>⚠️ ATIS REQUEST</span>
            <button onClick={() => generateAtis(idx, req)} disabled={isGeneratingAtis === idx} className="text-[0.65rem] bg-[#00bfa5]/20 px-2 py-1 rounded text-status-teal hover:bg-[#00bfa5] hover:text-black transition-colors">
              {isGeneratingAtis === idx ? "⏳" : "✨ AI DRAFT"}
            </button>
          </div>
          <div className="text-xs text-text-main mb-3">{req.icao} ({req.type})</div>
          <textarea 
            id={`ios_atis_input_${idx}`}
            className="w-full bg-lido-950 border border-[#404040] rounded-lg p-3 text-status-teal font-mono text-sm h-24 outline-none focus:border-[#00bfa5] resize-none"
          ></textarea>
          <button
            onClick={async () => {
              const input = document.getElementById(`ios_atis_input_${idx}`) as HTMLTextAreaElement;
              try {
                await sendFlightDirective({ atisDeliver: { time: req.time, response: input.value } });
              } catch {
                alert("Failed to send ATIS");
              }
            }}
            className="mt-3 w-full bg-[#00bfa5]/20 border border-[#00bfa5] text-status-teal py-2 rounded-lg font-bold hover:bg-[#00bfa5] hover:text-black transition-colors"
          >
            🟢 SEND ATIS TO COCKPIT
          </button>
        </div>
      ))}

      <div className="bg-lido-800 border border-[#333333] rounded-xl p-4 mt-auto">
        <div className="text-text-muted text-xs font-bold mb-3 uppercase">ACARS CHAT INBOX</div>
        <div className="flex flex-col gap-2 mb-4 h-32 overflow-y-auto">
          {(flightData.acars_messages || []).length === 0 ? (
            <span className="text-text-muted text-xs italic">No messages yet.</span>
          ) : (
            (flightData.acars_messages || []).slice(-5).map((msg:any, i:number) => (
              <div key={i} className="text-xs bg-lido-950 p-2 rounded border border-[#333333]">
                <span className="text-text-muted">[{msg.time}]</span> <strong className={msg.sender === "DISPATCH" ? "text-status-teal" : "text-text-main"}>{msg.sender}:</strong> <span className="text-slate-300">{msg.content}</span>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          {/* 🌟 min-w-0：text input 預設 UA 樣式有個唔細嘅 intrinsic min-width，
              flex-1 都唔會自動縮過佢，令 InboxPanel 喺 iPad portrait 分到嘅窄
              欄位入面，呢一行連同 SEND 掣一齊靜靜雞內部 overflow */}
          <input
            type="text" id="acars_input" placeholder="Send Free Text..."
            className="flex-1 min-w-0 bg-lido-950 border border-[#404040] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00bfa5] text-white"
          />
          <button
            onClick={async () => {
              const input = document.getElementById('acars_input') as HTMLInputElement;
              if (!input.value) return;
              const content = input.value;
              input.value = "";
              try {
                await sendFlightDirective({ acarsDispatchAppend: { content } });
              } catch {
                alert("Failed to send ACARS message");
              }
            }}
            className="bg-lido-800 border border-[#404040] text-white px-4 rounded-lg text-sm font-bold hover:border-[#00bfa5] hover:text-status-teal transition-colors"
          >SEND</button>
        </div>
      </div>
    </div>
  );
}