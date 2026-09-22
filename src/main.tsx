import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AppErrorBoundary from './components/AppErrorBoundary.tsx'
import AuthCallback from './components/AuthCallback.tsx'

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(registration=>registration.update().catch(()=>undefined)).catch(error=>console.warn('Service worker registration failed',error)))
window.addEventListener('error',event=>{if(event.target instanceof HTMLScriptElement||event.target instanceof HTMLLinkElement)document.documentElement.classList.add('boot-failed')},{capture:true})
window.addEventListener('unhandledrejection',event=>{console.warn('Unhandled async error',event.reason)})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>{new URLSearchParams(location.search).has('code')||new URLSearchParams(location.search).has('token_hash')||location.hash.includes('access_token=')||location.hash.includes('error_description=')?<AuthCallback/>:<App/>}</AppErrorBoundary>
  </StrictMode>,
)
