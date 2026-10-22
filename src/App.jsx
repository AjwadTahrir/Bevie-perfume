import { useCallback, useState } from 'react'
import Navbar from './components/Navbar'
import ScrollExperience from './components/ScrollExperience'
import Collection from './components/Collection'
import CallToAction from './components/CallToAction'
import FragranceFinder from './components/FragranceFinder'
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
        <ScrollExperience />
        <Collection onSelect={setSelected} />
        <CallToAction />
        <FragranceFinder onSelect={setSelected} />
        <ContactSection />
      </main>
      <Footer />
      <PerfumeModal perfume={selected} onClose={close} />
    </>
  )
}
