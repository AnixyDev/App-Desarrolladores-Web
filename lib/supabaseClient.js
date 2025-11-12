import { createClient } from '@supabase/supabase-js'

// Access env variables from process.env, which is how this platform provides them client-side.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be defined in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
