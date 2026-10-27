/** Small helpers shared by the /api functions (Web Request -> Response). */

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

/** Wraps a handler so thrown HttpErrors become JSON responses and anything else a generic 500. */
export function route(fn) {
  return async (request) => {
    try {
      return await fn(request)
    } catch (e) {
      if (e instanceof HttpError) return json(e.status, { error: e.code, message: e.message })
      console.error('[api]', e)
      return json(500, { error: 'server_error', message: 'Something went wrong on our side. Please try again.' })
    }
  }
}

export async function readJson(request, maxBytes = 20_000) {
  const text = await request.text()
  if (text.length > maxBytes) throw new HttpError(413, 'too_large', 'Request is too large.')
  try {
    const body = JSON.parse(text)
    if (body && typeof body === 'object') return body
  } catch {
    // fall through
  }
  throw new HttpError(400, 'bad_request', 'Request body must be JSON.')
}

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  return (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown').trim()
}

/**
 * Best-effort per-instance limiter for public endpoints. Serverless
 * instances don't share memory, so this only blunts bursts; admin
 * login uses the database-backed limiter instead.
 */
const buckets = new Map()
export function limit(key, max, windowMs) {
  const now = Date.now()
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs)
  if (hits.length >= max) throw new HttpError(429, 'rate_limited', 'Too many requests. Please wait a minute and try again.')
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 5000) buckets.clear()
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
