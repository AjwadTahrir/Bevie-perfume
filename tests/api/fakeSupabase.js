import { as } from '../db/harness'

/**
 * A stand-in for the supabase-js service client that runs the same
 * calls against the PGlite test database as the service_role, so the
 * real /api handlers can be exercised end to end.
 */
export function fakeServiceClient(db, { users = {}, passwords = {} } = {}) {
  const storage = new Map()

  function query(table) {
    const filters = []
    let opts = {}
    let insertRow = null
    const run = async (single) => {
      const params = []
      const where = filters.map(([op, col, val]) => {
        params.push(val)
        return `${col} ${op} $${params.length}`
      })
      if (insertRow) {
        const cols = Object.keys(insertRow)
        await as(db, 'service_role', null, (tx) =>
          tx.query(`insert into public.${table} (${cols.join(',')}) values (${cols.map((_, i) => `$${i + 1}`).join(',')})`, Object.values(insertRow)),
        )
        return { data: null, error: null }
      }
      const sql = `select ${opts.head ? 'count(*)::int as n' : '*'} from public.${table}${where.length ? ` where ${where.join(' and ')}` : ''}`
      const { rows } = await as(db, 'service_role', null, (tx) => tx.query(sql, params))
      if (opts.head) return { count: rows[0].n, data: null, error: null }
      return { data: single ? (rows[0] ?? null) : rows, error: null }
    }
    const b = {
      select: (_cols, o = {}) => ((opts = o), b),
      insert: (row) => ((insertRow = row), b),
      eq: (c, v) => (filters.push(['=', c, v]), b),
      gte: (c, v) => (filters.push(['>=', c, v]), b),
      maybeSingle: () => run(true),
      single: () => run(true),
      then: (res, rej) => run(false).then(res, rej),
    }
    return b
  }

  return {
    storage: {
      objects: storage,
      from: (bucket) => ({
        upload: async (path, bytes, o) => {
          storage.set(`${bucket}/${path}`, { bytes, ...o })
          return { data: { path }, error: null }
        },
        remove: async (paths) => {
          paths.forEach((p) => storage.delete(`${bucket}/${p}`))
          return { data: null, error: null }
        },
      }),
    },
    from: query,
    async rpc(name, args) {
      const keys = Object.keys(args)
      const values = Object.values(args).map((v) => (v && typeof v === 'object' ? JSON.stringify(v) : v))
      try {
        const { rows, fields } = await as(db, 'service_role', null, (tx) =>
          tx.query(`select * from public.${name}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')})`, values),
        )
        const scalar = fields.length === 1 && fields[0].name === name
        return { data: scalar ? rows[0][name] : rows, error: null }
      } catch (e) {
        return { data: null, error: { message: e.message } }
      }
    },
    auth: {
      admin: { getUserById: async (id) => ({ data: { user: users[id] ? { id, email: users[id] } : null }, error: null }) },
      signInWithPassword: async ({ email, password }) =>
        passwords[email] === password
          ? { data: { session: { access_token: 'at', refresh_token: 'rt', expires_at: 1, expires_in: 3600 } }, error: null }
          : { data: { session: null }, error: { message: 'Invalid login credentials' } },
    },
  }
}
