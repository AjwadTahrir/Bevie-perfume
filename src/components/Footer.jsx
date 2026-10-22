import { brand, sections } from '../config/brand'
import { copy } from '../config/content'

const links = [
  { href: '#page-top', label: 'Home' },
  { href: `#${sections.story}`, label: 'Our Story' },
  { href: `#${sections.collection}`, label: 'Collection' },
  { href: `#${sections.contact}`, label: 'Contact' },
]

/**
 * Cream footer on a single line: wordmark, statement, links and
 * copyright. Social and email links appear only once they are
 * configured in src/config/brand.js; nothing is invented.
 */
export default function Footer() {
  const { instagram, email } = brand.contact
  const channels = [
    instagram && { href: instagram, label: brand.instagramHandle || 'Instagram', external: true },
    email && { href: `mailto:${email}`, label: email },
  ].filter(Boolean)

  return (
    <footer className="border-t border-brown/15 bg-cream text-brown">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-12 md:px-8 lg:flex-row lg:items-center lg:gap-12 lg:px-12">
        <a href="#page-top" className="inline-flex shrink-0 flex-col leading-none" aria-label={`${brand.name}, back to top`}>
          <span className="font-display text-[1.9rem] tracking-[0.3em]">{brand.wordmark}</span>
          <span className="mt-1.5 pl-1 text-[0.55rem] font-medium tracking-[0.62em]">PERFUME</span>
        </a>
        <p className="max-w-[17rem] text-[0.85rem] leading-relaxed text-brown-soft">{copy.footer.statement}</p>

        <nav aria-label="Footer" className="lg:ml-auto">
          <ul className="flex flex-wrap gap-x-8 gap-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="link-underline inline-flex min-h-11 items-center text-[0.68rem] font-medium uppercase tracking-[0.22em]">
                  {l.label}
                </a>
              </li>
            ))}
            {channels.map((c) => (
              <li key={c.href}>
                <a
                  href={c.href}
                  target={c.external ? '_blank' : undefined}
                  rel={c.external ? 'noopener noreferrer' : undefined}
                  className="link-underline inline-flex min-h-11 items-center text-[0.68rem] font-medium uppercase tracking-[0.22em]"
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-[0.75rem] text-brown-soft lg:ml-4">
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
