import { createClient } from '@supabase/supabase-js';

// Usamos variables de entorno para mayor seguridad y flexibilidad
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://umqsjycqypxvhbhmidma.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Detecta automáticamente si estamos en local o en producción
 */
export const getURL = () => {
  let url =
    import.meta.env.VITE_SITE_URL ?? // Variable opcional en Vercel
    window.location.origin ??       // Detecta la URL actual del navegador
    'https://devfreelancer.app';
  
  // Asegurarse de incluir la barra final y eliminar parámetros de búsqueda
  url = url.replace(/\/$/, '');
  return url;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY!, {
    auth: {
        storageKey: 'devfreelancer-auth-token-v2',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce' 
    }
});