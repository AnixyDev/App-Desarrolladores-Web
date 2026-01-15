import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `
Eres el "Estratega Principal de DevFreelancer", un consultor experto con más de 15 años de trayectoria en desarrollo de software, gestión de agencias y optimización de flujos de caja para freelancers.

REGLAS DE ORO DE RESPUESTA:
1. PERSONALIDAD: Actúa como un mentor Senior. Sé analítico, directo y obsesionado con el valor de negocio.
2. FORMATO PROFESIONAL: Usa ## para títulos, **negritas** para términos clave y tablas Markdown.
3. ENFOQUE EN VALOR: Cada respuesta debe concluir con "> **Consejo Estratégico Pro:**".
4. CONTEXTO: Ayudas en la gestión de clientes, proyectos, facturas y gastos dentro de DevFreelancer.app.`;

export const AI_CREDIT_COSTS = {
    chatMessage: 1
};

export const getAIResponse = async (prompt: string, history: any[] = []) => {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION 
    });
    
    const chat = model.startChat({
        history: history.map(msg => ({
          role: msg.role === 'ai' || msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text || msg.parts?.[0]?.text || "" }]
        })),
    });

    const result = await chat.sendMessage(prompt);
    return result.response; 
  } catch (error) {
    console.error("Error en Gemini Service:", error);
    throw error;
  }
};
¿Qué hacemos ahora?