#!/usr/bin/env node
/**
 * Applies supabase/migrations/*.sql (each once, in order) and then the
 * idempotent seed, to the database in DATABASE_URL.
 *
 *   DATABASE_URL="postgresql://postgres.<ref>:<password>@<host>:5432/postgres" npm run db:apply
 *
 * Use the "Session pooler" or direct connection string from Supabase:
 * Project Settings -> Database -> Connection string.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Set DATABASE_URL to your Supabase Postgres connection string.')
  process.exit(1)
}

const root = join(import.meta.dirname, '..')
const dir = join(root, 'supabase', 'migrations')
const client = new pg.Client({ connectionString: url, ssl: url.includes('localhost') ? false : { rejectUnauthorized: false } })
await client.connect()

try {
  await client.query(`create table if not exists public.bevie_schema_migrations (name text primary key, applied_at timestamptz not null default now())`)
  await client.query(`alter table public.bevie_schema_migrations enable row level security`)
  await client.query(`revoke all on public.bevie_schema_migrations from anon, authenticated`)
  const done = new Set((await client.query('select name from public.bevie_schema_migrations')).rows.map((r) => r.name))

  for (const name of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (done.has(name)) {
      console.log(`skip   ${name}`)
      continue
    }
    await client.query('begin')
    try {
      await client.query(readFileSync(join(dir, name), 'utf8'))
      await client.query('insert into public.bevie_schema_migrations (name) values ($1)', [name])
      await client.query('commit')
      console.log(`apply  ${name}`)
    } catch (e) {
      await client.query('rollback')
      throw new Error(`${name}: ${e.message}`)
    }
  }

  await client.query(readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8'))
  const { rows } = await client.query('select count(*)::int as n from public.ajk_members')
  console.log(`seed   ${rows[0].n} AJK members`)
} finally {
  await client.end()
}
