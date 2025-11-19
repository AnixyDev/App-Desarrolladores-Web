import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = typeof (process as any).cwd === 'function' ? (process as any).cwd() : '/';
  const env = loadEnv(mode, cwd, '');
  
  // Helper para buscar en múltiples keys posibles
  const getEnvVar = (keys: string[]) => {
    for (const key of keys) {
      if (env[key]) return env[key];
    }
    return '';
  };

  const supabaseUrl = getEnvVar([
    'VITE_SUPABASE_URL', 
    'URL_SUPABASE_VITE', 
    'SUPABASE_URL', 
    'ALMACENAMIENTO_SUPABASE_URL',
    'URL_SUPABASE_PÚBLICA_SIGUIENTE',
    'NEXT_PUBLIC_SUPABASE_URL'
  ]);

  const supabaseKey = getEnvVar([
    'VITE_SUPABASE_ANON_KEY', 
    'SUPABASE_ANON_KEY', 
    'SUPABASE_KEY', 
    'SIGUIENTE_CLAVE_ANÓNIMA_SUPABASE_PÚBLICA',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]);

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env para que el código cliente pueda acceder a las variables
      // independientemente de si usa import.meta.env o process.env
      'process.env.API_KEY': JSON.stringify(getEnvVar(['VITE_API_KEY', 'API_KEY', 'API_KEY_VITE', 'Clave API'])),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
      'process.env.STRIPE_SECRET_KEY': JSON.stringify(getEnvVar(['STRIPE_SECRET_KEY', 'CLAVE SECRETA DE STRIPE'])),
      'process.env.RESEND_API_KEY': JSON.stringify(getEnvVar(['RESEND_API_KEY']))
    },
  }
})