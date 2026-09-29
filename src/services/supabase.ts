import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para conectar ao banco.');
  return supabase;
}