import { useEffect, useRef, useState } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'
import { brand, sections } from '../config/brand'

const links = [
  { href: `#${sections.story}`, label: 'Our Story' },
  { href: `#${sections.finder}`, label: 'Find Your Scent' },
  { href: `#${sections.contact}`, label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const toggleRef = useRef(null)
  const panelRef = useRef(null)

  // Solid background once the top of the page leaves the viewport.
  useEffect(() => {
    const sentinel = document.getElementById('page-top')
    if (!sentinel) return
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting))
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])

  // Mobile menu: lock scroll, focus first link, Escape closes, close at desktop width.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.style.overflow = 'hidden'
    panelRef.current?.querySelector('a')?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const mq = window.matchMedia('(min-width: 1024px)')
    const onMq = (e) => e.matches && setOpen(false)
    document.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    return () => {
      root.style.overflow = ''
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
    }
  }, [open])

  const solid = scrolled || open

  return (
    <header
      className={`fixed inset-x-0 top-0 transition-[background-color,border-color] duration-500 ease-[var(--ease-batik)] ${
        solid ? 'border-b border-gold/40 bg-ivory/95 backdrop-blur-sm' : 'border-b border-transparent bg-transparent'
      }`}
      style={{ zIndex: 'var(--z-nav)' }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:bg-forest focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-[var(--nav-h)] max-w-[1400px] items-center justify-between px-5 md:px-8 lg:px-12">
        <a href="#page-top" className="font-display text-[1.45rem] font-semibold tracking-[0.32em] text-forest" aria-label={`${brand.name}, back to top`}>
          {brand.wordmark}
        </a>

        <div className="hidden items-center gap-10 lg:flex">
          <ul className="flex items-center gap-9 text-[0.95rem]">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="link-underline py-1 text-espresso hover:text-forest">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a href={`#${sections.collection}`} className="btn btn-primary btn-small">
            Explore Collection
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-forest lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </nav>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[var(--nav-h)] overflow-y-auto bg-ivory px-5 pb-10 pt-8 md:px-8 lg:hidden"
        style={{ zIndex: 'var(--z-menu)' }}
      >
        <ul className="flex flex-col">
          {links.map((l) => (
            <li key={l.href} className="border-b border-gold/40">
              <a href={l.href} onClick={() => setOpen(false)} className="block py-5 font-display text-4xl text-forest">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a href={`#${sections.collection}`} onClick={() => setOpen(false)} className="btn btn-primary mt-10 w-full">
          Explore Collection
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </div>
    </header>
  )
}
