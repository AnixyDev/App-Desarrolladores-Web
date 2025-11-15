import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase;
let supabaseError = null;

if (!supabaseUrl || !supabaseAnonKey) {
    supabaseError = "Supabase URL and Anon Key must be defined in environment variables. Please check your project settings.";
    supabase = null;
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Export both the client and a potential error message
export { supabase, supabaseError };
