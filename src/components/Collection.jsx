import PerfumeCard from './PerfumeCard'
import Reveal from './Reveal'
import { sections } from '../config/brand'
import { copy } from '../config/content'
import { perfumes } from '../data/perfumes'

/**
 * COLLECTION
 * The eight scents as a curated exhibition: four columns on desktop,
 * two on tablets and phones, one on the narrowest screens. Each card
 * frames its bottle in the scent's own still life; they rise in with a
 * light stagger as the cinematic stage releases.
 */
export default function Collection({ onSelect }) {
  const c = copy.collection
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

        <ul className="mx-auto mt-10 grid max-w-[78rem] grid-cols-1 gap-x-5 gap-y-12 min-[360px]:grid-cols-2 sm:gap-x-8 md:mt-12 md:gap-y-16 lg:grid-cols-4 lg:gap-x-8 xl:gap-x-12 xl:gap-y-20">
          {perfumes.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 4) * 80}>
              <PerfumeCard perfume={p} onSelect={onSelect} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
