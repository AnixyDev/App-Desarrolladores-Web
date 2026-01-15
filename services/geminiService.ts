import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";

// Se inicializa el cliente utilizando exclusivamente process.env.API_KEY según las directrices.
// FIX: Strictly followed initialization guideline.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
Eres el "Estratega Principal de DevFreelancer", un consultor experto con más de 15 años de trayectoria en desarrollo de software, gestión de agencias y optimización de flujos de caja para freelancers.

REGLAS DE ORO DE RESPUESTA:
1. PERSONALIDAD: Actúa como un mentor Senior. Sé analítico, directo y obsesionado con el valor de negocio. Evita las introducciones vacías como "Claro, puedo ayudarte con eso".
2. FORMATO PROFESIONAL:
   - Usa ## para separar conceptos principales.
   - Utiliza **negritas** para resaltar términos financieros o técnicos clave.
   - Si comparas opciones, utiliza tablas de Markdown.
   - Bloques de código deben incluir el lenguaje (ej: \`\`\`typescript) y comentarios sobre el ROI de la implementación.
3. ENFOQUE EN VALOR: Cada respuesta debe concluir con un apartado llamado "> **Consejo Estratégico Pro:**" con una acción inmediata que mejore la rentabilidad del usuario.
4. CONTEXTO: Entiendes que el usuario utiliza DevFreelancer.app para gestionar clientes, proyectos, facturas y gastos. Tus consejos deben ser aplicables dentro de este ecosistema.
`;

export const getAIResponse = async (
    prompt: string, 
    history: { role: string, parts: any }[],
    tools?: FunctionDeclaration[]
): Promise<GenerateContentResponse> => {
    
    // Utilizamos gemini-3-pro-preview para garantizar la máxima calidad de razonamiento
    return await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [...history, { role: 'user', parts: [{ text: prompt }] }] as any,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: tools ? [{ functionDeclarations: tools }] : undefined,
            temperature: 0.8, // Permite creatividad estratégica pero mantiene rigor técnico
            topP: 0.9,
            maxOutputTokens: 2000,
        }
    });
};

// ... Funciones de conveniencia para otras partes de la app ...
export const generateProposalText = async (jobTitle: string, jobDescription: string, userProfile: string): Promise<string> => {
    const prompt = `Genera una propuesta comercial persuasiva. Puesto: ${jobTitle}. Contexto: ${jobDescription}. Mi perfil: ${userProfile}`;
    const response = await getAIResponse(prompt, []);
    return response.text || '';
};

// FIX: Added missing refineProposalText export.
export const refineProposalText = async (text: string, tone: 'formal' | 'conciso' | 'entusiasta'): Promise<string> => {
    const prompt = `Refina el siguiente texto de propuesta comercial manteniendo su significado pero cambiando el tono a: ${tone}.
    Texto: ${text}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
    });
    return response.text || '';
};

export const analyzeProfitability = async (data: any) => {
    const prompt = `Analiza la rentabilidad de estos proyectos y detecta fugas de dinero: ${JSON.stringify(data)}`;
    const response = await getAIResponse(prompt, []);
    return JSON.parse(response.text || '{}');
};

export const generateItemsForDocument = async (prompt: string, hourlyRate: number) => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Genera conceptos de factura detallados para: ${prompt}. Mi tarifa es ${hourlyRate/100}€/h`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
};

export const summarizeApplicant = async (jobDesc: string, applicantProf: string, proposal: string): Promise<any> => {
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

// FIX: Added missing generateTimeEntryDescription export.
export const generateTimeEntryDescription = async (projectName: string, projectDesc: string, keywords: string): Promise<string> => {
    const prompt = `Genera una descripción profesional y concisa (máximo 15 palabras) para una entrada de tiempo de trabajo. 
    Proyecto: ${projectName}. 
    Descripción del proyecto: ${projectDesc}. 
    Palabras clave/notas del usuario: ${keywords}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
    });
    return response.text || '';
};

// FIX: Added missing rankArticlesByRelevance export.
export const rankArticlesByRelevance = async (query: string, articles: any[]): Promise<string[]> => {
    const articlesContext = articles.map(a => ({ id: a.id, title: a.title, content: a.content.substring(0, 200) }));
    const prompt = `Dada la siguiente consulta de búsqueda: "${query}", ordena los IDs de los artículos por relevancia semántica. Devuelve solo un array de IDs.
    Artículos: ${JSON.stringify(articlesContext)}`;
    
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

// FIX: Added missing generateFinancialForecast export.
export const generateFinancialForecast = async (data: any[]): Promise<any> => {
    const prompt = `Analiza la siguiente previsión de flujo de caja para los próximos 6 meses y proporciona un diagnóstico estratégico.
    Datos (en EUR): ${JSON.stringify(data)}`;
    
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
