import { createClient } from '@supabase/supabase-js'

// Using placeholder values as the execution environment does not automatically
// inject environment variables for client-side code. This allows the Supabase
// client to initialize without crashing the app.
const supabaseUrl = 'https://placeholder.supabase.co';
const supabaseAnonKey = 'placeholder.anon.key';


const supabase = createClient(supabaseUrl, supabaseAnonKey);

// The supabaseError is no longer exported.
export { supabase };
