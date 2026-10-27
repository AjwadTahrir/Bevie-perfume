import { ArrowRight } from 'lucide-react'
import ProductVisual from './ProductVisual'
import { fragranceFamilies, tintOf } from '../data/perfumes'
import { formatPrice } from '../lib/format'
import { useCampaign } from '../lib/campaign'

/**
 * Product card: an arched window onto the scent's own still life with
 * the bottle standing in front of it at a fixed scale and baseline,
 * then name, tagline, family and price, and "Discover scent". The
 * button is the card's single focusable control and is stretched over
 * the whole card; focusing it rings the arched image.
 */
export default function PerfumeCard({ perfume, onSelect }) {
  const family = fragranceFamilies[perfume.family]?.label ?? 'Family to be confirmed'
  const scene = perfume.scene
  const { sellingPrice } = useCampaign()

  return (
    <article className="group relative flex h-full flex-col">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-t-full ring-offset-4 ring-offset-cream transition-shadow duration-300 group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-brown"
        style={{ background: tintOf(perfume) }}
      >
        {scene ? (
          <img
            src={scene.src}
            srcSet={scene.srcSet}
            sizes="(min-width: 1024px) 22vw, (min-width: 360px) 46vw, 92vw"
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] ease-[var(--ease-batik)] group-hover:scale-[1.04]"
            style={{ objectPosition: scene.position }}
          />
        ) : (
          // No still life yet: cream with a soft paper texture.
          <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,var(--color-cream-light),transparent_70%)]" aria-hidden="true" />
        )}
        <span className="absolute inset-[6px] rounded-t-full border border-cream/60" aria-hidden="true" />

        {/* Every bottle sits in the same square box on the same baseline */}
        <div className="absolute bottom-[6%] left-1/2 aspect-square w-[78%] -translate-x-1/2 transition-transform duration-700 ease-[var(--ease-batik)] group-hover:-translate-y-1.5">
          <span className="absolute bottom-[7%] left-1/2 h-[6%] w-[52%] -translate-x-1/2 rounded-[50%] bg-brown-deep/40 blur-[8px]" aria-hidden="true" />
          <ProductVisual perfume={perfume} className="absolute inset-0 h-full w-full" />
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-5">
        <h3 className="font-display text-[clamp(1.2rem,1rem+0.9vw,1.55rem)] leading-tight text-brown">{perfume.name}</h3>
        {perfume.tagline && <p className="mt-1 font-display text-[0.95rem] italic leading-snug text-rust-deep">{perfume.tagline}</p>}
        <p className="mt-2 text-[0.8rem] text-brown-soft">
          {family}
          · {formatPrice(sellingPrice)}
        </p>
        <button
          type="button"
          onClick={() => onSelect(perfume)}
          className="link-arrow mt-auto self-start pt-3 text-[0.68rem] text-brown transition-colors group-hover:text-rust-deep focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
          aria-haspopup="dialog"
        >
          Discover scent
          <span className="sr-only">: {perfume.name}</span>
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
