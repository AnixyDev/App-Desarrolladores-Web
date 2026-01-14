import { GoogleGenerativeAI } from "@google/generative-ai";

// Accedemos a la variable de entorno de Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Inicializamos el SDK
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Función para enviar un prompt a Gemini y recibir la respuesta.
 * @param {string} prompt - El mensaje del usuario o instrucción.
 */
export const askGemini = async (prompt) => {
  try {
    // Puedes cambiar "gemini-1.5-flash" por el modelo que configuraste en AI Studio
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error en Gemini Service:", error);
    throw error;
  }
};