import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://umqsjycqypxvhbhmidma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcXNqeWNxeXB4dmhiaG1pZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcwNTksImV4cCI6MjA3ODI5MzA1OX0.YmlHDqxoQa9DRuONwxYenmU-Rj05sVjlMstG3oyCM8I';

/**
 * Detecta la URL base dinámicamente.
 * Prioriza window.location.origin para que funcione tanto en el dominio personalizado
 * como en la URL de Vercel.
 */
export const getURL = () => {
  let url =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://app-desarrolladores-web-anixydevs.vercel.app';
  
  // Eliminar barra final si existe
  url = url.endsWith('/') ? url.slice(0, -1) : url;
  return url;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});