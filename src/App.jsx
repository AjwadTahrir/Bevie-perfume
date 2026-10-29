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
import PrivacyPage from './components/PrivacyPage'
import SchedulePage from './components/SchedulePage'
import { CartProvider } from './lib/cart'
import { installAnchorScroll } from './lib/anchorScroll'
import { privacyPath, schedulePath } from './config/brand'

// Three pages share the shell: the one-page store at /, the pre-order schedule at /schedule and the privacy policy at /privacy.
const path = window.location.pathname.replace(/\/+$/, '')
const page = path === privacyPath ? 'privacy' : path === schedulePath ? 'schedule' : 'home'

export default function App() {
  const [selected, setSelected] = useState(null)
  const close = useCallback(() => setSelected(null), [])
  useEffect(installAnchorScroll, [])

  return (
    <CartProvider>
      <Navbar page={page} />
      <main id="main">
        {page === 'privacy' ? (
          <PrivacyPage />
        ) : page === 'schedule' ? (
          <SchedulePage />
        ) : (
          <>
            <ScrollExperience onSelect={setSelected} />
            <Collection onSelect={setSelected} />
            <CallToAction />
            <FragranceFinder onSelect={setSelected} />
            <ContactSection />
          </>
        )}
      </main>
      <Footer page={page} />
      {page === 'home' && <PerfumeModal perfume={selected} onClose={close} onNavigate={setSelected} />}
      <CartDrawer />
    </CartProvider>
  )
}
