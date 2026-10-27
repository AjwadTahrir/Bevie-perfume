import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

const root = import.meta.dirname

/**
 * Sends deep links under /admin (e.g. /admin/orders/123) to the
 * dashboard's index.html during `vite` and `vite preview`. On Vercel,
 * vercel.json does the same.
 */
function adminRoutes() {
  const handle = (req, _res, next) => {
    const path = req.url.split('?')[0]
    if (path === '/admin' || (path.startsWith('/admin/') && !path.slice(7).includes('.'))) req.url = '/admin/index.html'
    next()
  }
  return {
    name: 'admin-routes',
    configureServer: (server) => void server.middlewares.use(handle),
    configurePreviewServer: (server) => void server.middlewares.use(handle),
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), adminRoutes()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        admin: resolve(root, 'admin/index.html'),
      },
    },
  },
})
