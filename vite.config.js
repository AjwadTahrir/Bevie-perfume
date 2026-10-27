import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = import.meta.dirname

/**
 * Local stand-in for Vercel: serves the /api functions and sends deep
 * links under /admin to the dashboard's index.html. In production,
 * Vercel does both (see vercel.json).
 */
function localPlatform() {
  const handle = async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname === '/admin' || (url.pathname.startsWith('/admin/') && !url.pathname.slice(7).includes('.'))) {
      req.url = '/admin/index.html'
      return next()
    }
    if (!url.pathname.startsWith('/api/')) return next()

    const base = resolve(root, '.' + url.pathname)
    const file = [`${base}.js`, resolve(base, 'index.js')].find(existsSync)
    if (!file || url.pathname.includes('/_')) {
      res.statusCode = 404
      return res.end()
    }
    try {
      const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`)
      const fn = mod[req.method]
      if (!fn) {
        res.statusCode = 405
        return res.end()
      }
      const chunks = []
      for await (const c of req) chunks.push(c)
      const headers = new Headers()
      for (const [k, v] of Object.entries(req.headers)) if (v != null) headers.set(k, Array.isArray(v) ? v.join(', ') : v)
      headers.set('x-forwarded-for', req.socket.remoteAddress || '127.0.0.1')
      const response = await fn(
        new Request(url.href, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }),
      )
      res.statusCode = response.status
      response.headers.forEach((v, k) => res.setHeader(k, v))
      res.end(Buffer.from(await response.arrayBuffer()))
    } catch (e) {
      console.error(e)
      res.statusCode = 500
      res.end('API error')
    }
  }
  return {
    name: 'local-platform',
    configureServer: (server) => void server.middlewares.use(handle),
    configurePreviewServer: (server) => void server.middlewares.use(handle),
  }
}

export default defineConfig(({ mode }) => {
  // Server-only variables (SUPABASE_SERVICE_ROLE_KEY...) for the local /api functions.
  // Only VITE_-prefixed variables are ever exposed to browser code.
  for (const [k, v] of Object.entries(loadEnv(mode, root, ''))) process.env[k] ??= v

  return {
    plugins: [react(), tailwindcss(), localPlatform()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          admin: resolve(root, 'admin/index.html'),
        },
      },
    },
  }
})
