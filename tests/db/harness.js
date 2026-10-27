import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'

const root = join(import.meta.dirname, '..', '..')
const migrationsDir = join(root, 'supabase', 'migrations')

export const migrations = () =>
  readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(join(migrationsDir, f), 'utf8'))
export const seed = () => readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8')

export const tokenHash = (token) => createHash('sha256').update(token).digest('hex')

/** Fresh database with the Supabase stand-ins, every migration and the seed applied. */
export async function createDb() {
  const db = new PGlite()
  await db.exec(readFileSync(join(import.meta.dirname, 'supabase-stubs.sql'), 'utf8'))
  for (const sql of migrations()) await db.exec(sql)
  await db.exec(seed())
  return db
}

/** Runs fn as a Supabase API role, with an optional JWT subject. Always rolled back if it throws. */
export async function as(db, role, sub, fn) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(sub ? { sub, role } : { role })])
    return fn(tx)
  })
}

export async function createAdmin(db, username = 'dahulu') {
  const id = randomUUID()
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${username}@example.test`])
  await db.query('insert into public.admin_profiles (user_id, username) values ($1, $2)', [id, username])
  return id
}

const customer = { name: 'Test Customer', phone: '012-345 6789', address: 'Kolej Kediaman, UiTM Shah Alam' }

/** Creates an order the way the server does (service role). */
export async function placeOrder(db, { items = [{ perfume_id: 'verdius', perfume_name: 'Verdius', quantity: 1 }], promo = null, token = randomUUID() } = {}) {
  const res = await as(db, 'service_role', null, (tx) =>
    tx.query('select * from public.create_order($1, $2, $3, $4)', [customer, JSON.stringify(items), promo, tokenHash(token)]),
  )
  return { ...res.rows[0], token }
}

export async function submitPayment(db, order, transferRef = `TRX${Math.random().toString(36).slice(2, 10)}`) {
  const res = await as(db, 'service_role', null, (tx) =>
    tx.query('select * from public.submit_payment($1, $2, $3, $4, $5, $6, $7, $8)', [
      order.order_id, tokenHash(order.token), transferRef, null, `${order.order_id}/proof.png`, 'image/png', 1200, 'proof.png',
    ]),
  )
  return res.rows[0]
}

export const rpc = (db, adminId, sql, params = []) => as(db, 'authenticated', adminId, (tx) => tx.query(sql, params))
