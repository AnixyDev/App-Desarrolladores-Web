import { createClient } from '@supabase/supabase-js';

// Using placeholder values because environment variables are not available in this execution context.
// This allows the app to load without crashing.
// Real credentials should be configured in your deployment environment.
const supabaseUrl = 'https://placeholder.supabase.co';
const supabaseAnonKey = 'placeholder.anon.key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
