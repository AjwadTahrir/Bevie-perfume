import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { brand, sections } from '../config/brand'

// No journal, search or cart exist yet, so they are not offered.
const links = [
  { href: '#page-top', key: 'home', label: 'Home' },
  { href: `#${sections.story}`, key: 'our-story', label: 'Our Story' },
  { href: `#${sections.collection}`, key: 'collection', label: 'Collection' },
  { href: `#${sections.finder}`, key: 'find-your-scent', label: 'Find Your Scent' },
]

function Wordmark({ className = '' }) {
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className="font-display text-[1.6rem] font-semibold tracking-[0.34em] lg:text-[1.8rem]">{brand.wordmark}</span>
      <span className="mt-1.5 pl-[0.15em] text-[0.56rem] font-medium tracking-[0.62em]">PERFUME</span>
    </span>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')
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

  // Active link: whichever [data-nav] element crosses the middle of the viewport.
  // While the cinematic stage is pinned, its scenes are always on screen, so the
  // scroll-track markers stand in for them (see ScrollExperience).
  useEffect(() => {
    const visible = new Set()
    const pick = () => {
      const valid = [...visible].filter((el) => (el.classList.contains('nav-marker') ? true : !el.closest('.is-cinematic')))
      if (valid.length) setActive(valid[valid.length - 1].dataset.nav)
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)))
        pick()
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    document.querySelectorAll('[data-nav]').forEach((el) => io.observe(el))
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
        solid ? 'border-b border-brown/15 bg-cream/95 backdrop-blur-sm' : 'border-b border-transparent bg-transparent'
      }`}
      style={{ zIndex: 'var(--z-nav)' }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:bg-brown focus:px-4 focus:py-2 focus:text-cream"
      >
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto grid h-[var(--nav-h)] max-w-[1440px] grid-cols-[1fr_auto] items-center px-5 md:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-12">
        <a href="#page-top" className="justify-self-start text-brown" aria-label={`${brand.name}, back to top`}>
          <Wordmark />
        </a>

        <ul className="hidden items-center lg:flex">
          {links.map((l, i) => (
            <li key={l.href} className="flex items-center">
              {i > 0 && <span className="mx-6 size-[3px] rounded-full bg-ochre xl:mx-8" aria-hidden="true" />}
              <a
                href={l.href}
                aria-current={active === l.key ? 'true' : undefined}
                className={`link-underline py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.24em] transition-colors ${
                  active === l.key ? 'text-rust-deep' : 'text-brown hover:text-rust-deep'
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden justify-self-end lg:block">
          <a href={`#${sections.contact}`} className="btn btn-outline btn-small">
            Contact
          </a>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="-mr-2 inline-flex size-11 items-center justify-center justify-self-end text-brown lg:hidden"
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
        className="fixed inset-x-0 bottom-0 top-[var(--nav-h)] overflow-y-auto bg-cream px-5 pb-10 pt-6 md:px-8 lg:hidden"
        style={{ zIndex: 'var(--z-menu)' }}
      >
        <ul className="flex flex-col">
          {[...links, { href: `#${sections.contact}`, key: 'contact', label: 'Contact' }].map((l) => (
            <li key={l.href} className="border-b border-brown/15">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active === l.key ? 'true' : undefined}
                className={`block py-5 font-display text-4xl ${active === l.key ? 'text-rust-deep' : 'text-brown'}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
