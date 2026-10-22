import { useId, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { pack } from '../assets/pack'
import Reveal from './Reveal'
import { sections } from '../config/brand'
import { copy } from '../config/content'

/**
 * HERITAGE SCENE
 * Editorial split: draped batik cloth on the left; on the right the
 * story, a hairline divider and a painted batik phoenix. In the
 * cinematic sequence the cloth wipes in from the left and the hero
 * bottle comes to rest on it. "Discover our story" swaps the intro
 * for the longer story in place.
 */
export default function HeritageScene() {
  const s = copy.heritage
  const [open, setOpen] = useState(false)
  const storyId = useId()

  return (
    <section
      id={sections.story}
      data-nav="our-story"
      aria-labelledby="heritage-title"
      className="scene scene-heritage relative grid grid-cols-1 bg-cream lg:min-h-[100dvh] lg:grid-cols-2"
    >
      <div className="heritage-textile relative h-[22rem] overflow-hidden sm:h-[28rem] lg:h-auto">
        <img
          src={pack.fabric.src}
          srcSet={pack.fabric.srcSet}
          sizes="(min-width: 1024px) 50vw, 100vw"
          alt="Draped batik cloth in burnt orange, dark brown and dusty teal"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[62%_50%]"
        />
      </div>

      <div className="heritage-panel relative flex items-center gap-10 px-5 py-20 md:px-12 lg:pb-6 lg:pl-14 lg:pt-[var(--nav-h)] xl:gap-12 xl:pl-20">
        <div className="relative z-10 min-w-0 max-w-[27rem] flex-1 xl:w-[24rem] xl:flex-none">
          <Reveal className="heritage-item">
            <p className="type-eyebrow">{s.eyebrow}</p>
          </Reveal>
          <Reveal className="heritage-item" delay={80}>
            <h2 id="heritage-title" className="type-h2 mt-5 text-brown">
              {s.title[0]}
              <br />
              {s.title[1]}
            </h2>
          </Reveal>
          {/* The full story takes the intro's place, so the panel barely grows and still fits short screens. */}
          <Reveal className="heritage-item" delay={160}>
            <p className="type-lead mt-6" hidden={open}>
              {s.intro}
            </p>
            <div id={storyId} hidden={!open} className="type-lead mt-6 space-y-3 border-l border-ochre/70 pl-5">
              {s.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
          <Reveal className="heritage-item" delay={240}>
            <button
              type="button"
              className="link-arrow mt-6"
              aria-expanded={open}
              aria-controls={storyId}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? s.linkOpen : s.link}
              <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" className={open ? 'rotate-90' : ''} />
            </button>
          </Reveal>
        </div>

        <Reveal className="heritage-item pointer-events-none hidden min-w-0 flex-1 items-center gap-8 sm:flex lg:hidden xl:flex xl:max-w-[16rem]" delay={320}>
          <span className="h-[min(40vh,18rem)] w-px shrink-0 bg-brown/30" aria-hidden="true" />
          <img src={pack.phoenix.src} alt="" width="900" height="591" loading="lazy" decoding="async" className="w-full min-w-0 max-w-[13rem]" />
        </Reveal>
      </div>
    </section>
  )
}
