import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroScene from './HeroScene'
import HeritageScene from './HeritageScene'
import { sections } from '../config/brand'

gsap.registerPlugin(ScrollTrigger)

/**
 * Where the pinned sequence runs: desktops at least 560px tall, and phones
 * and tablets at least 720px tall (where the stacked heritage scene fits).
 */
const CINEMATIC = {
  wide: '(min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)',
  stacked: '(max-width: 1023px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)',
}
/** Shorter phones and tablets get lighter, unpinned scroll effects. */
const LIGHT = '(max-width: 1023px) and (max-height: 719px) and (prefers-reduced-motion: no-preference)'

/** Box of `el` relative to `ancestor`, ignoring CSS transforms. */
function boxWithin(el, ancestor) {
  let x = 0
  let y = 0
  for (let node = el; node && node !== ancestor; node = node.offsetParent) {
    x += node.offsetLeft
    y += node.offsetTop
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

/**
 * SCROLL EXPERIENCE
 * Hero and heritage scenes in one scroll-driven sequence. On wide
 * screens without reduced motion the wrapper becomes a 320vh track
 * with a sticky stage (see .is-cinematic in index.css), and GSAP
 * ScrollTrigger scrubs one timeline against native scrolling:
 *
 *   0.00-0.38  the product comes alive: bottle grows and tilts a
 *              little, the botanical bouquet swells and
 *              drifts behind it, the headline lifts away
 *   0.40-0.72  heritage transition: the cloth wipes across the left
 *              half, the bottle comes to rest on it, the story text
 *              rises in on the right
 *   0.72-1.00  hold, then the stage releases into the collection
 *
 * Phones and tablets run the same sequence with the scenes stacked
 * (see index.css): the cloth is a band across the top and the bottle
 * lands on it. Phones shorter than 720px get lighter, unpinned effects
 * instead: the hero copy, bottle and bouquet drift apart as the hero
 * scrolls away, and the heritage cloth wipes in as it arrives.
 *
 * Everything is reverted (inline styles removed, class dropped) when
 * a media query stops matching, e.g. resizing to mobile.
 */
export default function ScrollExperience({ onSelect }) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const mm = gsap.matchMedia()

    mm.add(CINEMATIC, (ctx) => {
      const { wide, stacked } = ctx.conditions
      if (!wide && !stacked) return
      root.classList.add('is-cinematic')
      const stage = root.querySelector('.scroll-stage')
      const heritage = root.querySelector('.scene-heritage')
      const bottle = root.querySelector('.hb-move')
      const cloth = root.querySelector('.heritage-textile')
      const q = gsap.utils.selector(root)

      // Resting place for the bottle: centred on the cloth. On desktop the cloth is
      // the full-height left half; on phones it is a band across the top.
      const target = () => {
        const b = boxWithin(bottle, stage)
        const c = boxWithin(cloth, stage)
        const fill = stacked ? 0.84 : 0.62
        return {
          x: c.x + c.w / 2 - (b.x + b.w / 2),
          y: c.y + c.h * 0.53 - (b.y + b.h / 2),
          scale: (c.h * fill) / b.h,
        }
      }

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress > 0.5) heritage.classList.add('is-revealed')
          },
        },
      })

      // Stage 2: the product comes alive
      tl.to(q('.scroll-cue-dot'), { y: 9, duration: 0.4 }, 0)
        .to(q('.hero-copy, .hero-index'), { y: -90, autoAlpha: 0, ease: 'power1.in', duration: 0.3 }, 0.05)
        // The bottle grows from its base so it stays standing on its shadow.
        .to(q('.hb-tilt'), { scale: 1.06, rotationY: -8, transformPerspective: 1400, transformOrigin: '50% 90%', ease: 'sine.inOut', duration: 0.38 }, 0)
        .fromTo(q('.layer-back'), { scale: 0.96 }, { yPercent: -8, scale: 1.08, duration: 0.45 }, 0)

        // Stage 3: heritage transition
        .to(q('.hero-backdrop, .layer-back, .scroll-cue'), { autoAlpha: 0, duration: 0.16 }, 0.42)
        .fromTo(
          q('.heritage-textile'),
          { clipPath: 'inset(0% 100% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', duration: 0.28 },
          0.4,
        )
        .to(q('.hb-tilt'), { scale: 1, rotationY: 0, ease: 'sine.inOut', duration: 0.3 }, 0.4)
        // The floor reflection belongs to the hero; the bottle lands on cloth without it.
        .to(q('.hb-reflection'), { autoAlpha: 0, duration: 0.12 }, 0.4)
        .to(bottle, { x: () => target().x, y: () => target().y, scale: () => target().scale, ease: 'power2.inOut', duration: 0.32 }, 0.4)
        .fromTo(
          q('.heritage-item'),
          { y: 48, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.035, ease: 'power2.out', duration: 0.16 },
          // Stacked, the bottle rises through the text area, so the text waits for it to land.
          stacked ? 0.68 : 0.56,
        )

        // Hold the finished composition before releasing
        .addLabel('settled')
        .to({}, { duration: 0.22 })

      // "Our Story" links land on the finished heritage frame, not the top of the stage.
      const onClick = (e) => {
        const link = e.target.closest?.(`a[href="#${sections.story}"]`)
        if (!link) return
        e.preventDefault()
        const st = tl.scrollTrigger
        const settled = (tl.labels.settled + 0.06) / tl.duration()
        window.scrollTo({ top: st.start + (st.end - st.start) * settled, behavior: 'smooth' })
      }
      document.addEventListener('click', onClick)

      return () => {
        document.removeEventListener('click', onClick)
        root.classList.remove('is-cinematic')
      }
    })

    // Phones and tablets: lighter scrubbed effects on normal scrolling, no pinning.
    mm.add(LIGHT, () => {
      const q = gsap.utils.selector(root)
      const hero = root.querySelector('.scene-hero')
      const heritage = root.querySelector('.scene-heritage')

      // Hero scrolls away: copy lifts and fades, bottle grows, bouquet swells at its own pace
      gsap
        .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } })
        .to(q('.hero-copy'), { y: -60, autoAlpha: 0.15 }, 0)
        .to(q('.hb-tilt'), { scale: 1.12, yPercent: -6, transformOrigin: '50% 90%' }, 0)
        .fromTo(q('.layer-back'), { scale: 1 }, { scale: 1.18, yPercent: -14, rotation: -4 }, 0)

      // Our Story arrives: the batik cloth wipes in from the left and settles from a slow zoom
      gsap
        .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: heritage, start: 'top 90%', end: 'top 30%', scrub: 0.6 } })
        .fromTo(q('.heritage-textile'), { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out' }, 0)
        .fromTo(q('.heritage-textile img'), { scale: 1.25 }, { scale: 1 }, 0)
    })

    return () => mm.revert()
  }, [])

  return (
    <div ref={rootRef} className="scroll-exp">
      {/* Navbar watches this sentinel to switch to its solid state. */}
      <div id="page-top" className="absolute inset-x-0 top-0 h-24" aria-hidden="true" />
      {/* Section markers for the navigation's active state while the stage is pinned. */}
      <span className="nav-marker" data-nav="home" style={{ top: 0, height: '45%' }} aria-hidden="true" />
      <span className="nav-marker" data-nav="our-story" style={{ top: '45%', height: '55%' }} aria-hidden="true" />

      <div className="scroll-stage">
        <HeroScene onSelect={onSelect} />
        <HeritageScene />
      </div>
    </div>
  )
}
