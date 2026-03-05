
import { GoogleGenAI } from "@google/genai";
import { Language } from "../translations";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function translateText(text: string, targetLang: Language): Promise<string> {
  if (!text.trim()) return text;
  
  const langNames = {
    en: "English",
    zh: "Chinese",
    ko: "Korean",
    ja: "Japanese"
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text into ${langNames[targetLang]}. Provide only the translated text without any explanations or extra characters: "${text}"`,
    });

    return response.text || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}
