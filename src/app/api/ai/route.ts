import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { promptType, plainText, stdZ, staZ } = await request.json();
    
    // 從環境變數讀取 API Key (請確保根目錄的 .env 檔案內有 GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set in environment variables.' }, { status: 500 });
    }

    let systemPrompt = "";
    if (promptType === "NOTAM") {
      systemPrompt = `You are an Air Traffic Management officer. Convert the following plain text into a standard ICAO NOTAM format. Align the effective Date/Time group logically with the flight schedule (STD: ${stdZ}, STA: ${staZ}). Output ONLY the raw NOTAM text. Avoid markdown blockticks.`;
    } else if (promptType === "METAR") {
      systemPrompt = `You are an aviation meteorologist. Convert the following plain text into a perfectly formatted ICAO METAR and TAF. Align the observation and forecast times logically with the flight schedule (STD: ${stdZ}, STA: ${staZ}). Output ONLY the raw METAR and TAF text. Avoid markdown blockticks.`;
    } else {
      systemPrompt = `You are an ATC controller. Convert the following plain text into a standard Datalink ATIS format. Align the ATIS issuance time logically around the flight schedule (STD: ${stdZ}, STA: ${staZ}). Output ONLY the raw ATIS text. Avoid markdown blockticks.`;
    }

    // 呼叫 Gemini 2.5 Flash API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: plainText }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate from Gemini API: ${response.statusText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return NextResponse.json({ text: text ? text.replace(/```markdown/g, '').replace(/```/g, '').trim() : "Failed to generate text." });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}