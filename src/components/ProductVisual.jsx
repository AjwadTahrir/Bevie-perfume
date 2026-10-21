import BottleIllustration from '../assets/products/BottleIllustration'

/**
 * Shows the perfume's photo when one is supplied, otherwise the
 * placeholder bottle illustration. `decorative` hides it from screen
 * readers when the product name is already announced next to it.
 */
export default function ProductVisual({ perfume, className = '', decorative = true, loading = 'lazy' }) {
  if (perfume.image) {
    return (
      <img
        src={perfume.image}
        alt={decorative ? '' : perfume.imageAlt || `${perfume.name} perfume bottle`}
        loading={loading}
        decoding="async"
        className={`object-contain ${className}`}
      />
    )
  }
  return (
    <BottleIllustration
      bottle={perfume.bottle}
      className={className}
      title={decorative ? undefined : `Illustrated placeholder bottle for ${perfume.name}`}
    />
  )
}
