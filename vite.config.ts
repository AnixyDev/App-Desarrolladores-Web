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
      // We map various possible environment variable names (including the ones provided by the user)
      // to the standard keys used in the app application code.
      'process.env.API_KEY': JSON.stringify(
        env.VITE_API_KEY || 
        env.API_KEY || 
        env.API_KEY_VITE || // Variant from user
        ''
      ),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL || 
        env.URL_SUPABASE_VITE || // Variant from user
        env.SUPABASE_URL || 
        ''
      ),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || 
        env.SUPABASE_ANON_KEY || // Variant from user
        env.SUPABASE_KEY ||
        ''
      ),
    },
  }
})