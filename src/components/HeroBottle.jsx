import { useEffect, useRef } from 'react'
import { heroProduct } from '../data/perfumes'

/**
 * HERO BOTTLE
 * The real Senja product photograph (transparent WebP), with
 * a soft contact shadow on the floor. It is a
 * flat photograph, so the scroll sequence only scales, moves and
 * slightly tilts it; it never fakes a rotation that would reveal
 * unseen sides. On desktop it also leans gently towards the pointer.
 *
 * TO USE A REAL 3D MODEL LATER: replace the <img> below with a lazily
 * loaded canvas (e.g. React Three Fiber + a GLB) inside the same
 * .hb-tilt wrapper. ScrollExperience animates .hb-move and .hb-tilt,
 * so the rest of the site does not need to change. Keep this
 * photograph as the fallback for mobile and missing WebGL.
 */
export default function HeroBottle() {
  const hoverRef = useRef(null)

  // Pointer tilt: mouse/trackpad only, never under reduced motion, and it
  // fades out as the visitor scrolls away from the hero.
  useEffect(() => {
    const el = hoverRef.current
    const fine = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)')
    if (!el || !fine.matches) return
    let target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let frame = 0
    const step = () => {
      current.x += (target.x - current.x) * 0.08
      current.y += (target.y - current.y) * 0.08
      el.style.transform = `perspective(1400px) rotateY(${(current.x * 9).toFixed(2)}deg) rotateX(${(current.y * -5).toFixed(2)}deg)`
      const settled = Math.abs(target.x - current.x) < 0.001 && Math.abs(target.y - current.y) < 0.001
      frame = settled ? 0 : requestAnimationFrame(step)
    }
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(step)
    }
    const onMove = (e) => {
      const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.6))
      target = { x: (e.clientX / window.innerWidth - 0.5) * fade, y: (e.clientY / window.innerHeight - 0.5) * fade }
      kick()
    }
    const onLeave = () => {
      target = { x: 0, y: 0 }
      kick()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      el.style.transform = ''
    }
  }, [])

  return (
    <div className="hb-move pointer-events-none absolute inset-x-0 bottom-[10%] flex h-[56%] justify-center lg:bottom-auto lg:top-[calc(55%-min(21%,14vw))] lg:h-[min(42%,28vw)]">
      <div className="relative h-full">
        <span
          className="absolute bottom-[5%] left-1/2 h-[6%] w-[58%] -translate-x-1/2 rounded-[50%] bg-brown-deep/50 blur-[10px]"
          aria-hidden="true"
        />
        <div className="hb-tilt relative h-full">
          <div ref={hoverRef} className="relative h-full will-change-transform">
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
    </div>
  )
}
