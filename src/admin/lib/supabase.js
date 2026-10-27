import { createClient } from '@supabase/supabase-js'

/**
 * Browser client for the dashboard. It only ever holds the public
 * anon key; every read is filtered by RLS (admins only) and every
 * change goes through an admin_* database function that checks the
 * signed-in user is in shop_admins (is_shop_admin()).
 */
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)

export const supabase = isConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'bevie-admin-session' } })
  : null
