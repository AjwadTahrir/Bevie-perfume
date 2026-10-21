import { ArrowUpRight } from 'lucide-react'
import Motif from '../assets/batik/Motifs'
import { LIQUIDS } from '../assets/products/BottleIllustration'
import ProductVisual from './ProductVisual'
import { fragranceFamilies } from '../data/perfumes'
import { formatPrice } from '../lib/format'

const MOTIF_POSITION = {
  'top-left': '-left-3 -top-3',
  'top-right': '-right-3 -top-3',
  'bottom-left': '-left-4 bottom-10',
  'bottom-right': '-right-4 bottom-10',
}

/**
 * Product card. The whole card is clickable through the stretched
 * "Discover Scent" button, which remains the single focusable control.
 */
export default function PerfumeCard({ perfume, onSelect }) {
  const family = fragranceFamilies[perfume.family]?.label ?? 'Family to be confirmed'
  const tint = LIQUIDS[perfume.bottle?.liquid]?.tint ?? 'var(--color-sage-soft)'

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative">
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-t-full transition-transform duration-700 ease-[var(--ease-batik)] group-hover:-translate-y-1"
          style={{ background: tint }}
        >
          <div className="absolute inset-[6px] rounded-t-full border border-gold/70" aria-hidden="true" />
          <ProductVisual
            perfume={perfume}
            className="absolute inset-x-[16%] bottom-[5%] h-[74%] w-[68%] transition-transform duration-700 ease-[var(--ease-batik)] group-hover:-translate-y-2 group-hover:scale-[1.03]"
          />
        </div>
        <Motif
          name={perfume.motif}
          className={`pointer-events-none absolute size-16 text-forest [--motif-fill:var(--color-ivory)] md:size-20 ${MOTIF_POSITION[perfume.motifPlacement] || MOTIF_POSITION['top-right']}`}
        />
      </div>

      <div className="flex flex-1 flex-col pt-5">
        <p className="type-label text-espresso-soft">{family}</p>
        <h3 className="type-h3 mt-2 text-forest">{perfume.name}</h3>
        <p className="mt-2 line-clamp-3 text-[0.9rem] leading-relaxed text-espresso-soft">{perfume.description}</p>

        <div className="mt-auto flex flex-col gap-3 pt-5 xl:flex-row xl:items-center xl:justify-between">
          <p className={`type-price ${typeof perfume.price === 'number' ? 'text-espresso' : 'text-espresso-soft'}`}>
            {formatPrice(perfume.price, 'Price TBA')}
          </p>
          <button
            type="button"
            onClick={() => onSelect(perfume)}
            className="btn btn-outline btn-small self-start after:absolute after:inset-0 after:content-[''] xl:self-auto"
            aria-haspopup="dialog"
          >
            Discover Scent
            <span className="sr-only">: {perfume.name}</span>
            <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}
