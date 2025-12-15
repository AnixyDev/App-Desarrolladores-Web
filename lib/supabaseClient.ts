
import { createClient } from '@supabase/supabase-js';

// Helper function to safely get environment variables across different environments (Vite, Webpack, Node)
const getEnv = (key: string): string => {
    // Check import.meta.env (Vite)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        return (import.meta as any).env[key] || '';
    }
    // Check process.env (Node/Next.js/Webpack)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || '';
    }
    return '';
};

// Try getting the variables using both VITE_ and NEXT_PUBLIC_ prefixes for compatibility
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ ADVERTENCIA: Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). La autenticación y base de datos no funcionarán correctamente.');
}

// Fallback values prevent immediate crash during initialization, though requests will fail if keys are missing.
// We use a syntactically valid URL to prevent 'Invalid URL' errors during client creation.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder'
);
