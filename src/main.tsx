import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './premium.css'
import './interactions.css'
import './health.css'
import './executive.css'
import './click-polish.css'
import './commerce.css'
import './form-polish.css'
import './desktop-polish.css'
import './sidebar-polish.css'
import './advanced-motion.css'
import App from './App.tsx'
import AppErrorBoundary from './components/AppErrorBoundary.tsx'
import AuthCallback from './components/AuthCallback.tsx'

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(error=>console.warn('Service worker registration failed',error)))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>{new URLSearchParams(location.search).has('code')||new URLSearchParams(location.search).has('token_hash')||location.hash.includes('access_token=')||location.hash.includes('error_description=')?<AuthCallback/>:<App/>}</AppErrorBoundary>
  </StrictMode>,
)
