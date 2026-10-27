/**
 * Page scroll lock shared by every overlay, counted so that closing
 * one overlay (the product pop-up) doesn't unlock the page while
 * another (the cart) is still open.
 */
let locks = 0

export function lockScroll() {
  locks += 1
  document.documentElement.style.overflow = 'hidden'
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1)
  if (!locks) document.documentElement.style.overflow = ''
}
