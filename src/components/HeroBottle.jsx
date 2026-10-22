import { heroProduct } from '../data/perfumes'

/**
 * HERO BOTTLE
 * The real Chestnut Rush product photograph (transparent WebP), with
 * a soft contact shadow. It is a flat photograph, so the scroll
 * sequence only scales, moves and slightly tilts it; it never fakes a
 * rotation that would reveal unseen sides.
 *
 * TO USE A REAL 3D MODEL LATER: replace the <img> below with a lazily
 * loaded canvas (e.g. React Three Fiber + a GLB) inside the same
 * .hb-tilt wrapper. ScrollExperience animates .hb-move and .hb-tilt,
 * so the rest of the site does not need to change. Keep this
 * photograph as the fallback for mobile and missing WebGL.
 */
export default function HeroBottle() {
  return (
    <div className="hb-move pointer-events-none absolute inset-x-0 bottom-[10%] flex h-[56%] justify-center lg:bottom-auto lg:top-[calc(55%-min(21%,14vw))] lg:h-[min(42%,28vw)]">
      <div className="relative h-full">
        <span
          className="absolute bottom-[5%] left-1/2 h-[6%] w-[58%] -translate-x-1/2 rounded-[50%] bg-brown-deep/50 blur-[10px]"
          aria-hidden="true"
        />
        <div className="hb-tilt relative h-full">
          <img
            src={heroProduct.src}
            srcSet={heroProduct.srcSet}
            sizes="(min-width: 1024px) 70vh, 80vw"
            alt={heroProduct.alt}
            width="1200"
            height="1200"
            fetchPriority="high"
            decoding="async"
            className="hero-bottle-enter relative h-full w-auto max-w-none select-none drop-shadow-[0_24px_30px_rgb(79_50_45/0.22)]"
            draggable="false"
          />
        </div>
      </div>
    </div>
  )
}
