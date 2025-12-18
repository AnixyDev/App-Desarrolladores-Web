import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://umqsjycqypxvhbhmidma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcXNqeWNxeXB4dmhiaG1pZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcwNTksImV4cCI6MjA3ODI5MzA1OX0.YmlHDqxoQa9DRuONwxYenmU-Rj05sVjlMstG3oyCM8I';

/**
 * Devuelve la URL base oficial del proyecto.
 */
export const getURL = () => {
  return 'https://devfreelancer.app';
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storageKey: 'devfreelancer-auth-token-v2', // Clave única para evitar conflictos de cookies
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce' // Estándar moderno de autenticación para SPAs
    }
});