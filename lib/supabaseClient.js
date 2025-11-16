import { createClient } from '@supabase/supabase-js';

// La URL de Supabase proporcionada por el usuario ha sido implementada.
const supabaseUrl = 'https://umqsjycqypxvhbhmidma.supabase.co';

// ATENCIÓN: La Clave Anónima sigue siendo un marcador de posición.
// Para que el inicio de sesión funcione, debes reemplazar la siguiente cadena de texto con tu Clave Anónima real de Supabase.
// La encontrarás en tu proyecto de Supabase -> Settings -> API -> Project API keys -> anon public.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcXNqeWNxeXB4dmhiaG1pZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcwNTksImV4cCI6MjA3ODI5MzA1OX0.YmlHDqxoQa9DRuONwxYenmU-Rj05sVjlMstG3oyCM8I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);