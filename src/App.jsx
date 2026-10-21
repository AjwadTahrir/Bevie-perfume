import { useCallback, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import BrandStory from './components/BrandStory'
import Collection from './components/Collection'
import FragranceFinder from './components/FragranceFinder'
import BrandPhilosophy from './components/BrandPhilosophy'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import PerfumeModal from './components/PerfumeModal'

export default function App() {
  const [selected, setSelected] = useState(null)
  const close = useCallback(() => setSelected(null), [])

  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <BrandStory />
        <Collection onSelect={setSelected} />
        <FragranceFinder onSelect={setSelected} />
        <BrandPhilosophy />
        <ContactSection />
      </main>
      <Footer />
      <PerfumeModal perfume={selected} onClose={close} />
    </>
  )
}
