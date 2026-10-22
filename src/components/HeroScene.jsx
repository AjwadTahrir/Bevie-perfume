import { ArrowRight } from 'lucide-react'
import { pack } from '../assets/pack'
import HeroBottle from './HeroBottle'
import { sections } from '../config/brand'
import { copy } from '../config/content'

/**
 * HERO SCENE
 * Campaign still life: text on the left; on the right the real bottle
 * with the painted batik bouquet behind it. The bouquet and the
 * bottle are the layers the scroll sequence moves at different speeds. On small screens and under
 * reduced motion this is a normal, static section.
 */
export default function HeroScene() {
  const h = copy.hero
  return (
    <section data-nav="home" aria-labelledby="hero-title" className="scene scene-hero relative isolate overflow-hidden lg:h-[100dvh]">
      {/* Cream wall photograph with soft leaf shadows and warm light */}
      <div
        className="hero-backdrop absolute inset-0 -z-10 bg-cream bg-cover bg-[position:left_top] lg:bg-[position:right_top]"
        style={{ backgroundImage: `linear-gradient(90deg, rgb(245 228 206 / 0.55), transparent 55%), url(${pack.wall.src})` }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid h-full max-w-[1440px] grid-cols-1 px-5 pt-[calc(var(--nav-h)+2.5rem)] md:px-8 lg:grid-cols-12 lg:px-12 lg:pt-[var(--nav-h)]">
        <div className="hero-copy relative z-10 lg:col-span-5 lg:self-center lg:pb-10">
          <p className="type-eyebrow hero-enter" style={{ '--enter-delay': '60ms' }}>
            {h.eyebrow}
          </p>
          <h1 id="hero-title" className="type-display mt-6 text-brown">
            <span className="hero-enter block" style={{ '--enter-delay': '160ms' }}>
              {h.headline[0]}
            </span>
            <span className="hero-enter block" style={{ '--enter-delay': '280ms' }}>
              {h.headline[1]}
            </span>
          </h1>
          <p className="hero-enter type-lead mt-7 max-w-[26rem]" style={{ '--enter-delay': '440ms' }}>
            {h.intro}
          </p>
          <div className="hero-enter mt-9" style={{ '--enter-delay': '580ms' }}>
            <a href={`#${sections.collection}`} className="btn btn-primary">
              {h.cta}
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="hero-visual relative mt-4 h-[min(62vh,28rem)] sm:h-[min(70vh,38rem)] lg:col-span-7 lg:mt-0 lg:h-full">
          {/* Back layer: the painted batik bouquet behind the bottle */}
          <div className="layer-back pointer-events-none absolute bottom-[15%] left-1/2 w-[min(112%,40rem)] -translate-x-[42%] lg:bottom-[9%] lg:w-[min(118%,60rem)] lg:-translate-x-[42%]">
            <img
              src={pack.bouquet.src}
              srcSet={pack.bouquet.srcSet}
              sizes="(min-width: 1024px) 60rem, 112vw"
              alt=""
              width="1200"
              height="800"
              decoding="async"
              className="hero-fade-enter w-full"
            />
          </div>

          <HeroBottle />
        </div>
      </div>

      {/* Scroll cue: the wheel dot is driven by the scroll sequence */}
      <div className="scroll-cue absolute bottom-10 right-6 hidden flex-col items-center gap-3 lg:flex xl:right-10" aria-hidden="true">
        <span className="scroll-cue-mouse">
          <span className="scroll-cue-dot" />
        </span>
        <span className="text-[0.58rem] font-medium uppercase tracking-[0.3em] text-brown [writing-mode:vertical-rl]">Scroll</span>
      </div>
    </section>
  )
}
