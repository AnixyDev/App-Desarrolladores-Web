import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN SEGURA DE ENTORNO ---

// Helper para obtener variables de forma segura en cualquier entorno (Vite/Node/Vercel)
const getEnv = (key) => {
  // 1. Vite (Frontend/Browser) - Prioridad
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // 2. Process (SSR/Node/Build Time) - Fallback
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// Determinación segura del entorno de producción
const isProd = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) ||
               (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production');

// Obtener credenciales usando los nombres estándar de Vite
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Validación
const hasCredentials = !!(supabaseUrl && supabaseKey);

if (!hasCredentials) {
    console.warn('⚠️ Supabase environment variables are missing locally.');
    
    if (isProd) {
        // Error ruidoso en logs de producción para depuración
        console.error('❌ CRITICAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing in Vercel Environment Variables.');
        console.error('   Make sure they are defined in Vercel Project Settings with the exact names.');
    }
}

export const isConfigured = hasCredentials;

// Inicialización del cliente
// Usamos placeholders si faltan las claves para evitar que la app lance una excepción fatal (white screen)
// al importar este archivo. La lógica de App.tsx o authSlice manejará la falta de conexión.
export const supabase = createClient(
    hasCredentials ? supabaseUrl : 'https://placeholder.supabase.co',
    hasCredentials ? supabaseKey : 'placeholder-key'
);
