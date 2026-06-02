import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { promptType, plainText, stdZ, staZ } = await request.json();
    
    // ⚠️ 確保你的 .env 檔案中有 GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || "";
    
    let systemPrompt = "";
    if (promptType === "NOTAM") {
      systemPrompt = `You are an Air Traffic Management officer. Convert the following plain text into a standard ICAO NOTAM format. Align the effective Date/Time group logically with the flight schedule (STD: ${stdZ}, STA: ${staZ}). Output ONLY the raw NOTAM text.`;
    } else if (promptType === "METAR") {
      systemPrompt = `You are an aviation meteorologist. Convert the following plain text into a perfectly formatted ICAO METAR and TAF. Align the observation and forecast times logically with the flight schedule (STD: ${stdZ}, STA: ${staZ}). Output ONLY the raw METAR and TAF text.`;
    } else {
      systemPrompt = `You are an ATC controller. Convert the following plain text into a standard Datalink ATIS format. Align the ATIS issuance time logically around the flight schedule (STD: ${stdZ}, STA: ${staZ}). Output ONLY the raw ATIS text.`;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: plainText }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    const result = await response.json();
    let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return NextResponse.json({ error: "Failed to generate text." }, { status: 400 });
    }

    // 安全地移除 markdown 標記，避免使用直接字串導致解析錯誤
    const bt = String.fromCharCode(96, 96, 96);
    text = text.replace(new RegExp(bt + 'markdown\n', 'g'), '').replace(new RegExp(bt, 'g'), '').trim();

    return NextResponse.json({ text });

  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}