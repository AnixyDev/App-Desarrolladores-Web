
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://umqsjycqypxvhbhmidma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcXNqeWNxeXB4dmhiaG1pZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcwNTksImV4cCI6MjA3ODI5MzA1OX0.YmlHDqxoQa9DRuONwxYenmU-Rj05sVjlMstG3oyCM8I';

/**
 * Devuelve la URL base oficial del proyecto.
 */
export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env vars
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'https://devfreelancer.app';
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to including trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storageKey: 'devfreelancer-auth-session-v3', 
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});
