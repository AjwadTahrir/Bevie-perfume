import PerfumeCard from './PerfumeCard'
import Reveal from './Reveal'
import { sections } from '../config/brand'
import { copy } from '../config/content'
import { perfumes } from '../data/perfumes'

/**
 * COLLECTION
 * The eight scents as a curated exhibition: one row of eight on wide
 * screens, four by two on laptops and tablets, two columns on phones.
 * Every card shares the same baseline; they rise in with a light
 * stagger as the cinematic stage releases.
 */
export default function Collection({ onSelect }) {
  const c = copy.collection
  return (
    <section id={sections.collection} data-nav="collection" aria-labelledby="collection-title" className="overflow-x-clip bg-cream py-24 md:py-32 lg:py-36">
      <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="type-eyebrow">{c.eyebrow}</p>
          <h2 id="collection-title" className="type-h2 mt-5 text-balance text-brown">
            {c.title}
          </h2>
          <p className="type-lead mx-auto mt-5 max-w-md">{c.intro}</p>
        </Reveal>

        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-4 sm:gap-x-6 md:mt-14 lg:gap-x-8 wide:grid-cols-8 wide:gap-x-3">
          {perfumes.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 8) * 70}>
              <PerfumeCard perfume={p} onSelect={onSelect} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
