import { GoogleGenerativeAI } from "@google/generative-ai";

// Usamos import.meta.env para que Vercel inyecte la llave automáticamente
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const SYSTEM_INSTRUCTION = `
Eres el "Estratega Principal de DevFreelancer". (Pega aquí el resto de tus instrucciones de AI Studio).
`;

export const getAIResponse = async (prompt: string, history: any[] = []) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
    systemInstruction: SYSTEM_INSTRUCTION 
  });

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'ai' ? 'model' : 'user',
      parts: [{ text: h.text }],
    })),
  });

  const result = await chat.sendMessage(prompt);
  return result.response.text();
};