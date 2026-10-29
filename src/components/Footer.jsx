import { brand, privacyPath, sections } from '../config/brand'
import { copy } from '../config/content'
import InstagramIcon from './InstagramIcon'
import JethaSymbol from './JethaSymbol'

const linksFor = (page) => {
  const p = page === 'home' ? '' : '/'
  return [
    { href: page === 'home' ? '#page-top' : '/', label: 'Home' },
    { href: `${p}#${sections.forHim}`, label: 'For Him' },
    { href: `${p}#${sections.forHer}`, label: 'For Her' },
    { href: `${p}#${sections.contact}`, label: 'Contact' },
  ]
}

/**
 * Cream footer on a single line: wordmark, statement, links, the
 * Instagram icon and copyright. The icon appears only once the
 * Instagram URL is configured in src/config/brand.js.
 */
export default function Footer({ page = 'home' }) {
  const { instagram } = brand.contact
  const links = linksFor(page)

  return (
    <footer className="border-t border-brown/15 bg-cream text-brown">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-12 md:px-8 lg:flex-row lg:items-center lg:gap-12 lg:px-12">
        {/* Emblem stacked over the wordmark, so the brand block keeps its width and the links stay on one row. */}
        <a href={page === 'home' ? '#page-top' : '/'} className="inline-flex shrink-0 flex-col items-start gap-2.5" aria-label={`${brand.name}, home`}>
          <JethaSymbol finish="black" className="h-10" />
          <span className="flex flex-col leading-none">
            <span className="brand-gloss-text font-display text-[1.9rem] tracking-[0.3em]">{brand.wordmark}</span>
            <span className="mt-1.5 pl-1 text-[0.55rem] font-medium tracking-[0.62em]">FRAGRANCE</span>
          </span>
        </a>
        <p className="max-w-[17rem] text-[0.85rem] leading-relaxed text-brown-soft">{copy.footer.statement}</p>

        <nav aria-label="Footer" className="lg:ml-auto">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="link-underline inline-flex min-h-11 items-center text-[0.68rem] font-medium uppercase tracking-[0.22em]">
                  {l.label}
                </a>
              </li>
            ))}
            {instagram && (
              <li>
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${brand.name} on Instagram${brand.instagramHandle ? ` (${brand.instagramHandle})` : ''}`}
                  className="inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-brown/5 hover:text-rust-deep"
                >
                  <InstagramIcon size={20} aria-hidden="true" />
                </a>
              </li>
            )}
          </ul>
        </nav>

        <p className="text-[0.75rem] text-brown-soft lg:ml-4">
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
          <a href={privacyPath} className="link-underline mt-1 block w-fit">
            Privacy Policy
          </a>
        </p>
      </div>
    </footer>
  )
}
