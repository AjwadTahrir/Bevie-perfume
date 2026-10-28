import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import PerfumeCard from './PerfumeCard'
import Reveal from './Reveal'
import { sections } from '../config/brand'
import { copy } from '../config/content'
import { categories, perfumes } from '../data/perfumes'

const FILTERS = [{ key: 'all', label: 'All Scents' }, ...categories]
const byAnchor = new Map(categories.map((c) => [c.anchor, c.key]))
const anchorOf = (href) => byAnchor.get(String(href || '').split('#')[1])

/**
 * COLLECTION
 * The eight scents in two collections, For Him and For Her, each with
 * its own anchor (#for-him, #for-her) so the navigation can link
 * straight to it. The filter shows both or one. A link to a collection
 * switches the filter to it before the page scrolls, so the target is
 * always on screen.
 */
export default function Collection({ onSelect }) {
  const c = copy.collection
  const [filter, setFilter] = useState(() => anchorOf(window.location.hash) ?? 'all')

  useEffect(() => {
    // Capture phase: runs before the smooth-scroll handler looks for the section.
    const onClick = (e) => {
      const key = anchorOf(e.target.closest?.('a[href*="#for-"]')?.getAttribute('href'))
      if (key) flushSync(() => setFilter(key))
    }
    const onHash = () => {
      const key = anchorOf(window.location.hash)
      if (key) setFilter(key)
    }
    document.addEventListener('click', onClick, true)
    window.addEventListener('hashchange', onHash)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])

  return (
    <section id={sections.collection} data-nav="collection" aria-labelledby="collection-title" className="overflow-x-clip bg-cream py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-12">
        <Reveal data-scroll-anchor className="mx-auto max-w-2xl text-center">
          <p className="type-eyebrow">{c.eyebrow}</p>
          <h2 id="collection-title" className="type-h2 mt-5 text-balance text-brown">
            {c.title}
          </h2>
          <p className="type-lead mx-auto mt-5 max-w-md">{c.intro}</p>
        </Reveal>

        <div className="mt-9 flex justify-center" role="group" aria-label="Show collection">
          <div className="inline-flex rounded-full border border-brown/25 bg-cream-light/70 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className="min-h-10 rounded-full px-4 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-brown transition-colors duration-300 hover:text-rust-deep aria-pressed:bg-brown aria-pressed:text-cream sm:px-6"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {categories.map((cat) => {
          const items = perfumes.filter((p) => p.category === cat.key)
          return (
            <div
              key={cat.key}
              id={cat.anchor}
              data-nav={cat.anchor}
              hidden={filter !== 'all' && filter !== cat.key}
              aria-labelledby={`${cat.anchor}-title`}
              role="region"
              className="mx-auto mt-14 max-w-[78rem] scroll-mt-[calc(var(--nav-h)+1.5rem)] md:mt-20"
            >
              <div data-scroll-anchor className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b border-ochre/50 pb-5 md:mb-10">
                <h3 id={`${cat.anchor}-title`} className="font-display text-[clamp(1.9rem,1.4rem+1.6vw,2.75rem)] leading-none text-brown">
                  {cat.label}
                </h3>
                <p className="max-w-sm text-[0.9rem] text-brown-soft">{cat.intro}</p>
              </div>
              <ul className="grid grid-cols-1 gap-x-5 gap-y-12 min-[360px]:grid-cols-2 sm:gap-x-8 md:gap-y-16 lg:grid-cols-4 lg:gap-x-8 xl:gap-x-12">
                {items.map((p, i) => (
                  <Reveal as="li" key={p.id} delay={i * 80}>
                    <PerfumeCard perfume={p} onSelect={onSelect} />
                  </Reveal>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
