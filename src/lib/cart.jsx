import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { perfumes } from '../data/perfumes'
import { shop } from '../config/brand'

/**
 * CART
 * Lines are { id, quantity }; product details always come from
 * src/data/perfumes.js and prices from the campaign settings, so
 * nothing stale is kept in someone's cart. The cart is kept in this browser's localStorage
 * between visits (a convenience only: the order itself is created at
 * checkout by src/lib/orders.js).
 */

const STORAGE_KEY = 'beavie-cart-v1'
const byId = new Map(perfumes.map((p) => [p.id, p]))
const clampQty = (n) => Math.max(1, Math.min(shop.maxQuantityPerItem, Math.round(n) || 1))

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(raw) ? raw.filter((l) => byId.has(l?.id)).map((l) => ({ id: l.id, quantity: clampQty(l.quantity) })) : []
  } catch {
    return []
  }
}

function reducer(lines, action) {
  switch (action.type) {
    case 'add': {
      const existing = lines.find((l) => l.id === action.id)
      if (existing) return lines.map((l) => (l.id === action.id ? { ...l, quantity: clampQty(l.quantity + action.quantity) } : l))
      return [...lines, { id: action.id, quantity: clampQty(action.quantity) }]
    }
    case 'set':
      return lines.map((l) => (l.id === action.id ? { ...l, quantity: clampQty(action.quantity) } : l))
    case 'remove':
      return lines.filter((l) => l.id !== action.id)
    case 'clear':
      return []
    default:
      return lines
  }
}

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load)
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // Storage can be unavailable (private mode); the cart still works for this visit.
    }
  }, [lines])

  const add = useCallback((id, quantity = 1) => dispatch({ type: 'add', id, quantity }), [])
  const setQuantity = useCallback((id, quantity) => dispatch({ type: 'set', id, quantity }), [])
  const remove = useCallback((id) => dispatch({ type: 'remove', id }), [])
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])
  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])

  const value = useMemo(() => {
    const items = lines.map((l) => ({ ...l, perfume: byId.get(l.id) })).filter((l) => l.perfume)
    const count = items.reduce((n, l) => n + l.quantity, 0)
    return { items, count, add, setQuantity, remove, clear, isOpen, open, close }
  }, [lines, add, setQuantity, remove, clear, isOpen, open, close])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
