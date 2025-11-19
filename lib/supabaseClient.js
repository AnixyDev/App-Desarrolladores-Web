import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE CONTINGENCIA ---
// URL conocida del proyecto para asegurar que el cliente siempre tenga un endpoint válido.
const FALLBACK_URL = 'https://umqsjycqypxvhbhmidma.supabase.co';

// Función helper para buscar variables de entorno en múltiples ubicaciones
const getEnv = (key) => {
  // 1. Intentar import.meta.env (Estándar Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // 2. Intentar process.env (Inyectado por vite.config.ts o entorno Node)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return null;
};

// 1. Obtener URL
let envUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || FALLBACK_URL;

// 2. Obtener Key (Buscamos en todas las variantes comunes)
let envKey = getEnv('VITE_SUPABASE_ANON_KEY') || 
             getEnv('SUPABASE_ANON_KEY') || 
             getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
             getEnv('REACT_APP_SUPABASE_ANON_KEY');

// Verificación de integridad
const isUrlValid = envUrl && envUrl.startsWith('http');
const isKeyValid = envKey && envKey.length > 20;

// Exportamos el estado de la configuración
export const isConfigured = isUrlValid && isKeyValid;

if (isConfigured) {
  console.log("✅ Cliente Supabase inicializado correctamente.");
} else {
  console.warn("⚠️ Advertencia de Configuración Supabase:");
  console.warn("- URL Válida:", isUrlValid ? "Sí" : "No", envUrl);
  console.warn("- Key Válida:", isKeyValid ? "Sí" : "No");
  
  // Si no hay key, usamos un placeholder para evitar que createClient lance una excepción inmediata.
  // Esto permite que la app cargue la UI, aunque las peticiones a la BD fallarán (401).
  if (!envKey) envKey = 'placeholder-key-missing';
}

export const supabase = createClient(envUrl, envKey);
