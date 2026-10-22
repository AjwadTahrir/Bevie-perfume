import TextilePanel from '../assets/batik/TextilePanel'
import Reveal from './Reveal'
import { sections } from '../config/brand'
import { copy } from '../config/content'

/**
 * BRAND STORY
 * Full-width textile panel with the narrative set on an ivory
 * "swatch" that overlaps its lower edge. Copy is proposed, see
 * src/config/content.js.
 */
export default function BrandStory() {
  const s = copy.story
  return (
    <section id={sections.story} aria-labelledby="story-title" className="relative py-24 md:py-32 lg:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
        <Reveal className="max-w-3xl">
          <p className="type-eyebrow">{s.eyebrow}</p>
          <h2 id="story-title" className="type-h2 mt-5 text-brown">
            {s.title}
          </h2>
        </Reveal>

        <Reveal as="figure" className="mt-12 md:mt-16" delay={100}>
          <div className="overflow-hidden">
            <TextilePanel className="block aspect-[4/3] w-full md:aspect-[15/8]" />
          </div>
          <figcaption className="mt-4 max-w-sm text-sm text-brown-soft">{s.caption}</figcaption>
        </Reveal>

        <Reveal
          delay={150}
          className="relative mt-10 border-t border-ochre/60 pt-8 md:-mt-40 md:ml-auto md:w-[min(36rem,52%)] md:border md:border-ochre/60 md:bg-cream md:p-12 lg:mr-12"
        >
          <div className="space-y-5 text-[1.05rem] leading-relaxed">
            {s.paragraphs.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
