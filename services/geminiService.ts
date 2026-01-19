
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseTestContent = async (text: string): Promise<Question[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Siz ta'lim tizimi uchun testlarni formatlovchi aqlli yordamchisiz. 
      Berilgan tartibsiz matnni tahlil qilib, undagi savollarni, variantlarni va to'g'ri javoblarni aniqlang.
      
      Qoidalar:
      1. Har bir savolni 'CHOICE' (variantli) yoki 'TEXT' (qisqa javob) turiga ajrating.
      2. Agar savol variantli bo'lsa, A, B, C, D variantlarini aniqlang.
      3. To'g'ri javobni (correctAnswer) va ballni (points) matndan qidiring. Agar ball ko'rsatilmagan bo'lsa, standart 5 ball bering.
      4. Javob faqat JSON formatida bo'lishi shart.
      
      Matn:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['CHOICE', 'TEXT'] },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    text: { type: Type.STRING }
                  },
                  required: ['key', 'text']
                }
              },
              correctAnswer: { type: Type.STRING },
              points: { type: Type.NUMBER }
            },
            required: ['text', 'type', 'correctAnswer', 'points']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((q: any, index: number) => ({
      ...q,
      id: `q-${Date.now()}-${index}`
    }));
  } catch (error) {
    console.error("Smart Parse Error:", error);
    throw new Error("Matnni tahlil qilib bo'lmadi. Iltimos formatni tekshiring.");
  }
};

export const autoFixFormatting = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Quyidagi tartibsiz test matnini standart EduExam formatiga keltiring. 
      Har bir savol #Q bilan boshlansin. 
      Savol: [Savol matni]
      A) ...
      B) ...
      ANSWER: [To'g'ri javob]
      POINTS: [Ball]
      
      Matn:
      ${text}`,
    });
    return response.text || text;
  } catch (error) {
    return text;
  }
};
