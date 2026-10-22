import { pack } from '../assets/pack'
import ProductVisual from './ProductVisual'
import { fragranceFamilies } from '../data/perfumes'
import { formatPrice } from '../lib/format'

// Two bouquets behind the bottle in a V: one leaning left, its mirror leaning right.
const SPRAYS = ['left-[34%] rotate-[76deg]', 'left-[66%] -scale-x-100 rotate-[-76deg]']

/**
 * Product card in the exhibition row: the bottle stands on the cream
 * page between two upright painted batik bouquets set in a V, with a soft
 * contact shadow; the name sits beneath in small capitals. The name
 * is the card's single focusable control, stretched over the card.
 */
export default function PerfumeCard({ perfume, onSelect }) {
  const family = fragranceFamilies[perfume.family]?.label ?? 'Family to be confirmed'

  return (
    <article className="group relative flex h-full flex-col items-center text-center">
      <div className="relative aspect-[4/5] w-full">
        <div className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-[var(--ease-batik)] group-hover:scale-[1.04]">
          {SPRAYS.map((placement) => (
            <img
              key={placement}
              src={pack.bouquet.src}
              srcSet={pack.bouquet.srcSet}
              sizes="(min-width: 1360px) 12vw, (min-width: 640px) 28vw, 55vw"
              alt=""
              width="1200"
              height="800"
              loading="lazy"
              decoding="async"
              className={`absolute top-[46%] w-[96%] max-w-none -translate-x-1/2 -translate-y-1/2 ${placement}`}
            />
          ))}
        </div>
        <span className="absolute bottom-[5%] left-1/2 h-[5%] w-[52%] -translate-x-1/2 rounded-[50%] bg-brown-deep/35 blur-[8px]" aria-hidden="true" />
        <ProductVisual
          perfume={perfume}
          className="absolute inset-x-0 bottom-[1%] h-[84%] w-full transition-transform duration-700 ease-[var(--ease-batik)] group-hover:-translate-y-2"
        />
      </div>

      <button
        type="button"
        onClick={() => onSelect(perfume)}
        className="mt-3 min-h-11 text-[0.72rem] font-medium uppercase tracking-[0.24em] text-brown transition-colors group-hover:text-rust-deep after:absolute after:inset-0 after:content-['']"
        aria-haspopup="dialog"
      >
        {perfume.name}
        <span className="sr-only">: view details</span>
      </button>
      <p className="-mt-2 text-[0.8rem] text-brown-soft">
        {family}
        {typeof perfume.price === 'number' && <> · {formatPrice(perfume.price)}</>}
      </p>
    </article>
  )
}
