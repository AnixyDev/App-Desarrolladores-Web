import { createClient } from '@supabase/supabase-js';

// Helper function to safely get environment variables across different environments
const getEnv = (key: string): string => {
    // Check for Vite
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        const val = (import.meta as any).env[key];
        if (val) return val;
    }
    // Check for process.env (Node/Next/Webpack)
    if (typeof process !== 'undefined' && process.env) {
        const val = process.env[key];
        if (val) return val;
    }
    // Check for global window (Fallback)
    if (typeof window !== 'undefined') {
        const val = (window as any)[key];
        if (val) return val;
    }
    return '';
};

// URL de Supabase proporcionada por el usuario
const DEFAULT_URL = 'https://umqsjycqypxvhbhmidma.supabase.co';
// Clave Anon proporcionada por el usuario
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcXNqeWNxeXB4dmhiaG1pZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcwNTksImV4cCI6MjA3ODI5MzA1OX0.YmlHDqxoQa9DRuONwxYenmU-Rj05sVjlMstG3oyCM8I';

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL') || DEFAULT_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || DEFAULT_KEY;

// Inicializamos el cliente.
export const supabase = createClient(
    supabaseUrl, 
    supabaseAnonKey
);
