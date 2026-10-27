/**
 * Shrinks a payment screenshot before upload. Phone screenshots are
 * often 1-4 MB PNGs; re-encoded as JPEG with the longest side capped
 * they are typically ten times smaller and the receipt text stays
 * sharp. Small images are left alone, and if anything goes wrong (or
 * the result would be larger) the original file is returned.
 */
const MAX_SIDE = 2000
const QUALITY = 0.85
const SKIP_BELOW_BYTES = 400 * 1024

async function decode(file) {
  if ('createImageBitmap' in window) return createImageBitmap(file)
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compressReceipt(file) {
  try {
    const img = await decode(file)
    const w = img.width
    const h = img.height
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h))
    if (scale === 1 && file.size <= SKIP_BELOW_BYTES) return file

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff' // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    img.close?.()

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}
