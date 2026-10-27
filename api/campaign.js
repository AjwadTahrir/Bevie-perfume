import { json, route } from './_lib/http.js'
import { dbError, serviceClient } from './_lib/supabase.js'
import { campaignFromRow } from '../shared/campaign.js'

/** GET /api/campaign: the public pricing the storefront shows. */
export const GET = route(async () => {
  const { data, error } = await serviceClient().from('campaign_settings').select('*').eq('id', 1).single()
  if (error) throw dbError(error)
  const c = campaignFromRow(data)
  return json(
    200,
    { campaignName: c.campaignName, sellingPrice: c.sellingPrice, discountedPrice: c.discountedPrice, startsOn: c.startsOn, endsOn: c.endsOn },
    { 'cache-control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=300' },
  )
})
