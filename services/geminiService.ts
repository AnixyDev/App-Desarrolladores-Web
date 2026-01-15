
import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";

const getSafeApiKey = (): string => {
    const key = (process as any).env?.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!key) {
        console.warn("Gemini API Key missing in environment.");
        return "";
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
Eres el "Estratega Principal de DevFreelancer", un consultor experto senior con 15 años de experiencia.
Tu objetivo es ayudar a freelancers y agencias a maximizar su ROI y eficiencia.
REGLAS:
1. Análisis directo y estratégico.
2. Uso de Markdown profesional.
3. Finaliza siempre con un "> **Consejo Estratégico Pro:**".
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
            temperature: 0.75,
            topP: 0.95,
            maxOutputTokens: 2500,
        }
    });
};

export const generateProposalText = async (jobTitle: string, jobDescription: string, userProfile: string): Promise<string> => {
    const prompt = `Propuesta comercial para: ${jobTitle}. Contexto: ${jobDescription}. Mi perfil: ${userProfile}`;
    const response = await getAIResponse(prompt, []);
    return response.text || '';
};

export const refineProposalText = async (text: string, tone: 'formal' | 'conciso' | 'entusiasta'): Promise<string> => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Refina esta propuesta con tono ${tone}: ${text}`;
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
    });
    return response.text || '';
};

export const analyzeProfitability = async (data: any) => {
    const prompt = `Analiza rentabilidad y fugas de capital: ${JSON.stringify(data)}`;
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
        contents: `Conceptos de factura para: ${prompt}. Tarifa: ${hourlyRate/100}€/h`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
};

export const summarizeApplicant = async (jobDesc: string, applicantProf: string, proposal: string): Promise<any> => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Evalúa candidato: ${jobDesc}. Perfil: ${applicantProf}. Propuesta: ${proposal}`;
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
    const prompt = `Descripción corta de tarea: ${projectName}. Contexto: ${keywords}`;
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
    });
    return response.text || '';
};

export const rankArticlesByRelevance = async (query: string, articles: any[]): Promise<string[]> => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const articlesContext = articles.map(a => ({ id: a.id, title: a.title, content: a.content.substring(0, 150) }));
    const prompt = `Ordena IDs por relevancia para: "${query}". Datos: ${JSON.stringify(articlesContext)}`;
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
    return JSON.parse(response.text || '[]');
};

export const generateFinancialForecast = async (data: any[]): Promise<any> => {
    const apiKey = getSafeApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Predicción financiera: ${JSON.stringify(data)}`;
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
