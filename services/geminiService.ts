import { GoogleGenerativeAI } from "@google/generative-ai";

// En Vite usamos import.meta.env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const SYSTEM_INSTRUCTION = `
Eres el "Estratega Principal de DevFreelancer", un consultor experto con más de 15 años de trayectoria en desarrollo de software, gestión de agencias y optimización de flujos de caja para freelancers.

REGLAS DE ORO DE RESPUESTA:
1. PERSONALIDAD: Actúa como un mentor Senior. Sé analítico, directo y obsesionado con el valor de negocio.
2. FORMATO PROFESIONAL: Usa ## para títulos, **negritas** para términos clave y tablas Markdown.
3. ENFOQUE EN VALOR: Cada respuesta debe concluir con "> **Consejo Estratégico Pro:**".
4. CONTEXTO: Ayudas en la gestión de clientes, proyectos, facturas y gastos dentro de DevFreelancer.app.
`;

export interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
}

export const getAIResponse = async (prompt: string, history: ChatMessage[] = []) => {
    try {
        // Usamos gemini-1.5-flash por su excelente relación velocidad/coste
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION 
        });

        // Mapeamos el historial al formato que exige el SDK oficial de Google
        const googleHistory = history.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        }));

        const chat = model.startChat({
            history: googleHistory,
            generationConfig: {
                maxOutputTokens: 2000,
                temperature: 0.8,
            },
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error en GeminiService:", error);
        throw error;
    }
};

/**
 * Ejemplo de función especializada para generar propuestas
 */
export const generateProposalText = async (jobTitle: string, jobDescription: string, userProfile: string): Promise<string> => {
    const prompt = `Genera una propuesta comercial persuasiva. Puesto: ${jobTitle}. Contexto: ${jobDescription}. Mi perfil: ${userProfile}`;
    return await getAIResponse(prompt);
};