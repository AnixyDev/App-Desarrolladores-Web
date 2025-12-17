import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURACIÓN DE SUPABASE - PRODUCCIÓN
 * Se usan los valores directos para asegurar la conexión desde el dominio devfreelancer.app
 */

const SUPABASE_URL = 'https://umqsjycqypxvhbhmidma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcXNqeWNxeXB4dmhiaG1pZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcwNTksImV4cCI6MjA3ODI5MzA1OX0.YmlHDqxoQa9DRuONwxYenmU-Rj05sVjlMstG3oyCM8I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce' // Recomendado para evitar problemas de seguridad en navegadores modernos
    }
});

// Log para verificar en la consola del navegador que el cliente se cargó bien
console.log("Supabase Client inicializado para devfreelancer.app");