import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initPdfTextLoader } from './utils/pdfTextLoader.js'

// Warm up PDF word repository in background on initial load
initPdfTextLoader();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
