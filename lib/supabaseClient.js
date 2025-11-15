import { createClient } from '@supabase/supabase-js'

// Using placeholder values because import.meta.env is not available in this environment.
const supabaseUrl = 'https://placeholder.supabase.co'
const supabaseAnonKey = 'placeholder_anon_key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabase };