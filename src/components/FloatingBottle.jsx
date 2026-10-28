import { useEffect, useRef } from 'react'
import ProductVisual from './ProductVisual'

/** One observer for every floating bottle: floating only runs while a bottle is on screen. */
let observer = null
export function observeFloating(el) {
  if (!('IntersectionObserver' in window)) {
    el.classList.add('is-onscreen')
    return () => {}
  }
  observer ??= new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-onscreen', e.isIntersecting)),
    { rootMargin: '80px 0px' },
  )
  observer.observe(el)
  return () => observer.unobserve(el)
}

const FINE_POINTER = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
const loadStage = () => import('../lib/bottleStage')

/**
 * FLOATING BOTTLE
 * The Blender render of a bottle, floating a few pixels on a slow cycle
 * above a shadow that breathes with it (CSS only, paused off screen).
 *
 * With a mouse or trackpad the bottle also leans towards the pointer, and
 * the real GLB of that bottle takes over from the image on the one shared
 * WebGL canvas (src/lib/bottleStage.js), turning with the pointer so the
 * glass and label catch the light. On touch, under reduced motion or
 * without WebGL, the render image is all there is and no 3D is downloaded.
 *
 *   mode 'hover'   product cards: 3D while the card is hovered; the card
 *                  (closest <article>) is the pointer area.
 *   mode 'viewer'  detail view: 3D as soon as it is `active`; the closest
 *                  [data-bottle-area] is the pointer area, and the bottle
 *                  eases back to rest when the pointer leaves it.
 *
 * Fills its parent box; the bottle stands on the box's baseline.
 */
export default function FloatingBottle({ perfume, index = 0, mode = 'hover', active = true, sizes, decorative = true }) {
  const boxRef = useRef(null)
  const glRef = useRef(null)

  useEffect(() => observeFloating(boxRef.current), [])

  useEffect(() => {
    const box = boxRef.current
    const area = mode === 'viewer' ? box?.closest('[data-bottle-area]') : box?.closest('article')
    if (!area || !active || !perfume.render || !window.matchMedia(FINE_POINTER).matches) return

    let stage = null
    let alive = true
    let inside = false
    let showing = false
    let pending = 0
    let last = null

    const on3d = () => alive && box.classList.add('is-3d')
    const lost = () => {
      showing = false
      box.classList.remove('is-3d')
    }
    const want3d = async () => {
      if (showing) return
      showing = true
      try {
        stage ??= await loadStage()
      } catch {
        showing = false
        return
      }
      if (!alive || (mode === 'hover' && !inside) || !stage.supported()) {
        showing = false
        return
      }
      if (!(await stage.show(glRef.current, perfume.id, on3d, lost))) showing = false
      stage.point(...pointerAxes(area, last))
    }
    const resetTilt = () => {
      box.style.removeProperty('--tilt-x')
      box.style.removeProperty('--tilt-y')
    }

    const apply = () => {
      pending = 0
      if (!last) return
      const [x, y] = pointerAxes(area, last)
      box.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`)
      box.style.setProperty('--tilt-y', `${(x * 8).toFixed(2)}deg`)
      stage?.point(x, y)
    }
    const onMove = (e) => {
      inside = true
      last = e
      if (!pending) pending = requestAnimationFrame(apply)
      // Back after another viewer borrowed the canvas (e.g. the detail view closing over this card)
      if (mode === 'hover') want3d()
    }
    const onLeave = () => {
      inside = false
      last = null
      cancelAnimationFrame(pending)
      pending = 0
      resetTilt()
      if (mode === 'viewer') {
        stage?.point(0, 0)
        return
      }
      showing = false
      box.classList.remove('is-3d')
      stage?.hide(glRef.current)
    }

    area.addEventListener('pointerenter', onMove)
    area.addEventListener('pointermove', onMove)
    area.addEventListener('pointerleave', onLeave)
    if (mode === 'viewer') want3d()
    return () => {
      alive = false
      area.removeEventListener('pointerenter', onMove)
      area.removeEventListener('pointermove', onMove)
      area.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(pending)
      resetTilt()
      box.classList.remove('is-3d')
      stage?.hide(glRef.current)
    }
  }, [perfume.id, perfume.render, mode, active])

  return (
    <div ref={boxRef} className="floating-bottle absolute inset-0" style={{ '--float-delay': `${-index * 0.45}s` }}>
      <span className="fb-shadow absolute bottom-[4%] left-1/2 h-[5%] w-[44%] -translate-x-1/2 rounded-[50%] bg-brown-deep/40 blur-[8px]" aria-hidden="true" />
      <div className="fb-float absolute inset-0">
        <div className="fb-lift absolute inset-0">
          {/* The render's own 4:5 frame on the box's baseline: the 3D canvas covers exactly the same box */}
          <div className="absolute bottom-0 left-1/2 aspect-[4/5] h-[92%] -translate-x-1/2">
            <div className="fb-tilt absolute inset-0">
              <ProductVisual
                perfume={perfume}
                decorative={decorative}
                loading={mode === 'viewer' ? 'eager' : 'lazy'}
                sizes={sizes ?? '(min-width: 1024px) 18vw, (min-width: 360px) 37vw, 74vw'}
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div ref={glRef} className="fb-gl absolute inset-0" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Pointer position over `area`, each axis clamped to -1..1. */
function pointerAxes(area, e) {
  if (!e) return [0, 0]
  const r = area.getBoundingClientRect()
  const axis = (v) => Math.max(-1, Math.min(1, v * 2 - 1))
  return [axis((e.clientX - r.left) / r.width), axis((e.clientY - r.top) / r.height)]
}
