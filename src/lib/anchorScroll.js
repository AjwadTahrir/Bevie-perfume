/**
 * In-page links land on each section's heading rather than the
 * section's top edge, which sits above generous padding. Mark the
 * element to land on with `data-scroll-anchor`; sections without one
 * keep the browser's default jump (CSS scroll-margin-top).
 */

const GAP = 28 // px of breathing room below the navigation bar

/** Document top of an element, ignoring CSS transforms (reveal animations). */
function documentTop(el) {
  let y = 0
  for (let node = el; node; node = node.offsetParent) y += node.offsetTop
  return y
}

export function installAnchorScroll() {
  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const link = e.target.closest?.('a[href^="#"]')
    if (!link) return
    const hash = link.getAttribute('href')
    if (hash.length < 2) return
    const section = document.getElementById(decodeURIComponent(hash.slice(1)))
    const anchor = section?.querySelector('[data-scroll-anchor]')
    if (!anchor) return

    e.preventDefault()
    const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 0
    const smooth = window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    window.scrollTo({ top: documentTop(anchor) - nav - GAP, behavior: smooth ? 'smooth' : 'auto' })
    history.pushState(null, '', hash)
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}
