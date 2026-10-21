import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (SIL Open Font License), Latin subset only.
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-500-italic.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource-variable/outfit/wght.css'

import './styles/index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
