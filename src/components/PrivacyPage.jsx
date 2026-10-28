import { useEffect, useState } from 'react'
import { brand } from '../config/brand'
import { privacy } from '../config/privacy'

const LANGS = ['en', 'ms']

// +60 19-979 4283 from '60199794283'
const prettyPhone = (n) => `+${n.slice(0, 2)} ${n.slice(2, 4)}-${n.slice(4, 7)} ${n.slice(7)}`

/**
 * PRIVACY: the PDPA notice at /privacy, in English or Bahasa Malaysia.
 * Plain reading page on cream; all wording lives in src/config/privacy.js.
 */
export default function PrivacyPage() {
  const [lang, setLang] = useState(() => (location.hash === '#ms' ? 'ms' : 'en'))
  const p = privacy[lang]
  const { whatsappNumber, privacyEmail, instagramHandle } = brand
  const { instagram } = brand.contact

  useEffect(() => {
    const previous = document.title
    document.title = `${p.title} · ${brand.name}`
    return () => {
      document.title = previous
    }
  }, [p.title])

  const choose = (l) => {
    setLang(l)
    history.replaceState(null, '', l === 'ms' ? '#ms' : location.pathname)
  }

  return (
    <section aria-labelledby="privacy-title" className="relative bg-cream pt-[calc(var(--nav-h)+3.5rem)] pb-20 md:pt-[calc(var(--nav-h)+5rem)] md:pb-28">
      <div id="page-top" className="absolute inset-x-0 top-0 h-24" aria-hidden="true" />
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => choose(l)}
              className={`min-h-11 rounded-full border px-4 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition-colors ${
                lang === l ? 'border-brown bg-brown text-cream' : 'border-brown/25 text-brown hover:border-brown/50'
              }`}
            >
              {privacy[l].label}
            </button>
          ))}
        </div>

        <article lang={lang} className="mt-10">
          <h1 id="privacy-title" className="font-display text-[clamp(2.2rem,1.6rem+2.6vw,3.6rem)] leading-[1.05] text-brown">
            {p.title}
          </h1>
          <p className="mt-3 text-sm text-brown-soft">{p.updated}</p>
          <div className="mt-8 space-y-4 text-[1.02rem] leading-relaxed text-brown-soft">
            {p.intro.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>

          {p.sections.map((s) => (
            <section key={s.h} className="mt-10 border-t border-brown/15 pt-8">
              <h2 className="font-display text-[1.45rem] leading-snug text-brown">{s.h}</h2>
              <div className="mt-4 space-y-4 text-[1rem] leading-relaxed text-brown-soft">
                {s.body.map((b) =>
                  Array.isArray(b) ? (
                    <ul key={b[0]} className="list-disc space-y-2 pl-5 marker:text-rust-deep">
                      {b.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={b}>{b}</p>
                  ),
                )}
              </div>
            </section>
          ))}

          <dl className="mt-5 grid gap-x-6 gap-y-2 text-[1rem] text-brown-soft sm:grid-cols-[auto_1fr]">
            <dt className="font-medium text-brown">{p.contact.whatsapp}</dt>
            <dd>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="link-underline">
                {prettyPhone(whatsappNumber)}
              </a>
            </dd>
            {instagram && (
              <>
                <dt className="font-medium text-brown">{p.contact.instagram}</dt>
                <dd>
                  <a href={instagram} target="_blank" rel="noopener noreferrer" className="link-underline">
                    {instagramHandle || instagram}
                  </a>
                </dd>
              </>
            )}
            {privacyEmail && (
              <>
                <dt className="font-medium text-brown">{p.contact.email}</dt>
                <dd>
                  <a href={`mailto:${privacyEmail}`} className="link-underline break-all">
                    {privacyEmail}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </article>
      </div>
    </section>
  )
}
