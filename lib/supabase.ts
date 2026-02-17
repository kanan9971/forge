import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase (cookie-backed) for Next.js App Router.
// Safe to import from Client Components only (your pages use 'use client').
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);