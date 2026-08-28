"use client";
import { useState, Children, isValidElement } from "react";
import type { Element } from "hast";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useFlightData } from "@/hooks/useFlightData";
import { parseRunsheet, toggleRunsheetItem, getRunsheetProgress, SAMPLE_RUNSHEET } from "@/lib/instructor/lessonRunsheet";

const SIDEBAR_WIDTH = 380;

// 🌟 教官自己打（或者叫 AI 幫手寫）嘅 lesson plan runsheet，用 markdown 存喺
// flights.data.lesson_runsheet（受保護欄位，睇 validation.ts）。Save 完之後淨係
// 存低嗰段原始 markdown 文字——真實嘅 runsheet 通常唔止得 checklist，仲有
// code fence（例如貼 METAR/TAF）、粗體、表格等，所以呢度用 react-markdown 做
// 全格式 render（唔係得返自己手寫嗰個淨係識 header/item/text 嘅 mini parser），
// 剔一剔淨係翻轉返嗰行嘅 [ ]/[x]（睇 lib/instructor/lessonRunsheet.ts），
// 冇額外開第二個欄位存 done 狀態
export default function LessonRunsheetSidebar() {
  const { flightData, updateFlightDataAsync } = useFlightData();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  if (!flightData) return null;

  const markdown: string = flightData.lesson_runsheet || "";
  // 🌟 呢度淨係用嚟計 progress 個 X/Y 計數——實際 render 交返俾 ReactMarkdown
  const lines = parseRunsheet(markdown);
  const progress = getRunsheetProgress(lines);

  const startEditing = () => {
    setDraft(markdown);
    setError("");
    setIsEditing(true);
  };

  // 🌟 一定要用 updateFlightDataAsync + try/catch——之前用 fire-and-forget 嘅
  // updateFlightData，如果 server 因為未登入教官帳戶拒絕（lesson_runsheet 係受保護
  // 欄位，睇 validation.ts）就會靜靜雞冇晒反應，教官淨係見到 paste 完好似「無效果」
  const handleSave = async () => {
    setError("");
    try {
      await updateFlightDataAsync({ lesson_runsheet: draft });
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleCancel = () => {
    setError("");
    setIsEditing(false);
  };

  const handleToggleItem = async (lineIndex: number) => {
    setError("");
    try {
      await updateFlightDataAsync({ lesson_runsheet: toggleRunsheetItem(markdown, lineIndex) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  // 🌟 remark-gfm 幫任何 checklist item（`- [ ]`/`1. [ ]`/縮排都得）嘅 <li> 加
  // className="task-list-item"，仲會塞一個 disabled 嘅 <input type=checkbox> 做
  // 第一個 child。node.position.start.line 就係嗰行喺原始 markdown 嘅行號
  // （1-based），減 1 就啱 toggleRunsheetItem 嘅 0-based lineIndex
  const markdownComponents: Components = {
    h1: (props) => <h2 className="text-[#00bfa5] font-black text-[0.75rem] uppercase tracking-widest mt-5 first:mt-0 pb-1.5 border-b border-[#333]/60" {...stripNode(props)} />,
    h2: (props) => <h2 className="text-[#00bfa5] font-black text-[0.75rem] uppercase tracking-widest mt-5 first:mt-0 pb-1.5 border-b border-[#333]/60" {...stripNode(props)} />,
    h3: (props) => <h3 className="text-[#00bfa5] font-black text-[0.65rem] uppercase tracking-widest opacity-75 mt-3" {...stripNode(props)} />,
    h4: (props) => <h4 className="text-[#00bfa5] font-bold text-[0.62rem] uppercase tracking-widest opacity-60 mt-2" {...stripNode(props)} />,
    p: (props) => <p className="text-[#c3ced4] text-[0.78rem] leading-relaxed mb-2" {...stripNode(props)} />,
    strong: (props) => <strong className="text-white font-bold" {...stripNode(props)} />,
    em: (props) => <em className="italic text-[#a8b3ba]" {...stripNode(props)} />,
    a: (props) => <a className="text-[#00bfa5] underline hover:text-[#00e6c8]" target="_blank" rel="noreferrer" {...stripNode(props)} />,
    hr: () => <hr className="border-[#333] my-3" />,
    blockquote: (props) => <blockquote className="border-l-2 border-[#00bfa5]/50 pl-3 italic text-[#8fa0a6] my-2" {...stripNode(props)} />,
    ul: (props) => <ul className="list-disc pl-5 mb-2 space-y-1 marker:text-[#555]" {...stripNode(props)} />,
    ol: (props) => <ol className="list-decimal pl-5 mb-2 space-y-1 marker:text-[#555]" {...stripNode(props)} />,
    li: ({ node, children, ...props }) => {
      const className = node?.properties?.className;
      const isTask = Array.isArray(className) && className.includes("task-list-item");
      if (isTask) {
        const checkboxNode = node?.children?.find((c): c is Element => "tagName" in c && c.tagName === "input");
        const checked = checkboxNode?.properties?.checked === true;
        const lineIndex = Math.max(0, (node?.position?.start?.line ?? 1) - 1);

        // 🌟 一個 task item 嘅 children 可能包埋自己嗰句字（inline content）
        // *之後* 再跟埋一個巢住嘅 sub-list（`  - [ ] ...`），兩者喺 hast 樹入面
        // 同一層、係呢個 <li> 嘅直接 children。sub-list 淨係換咗做 <ul>/<ol>
        // （即係我哋自己個 override，睇下面），一定要摞出嚟擺喺 <button> 外面
        // ——button 入面塞多層 <ul><li><button>...就係 button 巢 button，
        // 唔止唔啱語意，仲會令瀏覽器自動摞返出嚟拆散個 DOM，剔咗都冇反應
        const nestedListTypes: unknown[] = [markdownComponents.ul, markdownComponents.ol];
        const childArray = Children.toArray(children);
        const isNestedList = (c: unknown) => isValidElement(c) && nestedListTypes.includes(c.type);
        const inlineChildren = childArray.filter((c) => !isNestedList(c));
        const nestedBlocks = childArray.filter(isNestedList);

        return (
          <li className="list-none">
            <button
              type="button"
              onClick={() => handleToggleItem(lineIndex)}
              className={`flex items-start gap-2.5 text-left w-full p-1 -m-1 rounded-lg transition-colors ${checked ? "opacity-50" : "hover:bg-[#252525]"}`}
            >
              <span className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? "bg-[#00bfa5] border-[#00bfa5]" : "border-[#555]"}`}>
                {checked && (
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="black" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </span>
              <span className={`text-[0.78rem] leading-snug ${checked ? "line-through text-[#8fa0a6]" : "text-white"}`}>{inlineChildren}</span>
            </button>
            {nestedBlocks}
          </li>
        );
      }
      return <li className="text-[0.78rem] text-[#c3ced4] leading-relaxed" {...props}>{children}</li>;
    },
    // 🌟 task item 已經自己畫緊個 checkbox（睇上面 li），呢個 disabled 嘅原生
    // <input> 唔使再顯示一次
    input: () => null,
    code: (props) => <code className="font-mono text-[0.7rem] text-[#00bfa5]" {...stripNode(props)} />,
    pre: (props) => <pre className="bg-[#0a0a0a] border border-[#333] rounded-lg p-3 mb-3 overflow-x-auto whitespace-pre-wrap break-words text-[#c3ced4]" {...stripNode(props)} />,
    table: (props) => <div className="overflow-x-auto mb-3"><table className="w-full text-[0.68rem] border-collapse" {...stripNode(props)} /></div>,
    th: (props) => <th className="border border-[#333] bg-[#0a0a0a] text-[#00bfa5] font-bold px-2 py-1 text-left whitespace-nowrap" {...stripNode(props)} />,
    td: (props) => <td className="border border-[#333] px-2 py-1 text-[#c3ced4] align-top" {...stripNode(props)} />,
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
          {error && (
            <div className="mb-3 bg-[#FF1744]/10 border border-[#FF1744]/50 text-[#FF1744] text-[0.72rem] font-bold rounded-lg px-3 py-2">
              ⚠️ {error}
            </div>
          )}
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
            <div className="text-[0.78rem]">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {markdown}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// 🌟 react-markdown 嘅 custom component 會收埋 hast `node` prop一齊落嚟，直接
// spread 落原生 HTML element 度會警告「unknown prop `node`」——呢個小 helper
// 淨係剝走佢，留低其餘正常 HTML props（className 由我哋自己個 override 硬寫，
// 唔靠呢度）
function stripNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const rest: Partial<T> = { ...props };
  delete rest.node;
  return rest as Omit<T, "node">;
}
