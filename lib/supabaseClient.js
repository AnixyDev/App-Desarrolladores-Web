import { createClient } from '@supabase/supabase-js';

// Gracias a la configuración en vite.config.ts, process.env.VITE_... ahora contiene
// el valor correcto independientemente del nombre de la variable en Vercel (URL_SUPABASE_VITE, etc.)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
  console.warn("⚠️ Advertencia: Las variables de entorno de Supabase no se han detectado correctamente.");
  console.warn("La aplicación se conectará a un placeholder, por lo que la autenticación y los datos fallarán.");
}

// Usar valores placeholder para evitar el crash inicial de la app si faltan las keys,
// permitiendo al menos ver la UI y los logs de error.
const finalUrl = (supabaseUrl && supabaseUrl !== '') ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = (supabaseAnonKey && supabaseAnonKey !== '') ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);