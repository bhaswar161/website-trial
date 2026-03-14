import { createClient } from '@supabase/supabase-js';

// These variables must match the names in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Error checking to help you debug if the environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Check your .env.local or Vercel settings.'
  );
}

// Create a single supabase client for the entire app
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);