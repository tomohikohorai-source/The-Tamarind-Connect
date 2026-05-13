import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || !targetLanguage) return text;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLanguage}. Return only the translated text.\n\nText: ${text}`,
    });
    
    return response.text || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}
