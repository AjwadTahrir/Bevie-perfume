import PerfumeCard from './PerfumeCard'
import Reveal from './Reveal'
import { brand, sections } from '../config/brand'
import { copy } from '../config/content'
import { perfumes, hasPlaceholderProducts } from '../data/perfumes'

/**
 * COLLECTION
 * Eight cards from src/data/perfumes.js: two columns on mobile and
 * tablet, four on desktop, with alternate columns dropped slightly
 * for an editorial rhythm (dimensions stay identical).
 */
export default function Collection({ onSelect }) {
  return (
    <section id={sections.collection} aria-labelledby="collection-title" className="bg-ivory pb-28 pt-8 md:pb-36 lg:pb-44">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
        <Reveal className="max-w-2xl">
          <h2 id="collection-title" className="type-h2 text-balance text-forest">
            {copy.collection.title}
          </h2>
          <p className="type-lead mt-5">{copy.collection.intro}</p>
          {brand.showPlaceholderNotices && hasPlaceholderProducts && (
            <p className="mt-5 inline-block border border-dashed border-espresso-soft px-3 py-1.5 text-sm text-espresso-soft">
              Placeholder catalogue: names, families and details are sample data until the final eight scents are confirmed.
            </p>
          )}
        </Reveal>

        <ul className="mt-16 grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 md:mt-20 md:gap-x-10 md:gap-y-20 lg:grid-cols-4 lg:gap-x-8">
          {perfumes.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 4) * 90} className={i % 2 === 1 ? 'lg:translate-y-14' : ''}>
              <PerfumeCard perfume={p} onSelect={onSelect} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
