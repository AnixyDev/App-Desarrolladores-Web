
import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";

/**
 * Obtiene la API KEY de forma segura solo cuando es necesaria.
 */
const getSafeApiKey = (): string => {
    // Exigimos la clave de process.env como indica la instrucción de seguridad
    const key = (process as any).env?.API_KEY;
    if (!key) {
        console.warn("Gemini API Key missing. AI features will be disabled.");
        return "MISSING_KEY";
    }
    return key;
};

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
Eres el "Estratega Principal de DevFreelancer", un consultor experto con más de 15 años de trayectoria en desarrollo de software.
REGLAS:
1. Sé analítico y directo.
2. Formato Markdown profesional.
3. Concluye con un "> **Consejo Estratégico Pro:**".
`;

export const getAIResponse = async (
    prompt: string, 
    history: { role: string, parts: any }[],
    tools?: FunctionDeclaration[]
): Promise<GenerateContentResponse> => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    return await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [...history, { role: 'user', parts: [{ text: prompt }] }] as any,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: tools ? [{ functionDeclarations: tools }] : undefined,
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 2000,
        }
    });
};

export const generateProposalText = async (jobTitle: string, jobDescription: string, userProfile: string): Promise<string> => {
    const prompt = `Genera una propuesta comercial persuasiva. Puesto: ${jobTitle}. Contexto: ${jobDescription}. Mi perfil: ${userProfile}`;
    const response = await getAIResponse(prompt, []);
    return response.text || '';
};

export const refineProposalText = async (text: string, tone: 'formal' | 'conciso' | 'entusiasta'): Promise<string> => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Refina el siguiente texto de propuesta comercial cambiando el tono a: ${tone}. Texto: ${text}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
    });
    return response.text || '';
};

export const analyzeProfitability = async (data: any) => {
    const prompt = `Analiza la rentabilidad de estos proyectos y detecta fugas de dinero: ${JSON.stringify(data)}`;
    const response = await getAIResponse(prompt, []);
    try {
        return JSON.parse(response.text || '{}');
    } catch {
        return { summary: response.text, topPerformers: [], areasForImprovement: [] };
    }
};

export const generateItemsForDocument = async (prompt: string, hourlyRate: number) => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Genera conceptos de factura detallados para: ${prompt}. Mi tarifa es ${hourlyRate/100}€/h`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
};

export const summarizeApplicant = async (jobDesc: string, applicantProf: string, proposal: string): Promise<any> => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Evalúa este candidato para el proyecto: ${jobDesc}. Perfil: ${applicantProf}. Propuesta: ${proposal}`;
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

export const generateTimeEntryDescription = async (projectName: string, projectDesc: string, keywords: string): Promise<string> => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Genera una descripción profesional (máximo 15 palabras). Proyecto: ${projectName}. Keywords: ${keywords}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
    });
    return response.text || '';
};

export const rankArticlesByRelevance = async (query: string, articles: any[]): Promise<string[]> => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const articlesContext = articles.map(a => ({ id: a.id, title: a.title, content: a.content.substring(0, 200) }));
    const prompt = `Ordena los IDs por relevancia semántica para: "${query}". IDs: ${JSON.stringify(articlesContext)}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    return JSON.parse(response.text || '[]');
};

export const generateFinancialForecast = async (data: any[]): Promise<any> => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analiza la previsión financiera: ${JSON.stringify(data)}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    potentialRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["summary", "potentialRisks", "suggestions"],
            }
        }
    });
    return JSON.parse(response.text || '{}');
};
