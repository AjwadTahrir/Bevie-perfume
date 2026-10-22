import { ArrowRight } from 'lucide-react'
import { pack } from '../assets/pack'
import Reveal from './Reveal'
import { sections } from '../config/brand'
import { copy } from '../config/content'

/**
 * FINAL CALL TO ACTION
 * A full-width photograph of dark brown cloth with batik worked into
 * two corners; the plain centre keeps the text readable while the pattern stays
 * rich at the edges. Leads into the fragrance finder directly below.
 */
export default function CallToAction() {
  const c = copy.cta
  return (
    <section aria-labelledby="cta-title" className="on-dark relative isolate overflow-hidden bg-brown text-cream">
      <img
        src={pack.band.src}
        srcSet={pack.band.srcSet}
        sizes="100vw"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />

      <Reveal className="mx-auto flex max-w-[1440px] flex-col items-center px-5 py-24 text-center md:px-8 md:py-28">
        <p className="type-eyebrow">{c.eyebrow}</p>
        <h2 id="cta-title" className="type-h2 mt-5 text-cream">
          {c.title[0]}
          <br />
          {c.title[1]}
        </h2>
        <a href={`#${sections.finder}`} className="btn btn-ghost-light mt-9">
          {c.button}
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </Reveal>
    </section>
  )
}
