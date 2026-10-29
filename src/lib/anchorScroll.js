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

/** Scrolls to the section named by `hash` ('#collection'). Returns false if it has no anchor. */
function scrollToSection(hash, smooth) {
  if (!hash || hash.length < 2) return false
  const section = document.getElementById(decodeURIComponent(hash.slice(1)))
  const anchor = section?.querySelector('[data-scroll-anchor]')
  if (!anchor) return false
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 0
  window.scrollTo({ top: documentTop(anchor) - nav - GAP, behavior: smooth ? 'smooth' : 'auto' })
  return true
}

export function installAnchorScroll() {
  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const link = e.target.closest?.('a[href^="#"]')
    if (!link) return
    const hash = link.getAttribute('href')
    const smooth = window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    if (!scrollToSection(hash, smooth)) return
    e.preventDefault()
    history.pushState(null, '', hash)
  }
  document.addEventListener('click', onClick)

  // Arriving with a hash (e.g. /#for-her from the privacy page): land again once
  // the pinned hero has laid itself out, since that shifts everything below it.
  let timer
  if (window.location.hash) {
    const land = () => (timer = setTimeout(() => scrollToSection(window.location.hash, false), 350))
    if (document.readyState === 'complete') land()
    else window.addEventListener('load', land, { once: true })
  }
  return () => {
    clearTimeout(timer)
    document.removeEventListener('click', onClick)
  }
}
