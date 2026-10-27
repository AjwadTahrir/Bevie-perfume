import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (message, tone = 'good') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t.slice(-3), { id, message, tone }])
      setTimeout(() => dismiss(id), tone === 'bad' ? 7000 : 4000)
    },
    [dismiss],
  )
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role={t.tone === 'bad' ? 'alert' : 'status'} className="rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md bg-espresso px-4 py-3 text-sm text-surface shadow-[0_12px_32px_rgba(58,36,32,0.3)]">
            {t.tone === 'bad' ? <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#f2a48f]" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#b9d3a6]" />}
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} className="text-surface/60 hover:text-surface" aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
