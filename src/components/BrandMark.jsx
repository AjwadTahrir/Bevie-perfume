import JethaSymbol from './JethaSymbol'
import { brand } from '../config/brand'

/**
 * The storefront brand mark: the JETHA symbol with the JETHA wordmark
 * beside it, both in the same glossy black, centred on one line and
 * sized as one unit (the letter-spacing after the last letter is pulled
 * back so the mark stays balanced). Decorative: the link around it
 * carries the accessible name.
 */
export default function BrandMark({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 lg:gap-3 ${className}`} aria-hidden="true">
      <JethaSymbol finish="black" className="h-8 lg:h-10" />
      <span className="brand-gloss-text -mr-[0.3em] font-display text-[1.2rem] leading-none tracking-[0.3em] lg:text-[1.45rem]">{brand.wordmark}</span>
    </span>
  )
}
