import { useEffect } from 'react'
import { ArrowRight, CalendarDays, Globe2, GraduationCap, HandHeart, MapPin, School, Users } from 'lucide-react'
import { pack } from '../assets/pack'
import Reveal from './Reveal'
import { brand, sections } from '../config/brand'
import { copy } from '../config/content'

const FACT_ICONS = [School, Globe2, CalendarDays, MapPin]
const OBJECTIVE_ICONS = [Users, GraduationCap, HandHeart]

/**
 * ABOUT: the fundraising programme behind JETHA.
 * Hero with the programme and its facts, the "every purchase" band on
 * the dark batik cloth (same treatment as the store's closing call to
 * action), three objectives, and links back to the two collections.
 * All wording lives in copy.about (src/config/content.js).
 */
export default function AboutPage() {
  const a = copy.about

  useEffect(() => {
    const previous = document.title
    document.title = brand.name
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="about-title" className="relative isolate overflow-hidden bg-cream pt-[calc(var(--nav-h)+3.5rem)] pb-20 md:pt-[calc(var(--nav-h)+5rem)] md:pb-28">
        <div id="page-top" className="absolute inset-x-0 top-0 h-24" aria-hidden="true" />
        <img
          src={pack.bouquet.src}
          srcSet={pack.bouquet.srcSet}
          sizes="(min-width: 1024px) 40vw, 80vw"
          alt=""
          decoding="async"
          className="pointer-events-none absolute -right-[12%] top-[calc(var(--nav-h)+1rem)] -z-10 w-[min(42rem,70vw)] opacity-25 md:-right-[6%] md:opacity-40"
        />
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-12">
          <Reveal className="max-w-3xl">
            <p className="type-eyebrow">{a.eyebrow}</p>
            <h1 id="about-title" className="mt-6 font-display text-[clamp(2.4rem,1.6rem+3.4vw,4.4rem)] leading-[1.05] text-balance text-brown">
              {a.title}
            </h1>
            <p className="mt-5 font-display text-[clamp(1.15rem,1rem+0.6vw,1.5rem)] italic text-rust-deep">{a.tagline}</p>
          </Reveal>

          <Reveal as="dl" delay={120} className="mt-12 grid max-w-5xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ochre/50 bg-ochre/40 sm:grid-cols-2 lg:grid-cols-4">
            {a.facts.map(([label, value], i) => {
              const Icon = FACT_ICONS[i]
              return (
                <div key={label} className="bg-cream-light/90 p-5 md:p-6">
                  <dt className="flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-brown-soft">
                    <Icon size={14} strokeWidth={1.5} className="text-rust-deep" aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="mt-2 text-[0.95rem] leading-snug text-brown">{value}</dd>
                </div>
              )
            })}
          </Reveal>

          <div className="mt-14 grid max-w-5xl gap-6 md:mt-16 md:grid-cols-[1.1fr_1fr] md:gap-12">
            <Reveal as="p" className="font-display text-[clamp(1.25rem,1.05rem+0.7vw,1.65rem)] leading-relaxed text-brown">
              {a.intro[0]}
            </Reveal>
            <Reveal delay={100} className="space-y-4 text-[1.02rem] leading-relaxed text-brown-soft md:pt-1.5">
              {a.intro.slice(1).map((t) => (
                <p key={t}>{t}</p>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Every purchase makes a difference */}
      <section aria-labelledby="support-title" className="on-dark relative isolate overflow-hidden bg-brown text-cream">
        <img src={pack.band.src} srcSet={pack.band.srcSet} sizes="100vw" alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center md:px-8 md:py-32">
          <p className="type-eyebrow">{a.support.eyebrow}</p>
          <h2 id="support-title" className="type-h2 mt-5 text-balance text-cream">
            {a.support.title}
          </h2>
          <div className="mt-7 space-y-4 text-[1.02rem] leading-relaxed text-cream/85">
            {a.support.body.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>
          <a href={`/#${sections.collection}`} className="btn btn-ghost-light mt-10">
            {a.support.cta}
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </Reveal>
      </section>

      {/* Objectives */}
      <section aria-labelledby="objectives-title" className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-12">
          <Reveal className="text-center">
            <h2 id="objectives-title" className="type-h2 text-brown">
              {a.objectivesTitle}
            </h2>
          </Reveal>
          <ul className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3 md:gap-6">
            {a.objectives.map(([title, body], i) => {
              const Icon = OBJECTIVE_ICONS[i]
              return (
                <Reveal as="li" key={title} delay={i * 100} className="group rounded-2xl border border-ochre/50 bg-cream-light/80 p-7 transition-[transform,box-shadow] duration-500 ease-[var(--ease-batik)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgb(79_50_45/0.45)] md:p-8">
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-cream-deep/70 text-rust-deep transition-colors duration-500 group-hover:bg-ochre/40">
                    <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 font-display text-2xl text-brown">{title}</h3>
                  <p className="mt-3 text-[0.98rem] leading-relaxed text-brown-soft">{body}</p>
                </Reveal>
              )
            })}
          </ul>

          <Reveal className="mx-auto mt-20 flex max-w-xl flex-col items-center text-center md:mt-24">
            <p className="font-display text-[clamp(1.5rem,1.2rem+1vw,2.1rem)] italic text-brown">{a.thanks}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={`/#${sections.forHim}`} className="btn btn-primary">
                Shop For Him
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </a>
              <a href={`/#${sections.forHer}`} className="btn btn-outline">
                Shop For Her
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
