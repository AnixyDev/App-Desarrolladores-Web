import { createClient } from '@supabase/supabase-js'

// Hardcoding Supabase credentials because they are not available via process.env in this environment.
// In a typical production setup, these should be securely managed as environment variables.
const supabaseUrl = 'https://umqsjycqypxvhbhmidma.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcXNqeWNxeXB4dmhiaG1pZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcwNTksImV4cCI6MjA3ODI5MzA1OX0.YmlHDqxoQa9DRuONwxYenmU-Rj05sVjlMstG3oyCM8I';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be defined.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);