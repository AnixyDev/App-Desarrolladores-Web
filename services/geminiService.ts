import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// La clave de API es inyectada por el entorno.
// Se inicializa el cliente una vez, asumiendo que process.env.API_KEY está disponible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const API_KEY_ERROR_MESSAGE = "Error: La clave de API para los servicios de IA no está configurada o no es válida. La plataforma debería proporcionarla automáticamente. Si el error persiste, contacta al administrador del sitio.";

export const AI_CREDIT_COSTS = {
    generateProposal: 5,
    summarizeChat: 3,
    generateDocument: 25,
    generateQuiz: 10,
    enhanceTimeEntry: 2,
    analyzeProductivity: 15,
    generateForecast: 10,
    chatMessage: 1,
    generateTasks: 5,
    estimateBudget: 8,
};

// Función auxiliar para gestionar las llamadas a la API de forma segura
async function safeApiCall(apiCall: () => Promise<GenerateContentResponse>, errorContext: string): Promise<string> {
    if (!process.env.API_KEY) {
        console.error("La clave de API de Gemini no está configurada en el entorno.");
        return API_KEY_ERROR_MESSAGE;
    }
    try {
        const response = await apiCall();
        return response.text;
    } catch (error) {
        console.error(`${errorContext}:`, error);
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
            return "Error: La clave de API de Gemini proporcionada por el entorno no es válida. Por favor, verifica la configuración.";
        }
        return `Hubo un error al procesar la solicitud de IA. Por favor, inténtalo de nuevo.`;
    }
}

export const generateProposalText = async (jobTitle: string, jobDescription: string, userProfile: string): Promise<string> => {
    const prompt = `
        Eres un asistente experto en redacción de propuestas para freelancers de desarrollo de software.
        Tu tarea es generar una propuesta profesional y persuasiva para un proyecto.

        **Contexto del Proyecto:**
        - Título: ${jobTitle}
        - Descripción: ${jobDescription}

        **Perfil del Freelancer:**
        - ${userProfile}

        **Instrucciones:**
        1.  Escribe una propuesta concisa y profesional.
        2.  Comienza con un saludo cordial dirigido al cliente.
        3.  Demuestra que has entendido los requisitos del proyecto.
        4.  Destaca brevemente por qué eres el candidato ideal, conectando tu experiencia con las necesidades del proyecto.
        5.  Sugiere los siguientes pasos (ej. una breve llamada para discutir detalles).
        6.  Termina con un cierre profesional.
        7.  El tono debe ser seguro, competente y amigable. No uses un lenguaje demasiado formal ni demasiado casual.
        8.  NO incluyas placeholders como "[Tu Nombre]" o "[Nombre del Cliente]". La propuesta debe ser genérica para que el usuario la complete.

        Genera solo el texto de la propuesta.
    `;

    return safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
            topP: 1,
            topK: 1,
            maxOutputTokens: 512,
        }
    }), "Error generating proposal with Gemini");
};

export const getAIResponse = async (prompt: string, history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
    const contents = [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
    ];

    return safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: contents as any,
         config: {
            temperature: 0.9,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
        }
    }), "Error getting AI response from Gemini");
};

export const generateFinancialForecast = async (data: any): Promise<any> => {
    const prompt = `
        Eres un asesor financiero experto para freelancers. Analiza los siguientes datos de previsión financiera y proporciona un análisis en formato JSON.

        Datos de Previsión (próximos 6 meses):
        ${JSON.stringify(data, null, 2)}

        Instrucciones:
        1.  Proporciona un resumen general (summary) del panorama financiero.
        2.  Identifica riesgos potenciales (potentialRisks), como meses con flujo de caja negativo o muy bajo.
        3.  Ofrece sugerencias accionables (suggestions) para mejorar la situación, como buscar nuevos proyectos o reducir gastos.
        4.  El resultado debe ser un objeto JSON con las claves: "summary", "potentialRisks", "suggestions".
    `;
    
    const resultText = await safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    }), "Error generating financial forecast");

    try {
        if (resultText.startsWith("Error:")) {
            return { summary: resultText, potentialRisks: [], suggestions: [] };
        }
        const text = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("Error parsing Gemini forecast response:", e);
        return {
            summary: "No se pudo generar un análisis automático. Revisa tus datos.",
            potentialRisks: [],
            suggestions: []
        };
    }
};

export const generateTimeEntryDescription = async (projectName: string, projectDescription: string, userKeywords: string): Promise<string> => {
    const prompt = `
        Eres un asistente para un desarrollador freelance. Tu tarea es generar una descripción de registro de tiempo (time entry) profesional y concisa.

        **Contexto del Proyecto:**
        - Nombre del Proyecto: ${projectName}
        - Descripción del Proyecto: ${projectDescription}

        **Palabras Clave del Usuario (si las hay):**
        - ${userKeywords || "Desarrollo general y tareas de programación."}

        **Instrucciones:**
        1.  Basándote en el contexto y las palabras clave, escribe una descripción de 1 frase para un registro de tiempo.
        2.  La descripción debe ser específica y sonar profesional.
        3.  Ejemplos: "Implementado el flujo de autenticación de dos factores para el portal de administración.", "Investigado y solucionado un bug de rendimiento en la consulta de la base de datos de productos.", "Desarrollada la maquetación de la página de perfil de usuario con React y Tailwind CSS."
        4.  Genera solo el texto de la descripción, sin introducciones ni saludos.
    `;

    const result = await safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.6,
            maxOutputTokens: 64,
        }
    }), "Error generating time entry description");
    
    return result.trim();
};