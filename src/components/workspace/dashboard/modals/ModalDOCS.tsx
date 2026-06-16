"use client";

export function ModalDOCS({ flightData }: any) {
  // 將 SimBrief 傳過來嘅 HTML Entites 轉回正常 Tag
  const unescapeHTML = (str: string) => {
    if (!str) return "<p>No briefing HTML available.</p>";
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  return (
    // 🌟 徹底褪去所有多餘嘅卡片、邊框同標題，讓文字直接融入父層 Modal
    <div 
      className="w-full h-full text-[#e2e8f0] font-mono leading-relaxed whitespace-pre-wrap selection:bg-[#00E676] selection:text-black"
      style={{ 
        fontFamily: "'Courier New', Courier, monospace", 
        fontSize: "0.85rem"
      }}
      dangerouslySetInnerHTML={{ 
        __html: unescapeHTML(flightData?.raw_simbrief?.text?.plan_html || flightData?.ofp_telex_text) 
      }}
    />
  );
}