import { useEffect, useRef } from 'react'
import { observeFloating } from './FloatingBottle'
import { heroProduct } from '../data/perfumes'

/**
 * HERO BOTTLE
 * Studio render of the actual Senja bottle (transparent WebP, 4:5) on a
 * soft contact shadow, floating in the same rhythm as the product cards
 * (.floating-bottle / .fb-float / .fb-shadow, paused off screen). It does
 * not follow the pointer.
 *
 * ScrollExperience moves .hb-move (to the batik cloth) and scales and
 * turns .hb-tilt; on phones it also dips the first child on touchdown and
 * fades the outer shadow as the bottle lifts away. The float lives on the
 * layer inside .hb-tilt and the breathing on the shadow's inner layer, so
 * the scroll timeline and the float never fight over the same transform.
 */
export default function HeroBottle() {
  const moveRef = useRef(null)
  useEffect(() => observeFloating(moveRef.current), [])

  return (
    <div
      ref={moveRef}
      className="hb-move floating-bottle pointer-events-none absolute inset-x-0 bottom-[6%] flex h-[78%] justify-center lg:bottom-auto lg:top-[calc(52%-min(30%,20vw))] lg:h-[min(60%,40vw)]"
    >
      <div className="relative h-full">
        <span className="hb-shadow absolute bottom-[4.5%] left-1/2 h-[4.5%] w-[46%] -translate-x-1/2" aria-hidden="true">
          <span className="fb-shadow absolute inset-0 rounded-[50%] bg-brown-deep/40 blur-[10px]" />
        </span>
        <div className="hb-tilt relative h-full">
          <div className="fb-float relative h-full">
            <img
              src={heroProduct.src}
              srcSet={heroProduct.srcSet}
              sizes="(min-width: 1024px) 32vw, 70vw"
              alt={heroProduct.alt}
              width="960"
              height="1200"
              fetchPriority="high"
              decoding="async"
              className="hero-bottle-enter relative h-full w-auto max-w-none select-none"
              draggable="false"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
