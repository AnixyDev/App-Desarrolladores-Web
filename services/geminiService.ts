import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";

// La clave de API es inyectada por el entorno.
// Se inicializa el cliente una vez, asumiendo que process.env.API_KEY está disponible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const API_KEY_ERROR_MESSAGE = "Error: La clave de API para los servicios de IA no está configurada o no es válida. La plataforma debería proporcionarla automáticamente. Si el error persiste, contacta al administrador del sitio.";

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
    // --- Nuevos Costes ---
    searchKnowledgeBase: 2,
    analyzeProfitability: 15,
    generateInvoiceItems: 8,
};

// Función auxiliar para gestionar las llamadas a la API de forma segura
async function safeApiCall<T>(apiCall: () => Promise<T>, errorContext: string): Promise<T> {
    if (!process.env.API_KEY) {
        console.error("La clave de API de Gemini no está configurada en el entorno.");
        throw new Error(API_KEY_ERROR_MESSAGE);
    }
    try {
        return await apiCall();
    } catch (error) {
        console.error(`${errorContext}:`, error);
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
            throw new Error("Error: La clave de API de Gemini proporcionada por el entorno no es válida. Por favor, verifica la configuración.");
        }
        throw new Error(`Hubo un error al procesar la solicitud de IA. Por favor, inténtalo de nuevo.`);
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

    // FIX: Explicitly type the safeApiCall to ensure the response object is correctly typed as GenerateContentResponse.
    const response = await safeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
            topP: 1,
            topK: 1,
            maxOutputTokens: 512,
        }
    }), "Error generating proposal with Gemini");
    return response.text;
};

export const refineProposalText = async (originalProposal: string, refinementType: 'formal' | 'conciso' | 'entusiasta'): Promise<string> => {
    const prompt = `
        Eres un experto en comunicación y redacción de propuestas.
        Tu tarea es refinar el siguiente texto de una propuesta para que suene más **${refinementType}**.
        Mantén el mensaje y los puntos clave, pero ajusta el tono, el vocabulario y la estructura según sea necesario.

        **Texto Original:**
        ---
        ${originalProposal}
        ---

        Ahora, por favor, proporciona la versión refinada.
    `;

    // FIX: Explicitly type the safeApiCall to ensure the response object is correctly typed as GenerateContentResponse.
    const response = await safeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.8,
            maxOutputTokens: 512,
        }
    }), "Error refining proposal with Gemini");
    return response.text;
};

export const summarizeApplicant = async (jobDescription: string, applicantProfile: string, applicantProposal: string): Promise<{ summary: string, pros: string[], cons: string[] }> => {
    const prompt = `
        Eres un director de contratación experto en tecnología. Analiza la siguiente información para evaluar a un candidato para un puesto.
        
        **Descripción del Puesto:**
        ${jobDescription}

        **Perfil del Candidato (resumen de su bio y habilidades):**
        ${applicantProfile}

        **Propuesta del Candidato:**
        ${applicantProposal}

        **Tu Tarea:**
        Devuelve un análisis JSON con tres claves:
        1.  "summary": Un resumen conciso de 2-3 frases sobre la idoneidad del candidato.
        2.  "pros": Un array de 2-3 puntos fuertes clave (strings) que hacen que el candidato sea un buen fit.
        3.  "cons": Un array de 1-2 posibles debilidades o puntos a aclarar (strings).
    `;

    // FIX: Explicitly type the safeApiCall to ensure the response object is correctly typed as GenerateContentResponse.
    const response = await safeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
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
    }), "Error summarizing applicant with Gemini");

    const resultText = response.text.trim();
    try {
        return JSON.parse(resultText);
    } catch (e) {
        console.error("Error parsing applicant summary from Gemini:", e);
        throw new Error("La IA devolvió un formato inesperado.");
    }
};


export const getAIResponse = async (
    prompt: string, 
    history: { role: string, parts: any }[],
    tools?: FunctionDeclaration[]
): Promise<GenerateContentResponse> => {
    
    const contents = [...history, { role: 'user', parts: [{ text: prompt }] }];

    // FIX: Explicitly type the safeApiCall to ensure the response object is correctly typed as GenerateContentResponse.
    return safeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: contents as any,
        config: {
            tools: tools ? [{ functionDeclarations: tools }] : undefined,
            temperature: 0.9,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
        }
    }), "Error getting AI response from Gemini");
};

export const generateFinancialForecast = async (data: any): Promise<any> => {
    const prompt = `
        Eres un asesor financiero experto para freelancers. Analiza los siguientes datos de previsión financiera y proporciona un análisis estratégico.

        Datos de Previsión (próximos 6 meses):
        ${JSON.stringify(data, null, 2)}

        Instrucciones:
        1.  "summary": Proporciona un resumen general del panorama financiero y la tendencia del flujo de caja.
        2.  "potentialRisks": Identifica riesgos potenciales, como meses con flujo de caja negativo, estancamiento de ingresos o aumento de gastos.
        3.  "suggestions": Ofrece 2-3 sugerencias accionables y concretas para mejorar la situación (ej. diversificar clientes, recortar gastos específicos, adelantar facturación).
    `;
    
    // FIX: Explicitly type the safeApiCall to ensure the response object is correctly typed as GenerateContentResponse.
    const response = await safeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    potentialRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["summary", "potentialRisks", "suggestions"]
            }
        }
    }), "Error generating financial forecast");

    try {
        const resultText = response.text.trim();
        return JSON.parse(resultText);
    } catch (e) {
        console.error("Error parsing Gemini forecast response:", e);
        return {
            summary: "No se pudo generar un análisis automático. Por favor, inténtalo de nuevo.",
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

    // FIX: Explicitly type the safeApiCall to ensure the response object is correctly typed as GenerateContentResponse.
    const response = await safeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.6,
            maxOutputTokens: 64,
        }
    }), "Error generating time entry description");
    
    return response.text.trim();
};


// --- NUEVAS FUNCIONES ---

export const generateItemsForDocument = async (prompt: string, hourlyRate: number) => {
    // FIX: Explicitly type the safeApiCall to ensure the response object is correctly typed as GenerateContentResponse.
    // FIX: Corrected prompt to use hourly rate in EUR, not cents.
    const response = await safeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Basado en la siguiente descripción, genera una lista de conceptos para una factura o presupuesto. Estima las horas si es necesario y calcula el precio usando una tarifa de ${hourlyRate / 100} EUR/hora. La descripción es: "${prompt}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        price_cents: { type: Type.INTEGER, description: "Precio en céntimos de euro" },
                    },
                    required: ["description", "quantity", "price_cents"],
                },
            },
        },
    }), "Error generating invoice items with Gemini");
    
    const resultText = response.text.trim();
    try {
        return JSON.parse(resultText);
    } catch (e) {
        console.error("Error parsing invoice items from Gemini:", e);
        return [];
    }
};

export const rankArticlesByRelevance = async (query: string, articles: { id: string, title: string, content: string }[]) => {
    const simplifiedArticles = articles.map(a => ({ id: a.id, title: a.title, excerpt: a.content.substring(0, 150) }));
    
    // FIX: Explicitly type the safeApiCall to ensure the response object is correctly typed as GenerateContentResponse.
    const response = await safeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Dada la siguiente consulta de búsqueda y una lista de artículos, devuelve un array JSON con los IDs de los artículos ordenados por relevancia semántica (el más relevante primero). Consulta: "${query}". Artículos: ${JSON.stringify(simplifiedArticles)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
    }), "Error ranking articles with Gemini");

    const resultText = response.text.trim();
    try {
        return JSON.parse(resultText);
    } catch (e) {
        console.error("Error parsing ranked article IDs from Gemini:", e);
        return [];
    }
};

export const analyzeProfitability = async (data: any) => {
    const prompt = `Analiza los siguientes datos de rentabilidad de un freelancer (puede contener un desglose por cliente o por proyecto).
    Identifica qué elementos ofrecen el mejor margen/beneficio y cuáles tienen costes excesivos o márgenes bajos.
    
    Datos: ${JSON.stringify(data)}
    `;

    // FIX: Explicitly type the safeApiCall to ensure the response object is correctly typed as GenerateContentResponse.
    const response = await safeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING, description: "Un resumen de 2-3 frases de la situación financiera y márgenes." },
                    topPerformers: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "Lista de los 2-3 clientes o proyectos más rentables con un breve porqué."
                    },
                    areasForImprovement: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "Sugerencias sobre clientes/proyectos con gastos altos o márgenes bajos."
                    },
                },
                 required: ["summary", "topPerformers", "areasForImprovement"],
            }
        }
    }), "Error analyzing profitability with Gemini");

    const resultText = response.text.trim();
    try {
        return JSON.parse(resultText);
    } catch (e) {
        console.error("Error parsing profitability analysis from Gemini:", e);
        return null;
    }
};