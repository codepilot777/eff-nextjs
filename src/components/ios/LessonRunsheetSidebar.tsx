"use client";
import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";
import { parseRunsheet, toggleRunsheetItem, getRunsheetProgress, SAMPLE_RUNSHEET } from "@/lib/instructor/lessonRunsheet";

const SIDEBAR_WIDTH = 380;

// 🌟 教官自己打（或者叫 AI 幫手寫）嘅 lesson plan checklist，用 markdown task
// list 格式存喺 flights.data.lesson_runsheet（受保護欄位，睇 validation.ts）。
// Save 完之後淨係存低嗰段原始 markdown 文字——剔一剔淨係翻轉返嗰行嘅 [ ]/[x]
// （睇 lib/instructor/lessonRunsheet.ts），冇額外開第二個欄位存 done 狀態
export default function LessonRunsheetSidebar() {
  const { flightData, updateFlightData } = useFlightData();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (!flightData) return null;

  const markdown: string = flightData.lesson_runsheet || "";
  const lines = parseRunsheet(markdown);
  const progress = getRunsheetProgress(lines);

  const startEditing = () => {
    setDraft(markdown);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateFlightData({ lesson_runsheet: draft });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleToggleItem = (lineIndex: number) => {
    updateFlightData({ lesson_runsheet: toggleRunsheetItem(markdown, lineIndex) });
  };

  return (
    <>
      {/* 🌟 開/關掣：固定喺右邊，跟住 sidebar 開關一齊郁 */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close lesson runsheet" : "Open lesson runsheet"}
        style={{ right: isOpen ? SIDEBAR_WIDTH : 0 }}
        className="fixed top-1/2 -translate-y-1/2 z-40 bg-[#1a1a1a] border border-[#333] border-r-0 text-[#00bfa5] w-8 h-16 flex items-center justify-center rounded-l-xl shadow-lg hover:bg-[#2a2a2a] transition-[right] duration-300"
      >
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* 🌟 Sidebar 本身 */}
      <div
        style={{ width: SIDEBAR_WIDTH }}
        className={`fixed top-0 right-0 h-full bg-[#1a1a1a] border-l border-[#333] shadow-2xl z-30 transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-5 border-b border-[#333] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[#00bfa5] font-black text-sm tracking-widest uppercase flex items-center gap-2">
              📋 Lesson Runsheet
            </h3>
            {progress.total > 0 && !isEditing && (
              <div className="text-[#8fa0a6] text-xs mt-1 font-bold">{progress.done}/{progress.total} done</div>
            )}
          </div>
          {!isEditing && (
            <button onClick={startEditing} className="text-[#8fa0a6] hover:text-white text-xs font-bold border border-[#444] rounded-lg px-3 py-1.5 transition-colors shrink-0">
              Edit
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isEditing ? (
            <div className="flex flex-col gap-3 h-full">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={"## Section\n- [ ] Step one\n- [ ] Step two"}
                className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg p-3 text-[0.8rem] font-mono text-white resize-none outline-none focus:border-[#00bfa5] transition-colors min-h-[200px]"
              />
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setDraft(SAMPLE_RUNSHEET)} className="flex-1 py-2.5 text-[0.65rem] font-bold uppercase tracking-widest border border-[#444] rounded-lg text-[#8fa0a6] hover:text-white hover:border-[#666] transition-colors">
                  Load Sample
                </button>
                <button onClick={handleCancel} className="flex-1 py-2.5 text-[0.65rem] font-bold uppercase tracking-widest border border-[#444] rounded-lg text-[#8fa0a6] hover:text-white hover:border-[#666] transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-2.5 text-[0.65rem] font-black uppercase tracking-widest rounded-lg bg-[#00bfa5] text-black hover:bg-[#00a892] transition-colors">
                  Save
                </button>
              </div>
            </div>
          ) : lines.length === 0 ? (
            <div className="text-center text-[#555] text-[0.7rem] font-bold uppercase tracking-widest py-10 leading-relaxed">
              No runsheet yet.<br />Tap Edit to paste one in.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {lines.map((line) => {
                if (line.type === "header") {
                  return (
                    <div
                      key={line.lineIndex}
                      className={`text-[#00bfa5] font-black uppercase tracking-widest mt-4 first:mt-0 pb-1.5 border-b border-[#333]/60 ${line.level === 2 ? "text-[0.7rem]" : "text-[0.62rem] opacity-75 border-none mt-2"}`}
                    >
                      {line.text}
                    </div>
                  );
                }
                if (line.type === "item") {
                  return (
                    <button
                      key={line.lineIndex}
                      onClick={() => handleToggleItem(line.lineIndex)}
                      className={`flex items-start gap-2.5 text-left p-2 rounded-lg transition-colors ${line.done ? "opacity-50" : "hover:bg-[#252525]"}`}
                    >
                      <span className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${line.done ? "bg-[#00bfa5] border-[#00bfa5]" : "border-[#555]"}`}>
                        {line.done && (
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="black" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-[0.8rem] leading-snug ${line.done ? "line-through text-[#8fa0a6]" : "text-white"}`}>{line.text}</span>
                    </button>
                  );
                }
                return (
                  <div key={line.lineIndex} className="text-[#8fa0a6] text-[0.7rem] italic pl-2 py-1">
                    {line.text}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
