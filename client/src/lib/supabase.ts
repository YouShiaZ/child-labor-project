// Child Labor Project — Supabase client.
//
// The whole app runs in one of two modes, decided at build time by env vars:
//   • REAL mode  — VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set →
//                  real Postgres database, auth and storage (shared, secure).
//   • DEMO mode  — vars absent → in-browser localStorage + mock auth.
//
// This lets the app always build and deploy; it becomes the real system the
// moment the team adds the two keys in their host's environment variables.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when real Supabase credentials are configured. */
export const SUPABASE_ENABLED = Boolean(url && anonKey);

/** The Supabase client, or null in demo mode. */
export const supabase: SupabaseClient | null = SUPABASE_ENABLED
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Storage bucket names (created by supabase/schema.sql). */
export const BUCKETS = {
  photos: "photos",
  cards: "cards",
  reports: "reports",
} as const;
