import { useEffect } from 'react'
import { ArrowDown } from 'lucide-react'
import { brand, preorder, sections } from '../config/brand'

/**
 * SCHEDULE: the pre-order timeline at /schedule. The two windows are
 * stacked as cards with an arrow running down between them; all dates
 * and wording live in src/config/brand.js (preorder).
 */
export default function SchedulePage() {
  useEffect(() => {
    const previous = document.title
    document.title = `Pre-order Schedule · ${brand.name}`
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <section aria-labelledby="schedule-title" className="relative bg-cream pt-[calc(var(--nav-h)+3.5rem)] pb-20 md:pt-[calc(var(--nav-h)+5rem)] md:pb-28">
      <div id="page-top" className="absolute inset-x-0 top-0 h-24" aria-hidden="true" />
      <div className="mx-auto max-w-2xl px-5 md:px-8">
        <p className="type-label text-rust-deep">Pre-order</p>
        <h1 id="schedule-title" className="mt-3 font-display text-[clamp(2.2rem,1.6rem+2.6vw,3.6rem)] leading-[1.05] text-brown">
          How your order reaches you
        </h1>
        <p className="mt-4 text-[1.02rem] leading-relaxed text-brown-soft">
          JETHA runs as a pre-order: we take orders first, then hand every bottle over together.
        </p>

        <ol className="mt-12 flex flex-col items-center">
          {preorder.steps.map((s, i) => (
            <li key={s.title} className="flex w-full flex-col items-center">
              {i > 0 && (
                <span className="flex flex-col items-center py-3" aria-hidden="true">
                  <span className="h-10 w-px bg-gradient-to-b from-brown/0 to-brown/40" />
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-rust text-cream shadow-[0_6px_18px_-8px_rgb(0_0_0/0.45)]">
                    <ArrowDown size={22} strokeWidth={1.75} className="schedule-arrow" />
                  </span>
                  <span className="h-10 w-px bg-gradient-to-b from-brown/40 to-brown/0" />
                </span>
              )}
              <div className="w-full rounded-2xl border border-ochre/50 bg-cream-light px-6 py-7 text-center md:px-10 md:py-9">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-brown-soft">Step {i + 1}</p>
                <h2 className="mt-2 font-display text-[1.9rem] leading-tight text-brown md:text-[2.3rem]">{s.title}</h2>
                <p className="mt-3 inline-block rounded-full bg-ochre/30 px-4 py-1.5 text-sm font-medium tracking-[0.06em] text-brown">{s.dates}</p>
                <p className="mx-auto mt-5 max-w-md text-[0.98rem] leading-relaxed text-brown-soft">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <a href={`/#${sections.collection}`} className="btn btn-primary">
            Browse the Collection
          </a>
        </div>
      </div>
    </section>
  )
}
