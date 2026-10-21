import { ArrowRight } from 'lucide-react'
import BatikBloom from '../assets/batik/BatikBloom'
import BottleIllustration from '../assets/products/BottleIllustration'
import { sections } from '../config/brand'
import { copy } from '../config/content'

/**
 * HERO
 * Editorial headline layered over the oversized Batik Bloom. The
 * arched frame holds the hero product visual: currently the
 * placeholder bottle, to be replaced with real product photography
 * (swap <BottleIllustration> for an <img> with descriptive alt text).
 */
export default function Hero() {
  const [line1, line2] = copy.hero.headline

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Navbar watches this sentinel to switch to its solid state. */}
      <div id="page-top" className="absolute inset-x-0 top-0 h-24" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 px-5 pb-16 pt-[calc(var(--nav-h)+2.75rem)] md:px-8 md:pt-[calc(var(--nav-h)+4rem)] lg:min-h-[100dvh] lg:grid-cols-12 lg:content-center lg:px-12 lg:pb-20 lg:pt-[calc(var(--nav-h)+2rem)]">
        <div className="relative z-10 lg:col-span-8">
          <h1 id="hero-title" className="type-display text-forest">
            <span className="hero-enter block" style={{ '--enter-delay': '80ms' }}>
              {line1}
            </span>
            <span className="hero-enter block md:pl-[12%]" style={{ '--enter-delay': '220ms' }}>
              <em className="font-medium">{line2.split(' ')[0]}</em> {line2.split(' ').slice(1).join(' ')}
            </span>
          </h1>

          <div className="mt-8 max-w-[34rem] md:ml-[12%] lg:mt-10">
            <p className="hero-enter type-lead" style={{ '--enter-delay': '420ms' }}>
              {copy.hero.intro}
            </p>
            <div className="hero-enter mt-8 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ '--enter-delay': '560ms' }}>
              <a href={`#${sections.collection}`} className="btn btn-primary">
                Explore Collection
                <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
              </a>
              <a href={`#${sections.story}`} className="link-underline inline-flex min-h-11 items-center gap-2 font-medium text-forest">
                Our Story
              </a>
            </div>
          </div>
        </div>

        {/* Visual: bloom + arched product frame */}
        <div className="relative mx-auto mt-14 aspect-[4/5] w-full max-w-[30rem] md:max-w-[34rem] lg:absolute lg:right-[-7vw] lg:top-1/2 lg:mt-0 lg:aspect-auto lg:h-[min(100dvh,60rem)] lg:w-[58vw] lg:max-w-[64rem] lg:-translate-y-1/2">
          <BatikBloom className="is-visible absolute left-1/2 top-0 w-[128%] max-w-none -translate-x-1/2 [--draw-pace:0.5] lg:left-auto lg:right-0 lg:top-1/2 lg:h-full lg:w-auto lg:translate-x-0 lg:-translate-y-1/2" />

          <div
            className="hero-enter absolute bottom-0 left-[6%] w-[50%] lg:bottom-[5%] lg:left-[4%] lg:w-[min(22rem,32%)]"
            style={{ '--enter-delay': '700ms' }}
          >
            <div className="relative aspect-[3/4] rounded-t-full bg-sage-soft shadow-[0_30px_60px_-30px_rgb(35_72_60/0.45)]">
              <div className="absolute inset-[7px] rounded-t-full border border-gold/80" aria-hidden="true" />
              {/* TODO: replace with hero product photography */}
              <BottleIllustration
                bottle={{ shape: 'arch', liquid: 'sage', cap: 'gold' }}
                className="absolute inset-x-[12%] bottom-[4%] h-[78%] w-[76%]"
                title="Illustrated placeholder for the Beavie hero product"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
