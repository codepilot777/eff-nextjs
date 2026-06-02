import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { promptType, plainText, stdZ, staZ } = await request.json();

    if (!plainText) {
      return NextResponse.json({ error: 'Missing plainText' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    // 🌟 建構給 Gemini 的 Prompt 指令 (加入 WX 氣象專家模式)
    let systemPrompt = "";
    if (promptType === "NOTAM") {
      systemPrompt = `You are a professional aviation dispatcher. Convert the following plain English text into a standard ICAO format NOTAM. 
Only output the raw NOTAM text in uppercase. Do not include any conversational filler, markdown formatting, or explanations.
Flight STD: ${stdZ}, STA: ${staZ}.
Text to convert: ${plainText}`;
    } else if (promptType === "WX") {
      systemPrompt = `You are a professional aviation meteorologist. Convert the following plain English text into standard raw ICAO METAR and TAF formats. 
Format the output strictly as follows:
METAR: [Raw METAR string]
TAF: [Raw TAF string]
Do not include any conversational filler or markdown formatting. Use current aviation weather encoding rules.
Flight STD: ${stdZ}, STA: ${staZ}.
Text to convert: ${plainText}`;
    } else {
      systemPrompt = plainText;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.2 } // 降低溫度，確保格式嚴謹
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return NextResponse.json({ error: data.error?.message || 'Gemini API Error' }, { status: response.status });
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "NO CONTENT GENERATED.";

    return NextResponse.json({ text: generatedText.trim() });

  } catch (error) {
    console.error('AI API Route Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}