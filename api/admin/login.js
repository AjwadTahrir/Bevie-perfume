import { createHash } from 'node:crypto'
import { HttpError, clientIp, json, readJson, route } from '../_lib/http.js'
import { anonClient, dbError, serviceClient } from '../_lib/supabase.js'

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES_PER_USERNAME = 5
const MAX_FAILURES_PER_IP = 20
const invalid = () => new HttpError(401, 'invalid_credentials', 'Incorrect username or password.')

/**
 * POST /api/admin/login { username, password }
 * Maps the admin username to its Supabase Auth account on the server,
 * applies a database-backed rate limit, and returns a Supabase session
 * that the dashboard hands to supabase-js. The password is checked by
 * Supabase Auth (bcrypt); it is never stored or compared here.
 */
export const POST = route(async (request) => {
  const body = await readJson(request, 2000)
  const username = String(body.username || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!username || !password || username.length > 32 || password.length > 200) throw invalid()

  const db = serviceClient()
  const ipHash = createHash('sha256').update(`${clientIp(request)}|${process.env.LOGIN_HASH_SALT || ''}`).digest('hex')
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  const [byUser, byIp] = await Promise.all([
    db.from('admin_login_attempts').select('id', { count: 'exact', head: true }).eq('username', username).eq('succeeded', false).gte('created_at', since),
    db.from('admin_login_attempts').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).eq('succeeded', false).gte('created_at', since),
  ])
  if (byUser.error) throw dbError(byUser.error)
  if (byIp.error) throw dbError(byIp.error)
  if (byUser.count >= MAX_FAILURES_PER_USERNAME || byIp.count >= MAX_FAILURES_PER_IP) {
    throw new HttpError(429, 'rate_limited', 'Too many failed attempts. Please wait 15 minutes and try again.')
  }

  const record = (succeeded) => db.from('admin_login_attempts').insert({ username, ip_hash: ipHash, succeeded })

  const { data: profile, error: profileError } = await db.from('admin_profiles').select('user_id, username, display_name').eq('username', username).maybeSingle()
  if (profileError) throw dbError(profileError)
  let email = null
  if (profile) {
    const { data: user, error } = await db.auth.admin.getUserById(profile.user_id)
    if (error) throw dbError(error)
    email = user?.user?.email ?? null
  }
  if (!email) {
    await record(false)
    throw invalid()
  }

  const { data, error } = await anonClient().auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    await record(false)
    throw invalid()
  }
  await record(true)

  const s = data.session
  return json(200, {
    session: { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at, expires_in: s.expires_in },
    admin: { username: profile.username, displayName: profile.display_name },
  })
})
