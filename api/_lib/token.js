import { createHash, randomBytes } from 'node:crypto'

/** Secret the customer's browser keeps to attach a payment to its own order. Only the hash is stored. */
export const newOrderToken = () => randomBytes(32).toString('base64url')
export const hashToken = (token) => createHash('sha256').update(String(token)).digest('hex')
