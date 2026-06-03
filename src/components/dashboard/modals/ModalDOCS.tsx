"use client";
export function ModalDOCS({ flightData }: any) {
  const unescapeHTML = (str: string) => {
    if (!str) return "<p>No briefing HTML available.</p>";
    return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  };
  return (
            <div className="h-full flex flex-col font-sans">
              <div className="text-[#00E676] mb-4 font-bold tracking-widest text-lg">-- OPERATIONAL FLIGHT PLAN (OFP) --</div>
              <div 
                className="bg-[#0a0a0a] p-5 rounded-lg border border-[#404040] overflow-y-auto flex-1 text-text-main"
                style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "14px", lineHeight: "1.4", whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{ __html: unescapeHTML(flightData?.raw_simbrief?.text?.plan_html || flightData?.ofp_telex_text) }}
              />
            </div>
          );
}