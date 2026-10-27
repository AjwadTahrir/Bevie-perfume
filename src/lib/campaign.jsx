import { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_CAMPAIGN } from '../../shared/campaign'

/**
 * CAMPAIGN PRICING
 * The selling and promo prices are read from /api/campaign (the
 * campaign_settings table). Until that answers, or if it can't be
 * reached, the defaults in shared/campaign.js are shown. Either way
 * the server computes what is actually charged.
 */
const CampaignContext = createContext(DEFAULT_CAMPAIGN)

export function CampaignProvider({ children }) {
  const [campaign, setCampaign] = useState(DEFAULT_CAMPAIGN)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/campaign', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setCampaign((c) => ({ ...c, ...data, loaded: true })))
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  return <CampaignContext.Provider value={campaign}>{children}</CampaignContext.Provider>
}

export const useCampaign = () => useContext(CampaignContext)
