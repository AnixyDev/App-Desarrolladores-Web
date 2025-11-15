import { createClient } from '@supabase/supabase-js'

// Using the URL provided by the user. A valid anon key is required for authentication to work.
const supabaseUrl = 'https://umqsjycqypxvhbhmidma.supabase.co'
// The user did not provide the anon key, so authentication will fail until it's provided.
const supabaseAnonKey = 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabase };
