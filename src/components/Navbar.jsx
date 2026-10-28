import { useEffect, useRef, useState } from 'react'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { aboutPath, brand, sections } from '../config/brand'
import { useCart } from '../lib/cart'
import BrandMark from './BrandMark'

// Store sections are in-page anchors; on the About page they point back to the store.
const storeLinks = [
  { href: `#${sections.story}`, key: 'our-story', label: 'Our Story' },
  { href: `#${sections.forHim}`, key: sections.forHim, label: 'For Him' },
  { href: `#${sections.forHer}`, key: sections.forHer, label: 'For Her' },
  { href: `#${sections.finder}`, key: 'find-your-scent', label: 'Find Your Scent' },
]
const aboutLink = { href: aboutPath, key: 'about', label: 'About' }

function linksFor(page) {
  const prefix = page === 'home' ? '' : '/'
  return [...storeLinks.map((l) => ({ ...l, href: prefix + l.href })), aboutLink]
}


export default function Navbar({ page = 'home' }) {
  const links = linksFor(page)
  const home = page === 'home' ? '#page-top' : '/'
  const contact = page === 'home' ? `#${sections.contact}` : `/#${sections.contact}`
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(page === 'home' ? 'home' : page)
  const toggleRef = useRef(null)
  const panelRef = useRef(null)
  const cart = useCart()

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
    if (page !== 'home') return
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
  }, [page])

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
    <>
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
          <a
            href={home}
            className="-my-1 justify-self-start rounded-sm py-1 transition-opacity duration-300 hover:opacity-80"
            aria-label={page === 'home' ? `${brand.name}, back to top` : `${brand.name}, home`}
          >
            {/* Symbol and wordmark as one glossy black mark */}
            <BrandMark />
          </a>

          <ul className="hidden items-center lg:flex">
            {links.map((l, i) => (
              <li key={l.href} className="flex items-center">
                {i > 0 && <span className="mx-3.5 size-[3px] rounded-full bg-ochre xl:mx-6" aria-hidden="true" />}
                <a
                  href={l.href}
                  aria-current={active === l.key ? (l.key === 'about' ? 'page' : 'true') : undefined}
                  className={`link-underline py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.2em] whitespace-nowrap transition-colors xl:tracking-[0.24em] ${
                    active === l.key ? 'text-rust-deep' : 'text-brown hover:text-rust-deep'
                  }`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1 justify-self-end lg:gap-4">
            <a href={contact} className="btn btn-outline btn-small hidden xl:inline-flex">
              Contact
            </a>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                cart.open()
              }}
              className="relative inline-flex size-11 items-center justify-center rounded-full text-brown transition-colors hover:bg-brown/5"
              aria-label={cart.count ? `Open cart, ${cart.count} ${cart.count === 1 ? 'item' : 'items'}` : 'Open cart, empty'}
            >
              <ShoppingBag size={21} strokeWidth={1.5} aria-hidden="true" />
              {cart.count > 0 && (
                <span
                  className="absolute right-0.5 top-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-rust px-1 text-[0.62rem] font-semibold leading-[1.15rem] text-cream"
                  aria-hidden="true"
                >
                  {cart.count}
                </span>
              )}
            </button>
            <button
              ref={toggleRef}
              type="button"
              className="-mr-2 inline-flex size-11 items-center justify-center text-brown lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Outside the header: its backdrop-blur makes it the containing block for fixed children, which clipped this panel to the bar height. */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[var(--nav-h)] overflow-y-auto bg-cream px-5 pb-10 pt-6 md:px-8 lg:hidden"
        style={{ zIndex: 'var(--z-menu)' }}
      >
        <ul className="flex flex-col">
          {[{ href: home, key: 'home', label: 'Home' }, ...links, { href: contact, key: 'contact', label: 'Contact' }].map((l) => (
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
    </>
  )
}
