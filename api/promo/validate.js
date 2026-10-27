import { HttpError, clientIp, json, limit, readJson, route } from '../_lib/http.js'
import { dbError, serviceClient } from '../_lib/supabase.js'
import { PROMO_CODE_PATTERN, normalizePromoCode } from '../../shared/campaign.js'

/** POST /api/promo/validate { code } -> { valid, code, member } */
export const POST = route(async (request) => {
  limit(`promo:${clientIp(request)}`, 20, 60_000)
  const { code: raw } = await readJson(request)
  const code = normalizePromoCode(raw)
  if (!PROMO_CODE_PATTERN.test(code)) throw new HttpError(400, 'invalid_promo_code', 'Promo codes are five letters or numbers.')

  const { data, error } = await serviceClient().rpc('lookup_promo_code', { p_code: code })
  if (error) throw dbError(error)
  const member = data?.[0]
  if (!member) throw new HttpError(404, 'invalid_promo_code', 'That promo code is not valid or is no longer active.')
  return json(200, { valid: true, code: member.promo_code, member: { name: member.full_name, role: member.committee_role } })
})
