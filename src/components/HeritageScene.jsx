import { useId, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { pack } from '../assets/pack'
import Reveal from './Reveal'
import { sections } from '../config/brand'
import { copy } from '../config/content'

/**
 * HERITAGE SCENE
 * Editorial split: draped batik cloth on the left, lifted by warm light
 * and fading into cream at its inner edge; on the right one left-aligned
 * group (eyebrow, heading, story, link). On wide screens a faint vertical
 * rule runs down the right of that group with the painted batik bouquet
 * beside it; narrower layouts keep the bouquet next to the link. In the
 * cinematic sequence the cloth wipes in from the left and the hero
 * bottle comes to rest on it. On phones the cloth is a square photo (16:9
 * on tablets) above the story and the bottle lands on it the same way, on
 * normal scrolling. "Discover our story" swaps the intro
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
      <div className="heritage-textile relative aspect-square overflow-hidden sm:aspect-video lg:aspect-auto lg:h-auto">
        <img
          src={pack.fabric.src}
          srcSet={pack.fabric.srcSet}
          sizes="(min-width: 1024px) 50vw, 100vw"
          alt="Draped batik cloth in burnt orange, dark brown and dusty teal"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[62%_50%]"
        />
        {/* Lift the cloth: warm daylight from the upper left and a soft cream fade into the text side */}
        <div className="heritage-light pointer-events-none absolute inset-0" aria-hidden="true" />
      </div>

      <div className="heritage-panel relative flex items-center overflow-hidden bg-cream px-5 lg:-ml-[2px] py-14 md:px-12 md:py-16 lg:pb-6 lg:pl-14 lg:pt-[var(--nav-h)] xl:pl-20">
        <div className="relative z-10 flex w-full min-w-0 items-stretch">
        <div className="heritage-copy w-full min-w-0 max-w-[33rem]">
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
            <p className="type-lead mt-6 max-w-[30rem]" hidden={open}>
              {s.intro}
            </p>
            <div id={storyId} hidden={!open} className="type-lead mt-6 max-w-[30rem] space-y-3 border-l border-ochre/70 pl-5">
              {s.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
          {/* Link and bouquet share one row: the link on the left, the bouquet hanging to its right */}
          <div className="heritage-cta-row">
          <Reveal className="heritage-item shrink-0" delay={240}>
            <button
              type="button"
              className="link-arrow mt-6 whitespace-nowrap"
              aria-expanded={open}
              aria-controls={storyId}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? s.linkOpen : s.link}
              <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" className={open ? 'rotate-90' : ''} />
            </button>
          </Reveal>

          {/* Below 1360px the bouquet closes the composition at its lower right. */}
          <Reveal className="heritage-item heritage-art pointer-events-none relative ml-auto" delay={320}>
            <img
              src={pack.bouquet.src}
              srcSet={pack.bouquet.srcSet}
              sizes="(min-width: 640px) 27rem, 20rem"
              alt=""
              width="1200"
              height="800"
              loading="lazy"
              decoding="async"
              className="relative w-full"
            />
          </Reveal>
          </div>
        </div>

        {/* 1360px and up: a faint rule beside the story, the bouquet just past it */}
        <Reveal className="heritage-item heritage-side pointer-events-none" delay={320} aria-hidden="true">
          <span className="heritage-rule" />
          <img src={pack.bouquet.src} srcSet={pack.bouquet.srcSet} sizes="20rem" alt="" width="1200" height="800" loading="lazy" decoding="async" className="heritage-side-art" />
        </Reveal>
        </div>
      </div>
    </section>
  )
}
