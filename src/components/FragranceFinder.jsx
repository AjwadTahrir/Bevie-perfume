import { useMemo, useState } from 'react'
import { RotateCcw, ArrowUpRight } from 'lucide-react'
import ProductVisual from './ProductVisual'
import Reveal from './Reveal'
import { SeedDivider } from '../assets/batik/Ornaments'
import { LIQUIDS } from '../assets/products/BottleIllustration'
import { brand, sections } from '../config/brand'
import { copy } from '../config/content'
import { perfumes, fragranceFamilies, usedFamilies, hasPlaceholderProducts } from '../data/perfumes'

/**
 * FRAGRANCE FINDER
 * Toggle one or more fragrance families to filter the collection.
 * Only families present in the product data are offered. No
 * selection shows every scent.
 */
export default function FragranceFinder({ onSelect }) {
  const [selected, setSelected] = useState([])

  const results = useMemo(
    () => (selected.length ? perfumes.filter((p) => selected.includes(p.family)) : perfumes),
    [selected],
  )

  const toggle = (key) => setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]))

  return (
    <section id={sections.finder} aria-labelledby="finder-title" className="pb-28 md:pb-36 lg:pb-44">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
        <SeedDivider className="mb-20 md:mb-28" />

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <h2 id="finder-title" className="type-h2 text-balance text-forest">
              {copy.finder.title}
            </h2>
            <p className="type-lead mt-5 max-w-md">{copy.finder.intro}</p>

            <fieldset className="mt-10">
              <legend className="sr-only">Fragrance families</legend>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 lg:grid-cols-1">
                {usedFamilies.map((key) => {
                  const active = selected.includes(key)
                  const count = perfumes.filter((p) => p.family === key).length
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(key)}
                      className={`group flex min-h-12 items-baseline gap-3 border-b py-3 text-left transition-colors duration-300 ${
                        active ? 'border-forest text-forest' : 'border-gold/50 text-espresso-soft hover:text-forest'
                      }`}
                    >
                      <span
                        className={`mt-auto mb-auto size-3 shrink-0 rounded-full border transition-colors ${
                          active ? 'border-forest bg-forest' : 'border-espresso-soft bg-transparent'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="font-display text-[1.9rem] leading-none md:text-[2.4rem]">{fragranceFamilies[key].label}</span>
                      <span className="text-sm tabular-nums">({count})</span>
                      <span className="ml-auto hidden max-w-[14rem] text-right text-sm text-espresso-soft lg:block">
                        {fragranceFamilies[key].blurb}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="button" onClick={() => setSelected([])} disabled={!selected.length} className="btn btn-outline btn-small">
                <RotateCcw size={15} strokeWidth={1.5} aria-hidden="true" />
                Reset
              </button>
              <p className="text-sm text-espresso-soft" aria-live="polite">
                Showing {results.length} of {perfumes.length} scents
              </p>
            </div>

            {brand.showPlaceholderNotices && hasPlaceholderProducts && (
              <p className="mt-6 max-w-md text-sm text-espresso-soft">
                Demonstration families: these groupings are sample data and will change when the real scents are added.
              </p>
            )}
          </Reveal>

          <Reveal className="lg:col-span-7" delay={120}>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Matching scents">
              {results.map((p, i) => (
                <li key={`${p.id}-${selected.join()}`} className="finder-item" style={{ '--i': i }}>
                  <button
                    type="button"
                    onClick={() => onSelect(p)}
                    aria-haspopup="dialog"
                    className="group flex w-full items-center gap-5 border border-gold/50 bg-ivory p-3 pr-5 text-left transition-colors duration-300 hover:border-forest"
                  >
                    <span
                      className="relative block h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-t-full"
                      style={{ background: LIQUIDS[p.bottle?.liquid]?.tint }}
                    >
                      <ProductVisual perfume={p} className="absolute inset-x-[10%] bottom-[4%] h-[80%] w-[80%]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="type-label block text-espresso-soft">{fragranceFamilies[p.family]?.label}</span>
                      <span className="mt-1 block font-display text-2xl text-forest">{p.name}</span>
                    </span>
                    <ArrowUpRight
                      size={18}
                      strokeWidth={1.5}
                      className="shrink-0 text-forest transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                    <span className="sr-only">View details</span>
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
