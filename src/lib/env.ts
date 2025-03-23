// Environment variables that are exposed to the client
// Ensures proper typing and fallback values

export const env = {
  OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
}; 