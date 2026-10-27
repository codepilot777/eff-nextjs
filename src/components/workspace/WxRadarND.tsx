"use client";

// 🌟 Trainee/Observer 嘅 ND 雷達畫面——同 IOS 嗰個 WX RADAR tab 用緊同一個
// weather_nd_standalone.html，但呢度冇 SIGMET 編輯 UI（嗰個係教官專屬資料，
// 睇 validation.ts 嘅 scenario_sigmets_raw），trainee 淨係見到、操作個雷達
// 畫面本身——帶住教官已經搭好嘅天氣
export default function WxRadarND() {
  return (
    <div className="flex-1 min-h-0 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden flex flex-col">
      <iframe
        src="/weather-nd/index.html"
        title="Weather Radar ND"
        className="flex-1 w-full border-0 bg-white"
      />
    </div>
  );
}
