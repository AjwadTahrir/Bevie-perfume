import { Mail, MessageCircle } from 'lucide-react'
import { CornerFlourish } from '../assets/batik/Ornaments'
import WhatsAppButton from './WhatsAppButton'
import Reveal from './Reveal'
import { brand, sections } from '../config/brand'
import { copy } from '../config/content'
import { enquiryMessage, normalizeWhatsAppNumber } from '../lib/whatsapp'

/** Shows the configured number in international form, e.g. "+60123456789". */
const displayNumber = (n) => (n ? `+${n}` : null)

/**
 * CONTACT
 * A framed panel with flourishes on two opposite corners. Channels
 * that are not configured in src/config/brand.js are shown as plain
 * "to be announced" text, never as links.
 */
export default function ContactSection() {
  const wa = normalizeWhatsAppNumber(brand.whatsappNumber)
  const { instagram, email } = brand.contact

  const channels = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      value: displayNumber(wa),
      href: null, // the main button below handles WhatsApp
    },
    {
      key: 'instagram',
      label: 'Instagram',
      icon: null,
      value: instagram ? brand.instagramHandle || 'Instagram profile' : null,
      href: instagram || null,
    },
    {
      key: 'email',
      label: 'Email',
      icon: Mail,
      value: email || null,
      href: email ? `mailto:${email}` : null,
    },
  ]

  return (
    <section id={sections.contact} data-nav="contact" aria-labelledby="contact-title" className="py-24 md:py-32 lg:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
        <Reveal data-scroll-anchor className="relative px-6 py-14 md:px-14 md:py-20 lg:px-20 lg:py-24">
          <CornerFlourish className="pointer-events-none absolute left-0 top-0 size-24 md:size-32" />
          <CornerFlourish className="pointer-events-none absolute bottom-0 right-0 size-24 rotate-180 md:size-32" />
          <div className="pointer-events-none absolute inset-0 border border-ochre/50" aria-hidden="true" />

          <div className="relative grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <h2 id="contact-title" className="type-h2 text-brown">
                {copy.contact.title}
              </h2>
              <p className="type-lead mt-6 max-w-xl">{copy.contact.intro}</p>
              <div className="mt-10">
                <WhatsAppButton message={enquiryMessage} label="Chat on WhatsApp" />
              </div>
            </div>

            <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
              <h3 className="type-label text-brown-soft">Official channels</h3>
              <dl className="mt-5 divide-y divide-ochre/50 border-y border-ochre/50">
                {channels.map(({ key, label, icon: Icon, value, href }) => (
                  <div key={key} className="flex items-center justify-between gap-4 py-4">
                    <dt className="flex items-center gap-3 font-display text-xl text-brown">
                      {Icon && <Icon size={18} strokeWidth={1.5} aria-hidden="true" />}
                      {!Icon && <span className="inline-block size-[18px]" aria-hidden="true" />}
                      {label}
                    </dt>
                    <dd className="text-right text-sm">
                      {value && href ? (
                        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="link-underline text-brown">
                          {value}
                        </a>
                      ) : value ? (
                        <span>{value}</span>
                      ) : (
                        <span className="text-brown-soft">To be announced</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
