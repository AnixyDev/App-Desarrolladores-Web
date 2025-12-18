import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";

// Se inicializa el cliente utilizando exclusivamente process.env.API_KEY según las directrices.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const AI_CREDIT_COSTS = {
    generateProposal: 5,
    refineProposal: 3,
    summarizeApplicant: 8,
    summarizeChat: 3,
    generateDocument: 25,
    generateQuiz: 10,
    enhanceTimeEntry: 2,
    analyzeProductivity: 15,
    generateForecast: 10,
    chatMessage: 1,
    generateTasks: 5,
    estimateBudget: 8,
    searchKnowledgeBase: 2,
    analyzeProfitability: 15,
    generateInvoiceItems: 8,
};

const SYSTEM_INSTRUCTION = `
Eres el "Estratega Senior de DevFreelancer", un consultor experto con más de 15 años de experiencia en desarrollo de software, gestión de agencias y optimización de flujos de trabajo freelance.

Tus directrices de respuesta son:
1. PERSONALIDAD: Profesional, analítico, directo y altamente motivador. No rellenes con cortesías innecesarias.
2. FORMATO: Utiliza Markdown avanzado de forma obligatoria. 
   - Usa ## para secciones.
   - Usa **negritas** para conceptos clave.
   - Usa tablas si comparas datos.
   - Bloques de código con el lenguaje especificado (ej: \`\`\`typescript).
3. VALOR ACCIONABLE: Cada respuesta debe incluir al menos un "Consejo Pro" o una "Acción Inmediata" para que el usuario mejore su rentabilidad o eficiencia.
4. CONTEXTO SAAS: Conoces perfectamente que el usuario está usando DevFreelancer.app para gestionar clientes, facturas y proyectos.
5. IDIOMA: Responde siempre en el idioma en que se te pregunte (principalmente español).
`;

async function safeApiCall<T>(apiCall: () => Promise<T>, errorContext: string): Promise<T> {
    try {
        return await apiCall();
    } catch (error) {
        console.error(`${errorContext}:`, error);
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
            throw new Error("Error: La clave de API de Gemini no es válida.");
        }
        throw new Error(`Error en el motor de IA. Inténtalo de nuevo.`);
    }
}

export const getAIResponse = async (
    prompt: string, 
    history: { role: string, parts: any }[],
    tools?: FunctionDeclaration[]
): Promise<GenerateContentResponse> => {
    
    // El modelo gemini-3-pro-preview es el recomendado para tareas de razonamiento complejo
    return safeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [...history, { role: 'user', parts: [{ text: prompt }] }] as any,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: tools ? [{ functionDeclarations: tools }] : undefined,
            temperature: 0.75, // Balance entre creatividad y precisión técnica
            topP: 0.95,
            maxOutputTokens: 1500,
        }
    }), "Error in Gemini Chat Response");
};

// ... resto de funciones de generación (se mantienen para no romper el resto de la app)
export const generateProposalText = async (jobTitle: string, jobDescription: string, userProfile: string): Promise<string> => {
    const prompt = `Genera una propuesta técnica para: ${jobTitle}. Contexto: ${jobDescription}. Perfil: ${userProfile}`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "Eres un experto en ventas técnicas. Genera propuestas persuasivas en Markdown." }
    });
    return response.text || '';
};

export const refineProposalText = async (originalProposal: string, refinementType: 'formal' | 'conciso' | 'entusiasta'): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Refina esta propuesta a un tono ${refinementType}: ${originalProposal}`
    });
    return response.text || '';
};

export const summarizeApplicant = async (jobDescription: string, applicantProfile: string, applicantProposal: string): Promise<any> => {
    const prompt = `Analiza candidato. Puesto: ${jobDescription}. Perfil: ${applicantProfile}. Propuesta: ${applicantProposal}`;
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["summary", "pros", "cons"],
            },
        },
    });
    return JSON.parse(response.text || '{}');
};

export const generateFinancialForecast = async (data: any): Promise<any> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza estos datos financieros: ${JSON.stringify(data)}`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};

export const generateTimeEntryDescription = async (projectName: string, projectDescription: string, userKeywords: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Proyecto: ${projectName}. Keywords: ${userKeywords}. Genera descripción de 1 frase.`
    });
    return response.text?.trim() || '';
};

export const generateItemsForDocument = async (prompt: string, hourlyRate: number) => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Genera items de factura para: ${prompt}. Tarifa: ${hourlyRate/100}€/h`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
};

export const rankArticlesByRelevance = async (query: string, articles: any[]) => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Ordena por relevancia a "${query}": ${JSON.stringify(articles)}`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
};

export const analyzeProfitability = async (data: any) => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analiza rentabilidad: ${JSON.stringify(data)}`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};