import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const aiPrompt = `
      You are a high-end UI/UX designer. 
      Generate a single CSS background-image string based on this vibe: "${prompt}".
      Rules:
      1. Use ONLY modern linear-gradient or radial-gradient.
      2. Keep it premium, professional, and aesthetic. 
      3. Return ONLY the string starting with 'linear-gradient' or 'radial-gradient'.
      4. DO NOT include "background-image:" or quotes or semicolons.
      5. DO NOT include any conversational text.
    `;

    const result = await model.generateContent(aiPrompt);
    const cssCode = result.response.text().trim();

    return new Response(JSON.stringify({ cssCode }), { status: 200 });
  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate vibe." }), { status: 500 });
  }
}
