import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURACIÓN DE SUPABASE
 * Estos valores son públicos y necesarios para que el frontend se comunique con la API de Supabase.
 */

const SUPABASE_URL = 'https://umqsjycqypxvhbhmidma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcXNqeWNxeXB4dmhiaG1pZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcwNTksImV4cCI6MjA3ODI5MzA1OX0.YmlHDqxoQa9DRuONwxYenmU-Rj05sVjlMstG3oyCM8I';

// Función para obtener variables de entorno con fallback a los valores proporcionados
const getEnv = (key: string, defaultValue: string): string => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        return (import.meta as any).env[key] || defaultValue;
    }
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || defaultValue;
    }
    return defaultValue;
};

const finalUrl = getEnv('VITE_SUPABASE_URL', SUPABASE_URL);
const finalKey = getEnv('VITE_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

// Verificación de seguridad básica
if (!finalUrl.startsWith('https://')) {
    console.error('⚠️ ERROR: La URL de Supabase debe comenzar con https://');
}

export const supabase = createClient(finalUrl, finalKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});