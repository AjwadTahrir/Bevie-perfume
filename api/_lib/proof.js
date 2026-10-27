/**
 * Identifies an uploaded proof of payment from its first bytes, so a
 * renamed file or a forged Content-Type can't slip through.
 * Returns { mime, ext } or null.
 */
export function sniffProof(bytes) {
  const b = bytes
  const at = (i, ...sig) => sig.every((v, k) => b[i + k] === v)
  if (b.length >= 3 && at(0, 0xff, 0xd8, 0xff)) return { mime: 'image/jpeg', ext: 'jpg' }
  if (b.length >= 8 && at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: 'image/png', ext: 'png' }
  if (b.length >= 12 && at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return { mime: 'image/webp', ext: 'webp' }
  if (b.length >= 5 && at(0, 0x25, 0x50, 0x44, 0x46, 0x2d)) return { mime: 'application/pdf', ext: 'pdf' }
  return null
}
