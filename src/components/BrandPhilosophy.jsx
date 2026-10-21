import PhilosophyMotif from '../assets/batik/PhilosophyMotifs'
import Reveal from './Reveal'
import { sections } from '../config/brand'
import { copy } from '../config/content'

// Each row places the word, text and study differently; mobile stacks them.
const LAYOUTS = [
  {
    art: 'lg:col-start-1 lg:col-span-3 lg:row-start-1 lg:row-span-2',
    word: 'lg:col-start-4 lg:col-span-9 lg:row-start-1',
    text: 'lg:col-start-4 lg:col-span-5 lg:row-start-2',
  },
  {
    art: 'lg:col-start-10 lg:col-span-3 lg:row-start-1 lg:row-span-2',
    word: 'lg:col-start-1 lg:col-span-9 lg:row-start-1 lg:text-right',
    text: 'lg:col-start-5 lg:col-span-5 lg:row-start-2 lg:text-right',
  },
  {
    art: 'lg:col-start-8 lg:col-span-3 lg:row-start-1 lg:row-span-2',
    word: 'lg:col-start-1 lg:col-span-7 lg:row-start-1',
    text: 'lg:col-start-1 lg:col-span-5 lg:row-start-2 lg:pl-2',
  },
]

/**
 * BRAND PHILOSOPHY
 * Three proposed positioning themes, set as oversized words with a
 * family of botanical studies. Not claims about process or
 * ingredients.
 */
export default function BrandPhilosophy() {
  const ph = copy.philosophy
  return (
    <section id={sections.philosophy} aria-labelledby="philosophy-title" className="bg-sage-soft py-24 md:py-32 lg:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
        <Reveal>
          <h2 id="philosophy-title" className="type-eyebrow">
            {ph.eyebrow}
          </h2>
        </Reveal>

        <div className="mt-10 md:mt-14">
          {ph.themes.map((theme, i) => {
            const L = LAYOUTS[i]
            return (
              <Reveal
                as="article"
                key={theme.key}
                className="grid grid-cols-1 items-center border-t border-forest/25 py-10 md:grid-cols-[minmax(0,1fr)_10rem] md:gap-x-8 md:py-14 lg:grid-cols-12 lg:items-end"
              >
                <h3 className={`md:col-start-1 font-display text-[clamp(3.2rem,1.4rem+8vw,8.75rem)] font-medium leading-[1.02] tracking-[-0.02em] text-forest ${L.word}`}>
                  {theme.title}
                </h3>
                <p className={`md:col-start-1 mt-4 max-w-md text-[1.05rem] leading-relaxed text-espresso lg:mt-2 ${L.text} ${i === 1 ? 'lg:ml-auto' : ''}`}>
                  {theme.text}
                </p>
                <PhilosophyMotif
                  name={theme.key}
                  className={`order-first mb-4 w-24 md:order-none md:col-start-2 md:row-span-2 md:row-start-1 md:mb-0 md:w-full md:max-w-[13rem] md:justify-self-center lg:max-w-[15rem] ${L.art}`}
                />
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
