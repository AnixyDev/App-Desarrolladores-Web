import { createClient } from '@supabase/supabase-js';

// La URL de Supabase proporcionada por el usuario ha sido implementada.
const supabaseUrl = 'https://umqsjycqypxvhbhmidma.supabase.co';

// ATENCIÓN: La Clave Anónima sigue siendo un marcador de posición.
// Para que el inicio de sesión funcione, debes reemplazar la siguiente cadena de texto con tu Clave Anónima real de Supabase.
// La encontrarás en tu proyecto de Supabase -> Settings -> API -> Project API keys -> anon public.
const supabaseAnonKey = 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);