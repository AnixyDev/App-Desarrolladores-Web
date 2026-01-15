import { GoogleGenerativeAI } from "@google/generative-ai";

// Usamos import.meta.env para Vite o process.env para Next.js según tu config
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `
Eres el "Estratega Principal de DevFreelancer", un consultor experto con más de 15 años de trayectoria en desarrollo de software, gestión de agencias y optimización de flujos de caja para freelancers.

REGLAS DE ORO DE RESPUESTA:
1. PERSONALIDAD: Actúa como un mentor Senior. Sé analítico, directo y obsesionado con el valor de negocio.
2. FORMATO PROFESIONAL: Usa ## para títulos, **negritas** para términos clave y tablas Markdown.
3. ENFOQUE EN VALOR: Cada respuesta debe concluir con "> **Consejo Estratégico Pro:**".
4. CONTEXTO: Ayudas en la gestión de clientes, proyectos, facturas y gastos dentro de DevFreelancer.app.`;

// 1. Unificamos los costes de créditos
export const AI_CREDIT_COSTS = {
    chatMessage: 1,
    generateProposal: 2, // Añadido para que ProposalsPage lo encuentre
    enhanceTimeEntry: 1  // <--- AÑADE ESTA LÍNEA
};

/**
 * Chat general con el "Estratega"
 */
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
    console.error("Error en Gemini Service (getAIResponse):", error);
    throw error;
  }
};

/**
 * 2. FUNCIÓN EXPORTADA QUE FALTABA: Generación de Propuestas
 */
export const generateProposalText = async (title: string, context: string, profileSummary: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "Eres un experto en redactar propuestas comerciales persuasivas para freelancers."
    });

    const prompt = `
      Genera una propuesta profesional detallada:
      
      PROYECTO: ${title}
      CONTEXTO ADICIONAL: ${context}
      MI PERFIL: ${profileSummary}
      
      Escribe una propuesta con estructura clara: Introducción, Análisis de Necesidades, Solución Propuesta y Cierre. Usa un tono que inspire confianza.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error en Gemini Service (generateProposalText):", error);
    throw new Error("No se pudo generar la propuesta.");
  }
};
/**
 * Genera una descripción profesional para una entrada de tiempo
 */
export const generateTimeEntryDescription = async (taskName: string, notes: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "Eres un asistente experto en productividad para freelancers."
    });

    const prompt = `
      Crea una descripción profesional y concisa para un registro de tiempo.
      Tarea: ${taskName}
      Notas adicionales: ${notes}
      
      La respuesta debe ser una sola frase profesional que resuma el trabajo realizado.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error en generateTimeEntryDescription:", error);
    return taskName; // Fallback: devolvemos el nombre de la tarea si falla
  }
};