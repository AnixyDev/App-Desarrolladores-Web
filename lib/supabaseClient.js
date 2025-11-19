import { createClient } from '@supabase/supabase-js';

// Función helper para obtener variables de entorno de forma robusta
// Intenta leer de import.meta.env (Vite nativo) y luego de process.env (Vite define polyfill)
const getEnv = (key) => {
  // Vite injection priority
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Process env fallback (handled by vite config define)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Verificar si las variables son válidas y no son placeholders vacíos
const hasUrl = envUrl && envUrl.length > 10 && !envUrl.includes('placeholder') && !envUrl.includes('undefined');
const hasKey = envKey && envKey.length > 10 && !envKey.includes('placeholder') && !envKey.includes('undefined');

export const isConfigured = hasUrl && hasKey;

if (!isConfigured) {
  console.warn("⚠️ Supabase environment variables are missing or invalid.");
  console.debug("URL Configured:", hasUrl, envUrl ? "(hidden value)" : "(empty)");
  console.debug("Key Configured:", hasKey);
}

// Usamos valores seguros por defecto para evitar que createClient lance una excepción fatal
// al importar el archivo, pero la app verificará `isConfigured` antes de renderizar.
const finalUrl = isConfigured ? envUrl : 'https://placeholder.supabase.co';
const finalKey = isConfigured ? envKey : 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);