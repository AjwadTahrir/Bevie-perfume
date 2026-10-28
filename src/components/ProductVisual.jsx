import BottleIllustration from '../assets/products/BottleIllustration'

/**
 * Shows the bottle render when there is one, else the perfume's photo,
 * else the placeholder bottle illustration. `decorative` hides it from
 * screen readers when the product name is already announced next to it.
 * Renders are 4:5 and carry their size so the box never jumps while
 * they load; `sizes` should describe the rendered width.
 */
export default function ProductVisual({ perfume, className = '', decorative = true, loading = 'lazy', sizes = '50vw', fetchPriority }) {
  const alt = decorative ? '' : perfume.imageAlt || `${perfume.name} perfume bottle`
  if (perfume.render) {
    return (
      <img
        src={perfume.render.src}
        srcSet={perfume.render.srcSet}
        sizes={sizes}
        width="480"
        height="600"
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable="false"
        className={`object-contain ${className}`}
      />
    )
  }
  if (perfume.image) {
    return <img src={perfume.image} alt={alt} loading={loading} decoding="async" className={`object-contain ${className}`} />
  }
  return (
    <BottleIllustration
      bottle={perfume.bottle}
      className={className}
      title={decorative ? undefined : `Illustrated placeholder bottle for ${perfume.name}`}
    />
  )
}
