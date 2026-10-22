import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (SIL Open Font License), Latin subset only.
import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-500.css'
import '@fontsource-variable/dm-sans/wght.css'

import './styles/index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
