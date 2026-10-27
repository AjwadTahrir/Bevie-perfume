const TZ = 'Asia/Kuala_Lumpur'
const money = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const moneyShort = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 })
const dateTime = new Intl.DateTimeFormat('en-MY', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const dateOnly = new Intl.DateTimeFormat('en-MY', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' })
const dayShort = new Intl.DateTimeFormat('en-MY', { timeZone: 'UTC', day: 'numeric', month: 'short' })
const timeOnly = new Intl.DateTimeFormat('en-MY', { timeZone: TZ, hour: 'numeric', minute: '2-digit', second: '2-digit' })
const num = new Intl.NumberFormat('en-MY')

/** "RM 1,234.00" */
export const rm = (n) => money.format(Number(n) || 0).replace(/^RM\s?/, 'RM ')
export const rmShort = (n) => moneyShort.format(Number(n) || 0).replace(/^RM\s?/, 'RM ')
export const n = (v) => num.format(Number(v) || 0)
export const pct = (v, digits = 1) => `${(Number(v) || 0).toFixed(digits).replace(/\.0$/, '')}%`
export const fmtDateTime = (v) => (v ? dateTime.format(new Date(v)) : '—')
export const fmtDate = (v) => (v ? dateOnly.format(new Date(v)) : '—')
export const fmtTime = (v) => (v ? timeOnly.format(new Date(v)) : '—')
/** For 'YYYY-MM-DD' calendar dates from the database. */
export const fmtDay = (d) => (d ? dayShort.format(new Date(`${d}T00:00:00Z`)) : '—')

/** Title-cases names stored in capitals, keeping bin/binti/bt lowercase. */
export function displayName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/(^|[\s'.-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase())
    .replace(/\b(Bin|Binti|Bt|Bte)\b/g, (w) => w.toLowerCase())
}
