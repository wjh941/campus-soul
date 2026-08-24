import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './premium.css'
import './interactions.css'
import './health.css'
import './executive.css'
import App from './App.tsx'
import AppErrorBoundary from './components/AppErrorBoundary.tsx'

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(error=>console.warn('Service worker registration failed',error)))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </StrictMode>,
)
