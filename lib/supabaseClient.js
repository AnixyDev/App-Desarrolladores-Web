
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN SEGURA DE ENTORNO ---

// Credenciales de respaldo para garantizar funcionamiento si fallan las variables de entorno
// Updated with user provided keys
const FALLBACK_URL = 'https://umqsjycqypxvhbhmidma.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcXNqeWNxeXB4dmhiaG1pZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcwNTksImV4cCI6MjA3ODI5MzA1OX0.YmlHDqxoQa9DRuONwxYenmU-Rj05sVjlMstG3oyCM8I';

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
let supabaseUrl = getEnv('VITE_SUPABASE_URL');
let supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

let usedFallback = false;

if (!supabaseUrl) {
    supabaseUrl = FALLBACK_URL;
    usedFallback = true;
}

if (!supabaseKey) {
    supabaseKey = FALLBACK_KEY;
    usedFallback = true;
}

// Validación final
const hasCredentials = !!(supabaseUrl && supabaseKey);

if (usedFallback) {
    // Informational log, not an error. This is expected in some environments without .env files.
    console.log('ℹ️ Supabase env vars not detected. Switched to internal fallback credentials. App should work normally.');
} else if (!hasCredentials) {
    // This is a real critical error
    console.error('❌ CRITICAL: Could not load Supabase credentials from env or fallback.');
}

export const isConfigured = hasCredentials;

// Inicialización del cliente
export const supabase = createClient(
    hasCredentials ? supabaseUrl : 'https://placeholder.supabase.co',
    hasCredentials ? supabaseKey : 'placeholder-key'
);
