import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Ensure process.cwd() works in all environments
  const cwd = typeof (process as any).cwd === 'function' ? (process as any).cwd() : '/';
  const env = loadEnv(mode, cwd, '');
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for client-side usage.
      // Mapeamos nombres alternativos (incluyendo traducciones automáticas) a las keys estándar.
      'process.env.API_KEY': JSON.stringify(
        env.VITE_API_KEY || 
        env.API_KEY || 
        env.API_KEY_VITE || 
        env['Clave API'] ||
        ''
      ),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL || 
        env.URL_SUPABASE_VITE || 
        env.SUPABASE_URL || 
        env.ALMACENAMIENTO_SUPABASE_URL ||
        env.URL_SUPABASE_PÚBLICA_SIGUIENTE || 
        env.NEXT_PUBLIC_SUPABASE_URL ||
        ''
      ),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || 
        env.SUPABASE_ANON_KEY || 
        env.SUPABASE_KEY ||
        env.SIGUIENTE_CLAVE_ANÓNIMA_SUPABASE_PÚBLICA ||
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        ''
      ),
      // Variables para uso en backend (si se usaran en edge functions via define, 
      // aunque normalmente estas se leen de process.env en runtime)
      'process.env.STRIPE_SECRET_KEY': JSON.stringify(
        env.STRIPE_SECRET_KEY ||
        env['CLAVE SECRETA DE STRIPE'] ||
        ''
      ),
      'process.env.RESEND_API_KEY': JSON.stringify(
        env.RESEND_API_KEY ||
        ''
      )
    },
  }
})