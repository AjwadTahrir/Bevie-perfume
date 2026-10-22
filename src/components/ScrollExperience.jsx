import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroScene from './HeroScene'
import HeritageScene from './HeritageScene'
import { sections } from '../config/brand'

gsap.registerPlugin(ScrollTrigger)

/** Where the cinematic sequence runs. Elsewhere the scenes simply stack. */
const CINEMATIC = '(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)'

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
 * Everything is reverted (inline styles removed, class dropped) when
 * the media query stops matching, e.g. resizing to mobile.
 */
export default function ScrollExperience() {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const mm = gsap.matchMedia()

    mm.add(CINEMATIC, () => {
      root.classList.add('is-cinematic')
      const stage = root.querySelector('.scroll-stage')
      const heritage = root.querySelector('.scene-heritage')
      const bottle = root.querySelector('.hb-move')
      const q = gsap.utils.selector(root)

      // Resting place for the bottle: centred on the cloth, left half.
      const target = () => {
        const b = boxWithin(bottle, stage)
        const sw = stage.offsetWidth
        const sh = stage.offsetHeight
        return {
          x: sw * 0.25 - (b.x + b.w / 2),
          y: sh * 0.53 - (b.y + b.h / 2),
          scale: (sh * 0.62) / b.h,
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
        .to(q('.hero-copy'), { y: -90, autoAlpha: 0, ease: 'power1.in', duration: 0.3 }, 0.05)
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
        .to(bottle, { x: () => target().x, y: () => target().y, scale: () => target().scale, ease: 'power2.inOut', duration: 0.32 }, 0.4)
        .fromTo(
          q('.heritage-item'),
          { y: 48, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.035, ease: 'power2.out', duration: 0.16 },
          0.56,
        )

        // Hold the finished composition before releasing
        .to({}, { duration: 0.22 })

      // "Our Story" links land on the finished heritage frame, not the top of the stage.
      const onClick = (e) => {
        const link = e.target.closest?.(`a[href="#${sections.story}"]`)
        if (!link) return
        e.preventDefault()
        const st = tl.scrollTrigger
        window.scrollTo({ top: st.start + (st.end - st.start) * 0.8, behavior: 'smooth' })
      }
      document.addEventListener('click', onClick)

      return () => {
        document.removeEventListener('click', onClick)
        root.classList.remove('is-cinematic')
      }
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
        <HeroScene />
        <HeritageScene />
      </div>
    </div>
  )
}
