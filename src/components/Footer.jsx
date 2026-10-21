import { OrnamentBorder } from '../assets/batik/Ornaments'
import { brand, sections } from '../config/brand'

const links = [
  { href: `#${sections.collection}`, label: 'Collection' },
  { href: `#${sections.story}`, label: 'Our Story' },
  { href: `#${sections.finder}`, label: 'Find Your Scent' },
  { href: `#${sections.contact}`, label: 'Contact' },
]

/** Forest-green footer: the page's single deliberate colour switch. */
export default function Footer() {
  return (
    <footer className="on-dark bg-forest text-ivory">
      <OrnamentBorder className="block text-gold" />
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 pb-10 pt-16 md:px-8 md:pt-20 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-6">
          <a href="#page-top" className="font-display text-5xl font-semibold tracking-[0.3em] text-ivory md:text-6xl">
            {brand.wordmark}
          </a>
          <p className="mt-5 max-w-sm text-sage">Contemporary perfumery inspired by Malaysian batik.</p>
        </div>

        <nav aria-label="Footer" className="lg:col-span-4 lg:col-start-9">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="link-underline inline-flex min-h-11 items-center text-ivory/90 hover:text-ivory">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-3 border-t border-ivory/15 pt-6 text-sm text-sage md:flex-row md:justify-between lg:col-span-12">
          <p>
            © {new Date().getFullYear()} {brand.name}
          </p>
          <p>Illustrations are original artwork inspired by batik florals.</p>
        </div>
      </div>
    </footer>
  )
}
