#!/usr/bin/env node
/**
 * Creates (or resets the password of) a dashboard admin.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   ADMIN_USERNAME=dahulu ADMIN_PASSWORD='...' npm run admin:create
 *
 * The password goes straight to Supabase Auth, which stores only a
 * bcrypt hash. It is never written to this repository. Supabase Auth
 * needs an email per account; the username maps to it server-side, and
 * ADMIN_EMAIL lets you use a real address (default: <username>@admin.bevie.local).
 */
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const username = String(process.env.ADMIN_USERNAME || '').trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD || ''
const email = (process.env.ADMIN_EMAIL || `${username}@admin.bevie.local`).toLowerCase()

if (!url || !key || !username || !password) {
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_USERNAME, ADMIN_PASSWORD')
  process.exit(1)
}
if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
  console.error('Username must be 3-32 characters: letters, numbers, dot, dash or underscore.')
  process.exit(1)
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.')
  process.exit(1)
}

const { createClient } = await import('@supabase/supabase-js')
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: existing, error: profileError } = await db.from('admin_profiles').select('user_id').eq('username', username).maybeSingle()
if (profileError) throw profileError

let userId = existing?.user_id
if (userId) {
  const { error } = await db.auth.admin.updateUserById(userId, { password })
  if (error) throw error
  console.log(`Updated the password for admin "${username}".`)
} else {
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role: 'campaign_admin' } })
  if (error) throw error
  userId = data.user.id
  const { error: insertError } = await db.from('admin_profiles').insert({ user_id: userId, username, display_name: username })
  if (insertError) throw insertError
  console.log(`Created admin "${username}" (${email}).`)
}
