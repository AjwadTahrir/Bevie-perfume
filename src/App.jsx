import { useCallback, useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import ScrollExperience from './components/ScrollExperience'
import Collection from './components/Collection'
import CallToAction from './components/CallToAction'
import FragranceFinder from './components/FragranceFinder'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import PerfumeModal from './components/PerfumeModal'
import CartDrawer from './components/CartDrawer'
import { CartProvider } from './lib/cart'
import { CampaignProvider } from './lib/campaign'
import { installAnchorScroll } from './lib/anchorScroll'

export default function App() {
  const [selected, setSelected] = useState(null)
  const close = useCallback(() => setSelected(null), [])
  useEffect(installAnchorScroll, [])

  return (
    <CampaignProvider>
      <CartProvider>
        <Navbar />
        <main id="main">
          <ScrollExperience onSelect={setSelected} />
          <Collection onSelect={setSelected} />
          <CallToAction />
          <FragranceFinder onSelect={setSelected} />
          <ContactSection />
        </main>
        <Footer />
        <PerfumeModal perfume={selected} onClose={close} onNavigate={setSelected} />
        <CartDrawer />
      </CartProvider>
    </CampaignProvider>
  )
}
