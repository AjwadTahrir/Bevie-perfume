/**
 * REFERRAL CODES (PLACEHOLDER LIST)
 * ---------------------------------------------------------------
 * The 36 codes from AJK_Promo_Codes.xlsx. Only the codes are listed:
 * this file ships to every visitor's browser, so the committee
 * members' names and roles from the sheet are deliberately left out.
 * When the database is connected, look codes up there instead (it can
 * hold who each code belongs to) and delete this list.
 */
export const referralCodes = [
  'DMT9T', 'X69D7', 'H7WWU', 'Q4VU5', '233S3', '3VRHA', 'WCDK5', 'DRA57', 'PJN8N',
  '4P2TX', 'C2MCU', '7XZZV', 'KA6ZN', '7VUS6', 'DQT43', '6W7SP', '8TJ6Q', 'V8STT',
  '4AVH3', 'E5B9Z', 'T7YDZ', '7H67D', 'Z89UJ', '4XTZS', '47PQG', 'K5JAB', 'EX7W9',
  'R4T8S', 'N8GJZ', 'SRT35', 'S4QUY', '8B5KM', 'R84DR', 'ZZ49T', 'JR89F', '9Q52S',
]

const codeSet = new Set(referralCodes)

/** Uppercases and strips spaces, so "dmt 9t" matches "DMT9T". */
export const normalizeReferralCode = (raw) => String(raw ?? '').replace(/\s+/g, '').toUpperCase()

export const isValidReferralCode = (raw) => codeSet.has(normalizeReferralCode(raw))
