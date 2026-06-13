import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for the Project Governance Hub.
 *
 * Configured via env (Vite):
 *   VITE_SUPABASE_URL       — project URL (defaults to the BuildMind project)
 *   VITE_SUPABASE_ANON_KEY  — publishable anon key (NEVER the service_role key)
 *
 * If the anon key is not configured the client is null and the data layer
 * (src/api/db.js) transparently falls back to its other backend, so the app
 * keeps working during the incremental migration off Base44.
 */
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ogkyhfspocplkoxftqkd.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
