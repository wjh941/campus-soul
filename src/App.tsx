import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoaderCircle, WifiOff } from 'lucide-react'
import './App.css'
import { AppProvider } from './context/AppProvider'
import { useApp } from './context/AppContext'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { saveProfile } from './lib/profiles'
import { safeStorage } from './lib/resilience'
import { usePointerRipple } from './hooks/usePointerRipple'
import { viewFromPath, viewTitle, type ViewKey } from './lib/navigation'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import MobileNav from './components/layout/MobileNav'
import PageLoading from './components/common/PageLoading'
import AuthModal from './components/auth/AuthModal'
import Onboarding from './components/auth/Onboarding'
import GuestAgeGate from './components/discovery/GuestAgeGate'
import ProfileModal from './components/discovery/ProfileModal'

import Discovery from './routes/Discovery'
import Matches from './routes/Matches'
import Exploration from './routes/Exploration'
import Assessment from './routes/Assessment'
import Preferences from './routes/Preferences'
import Moments from './routes/Moments'
import Anonymous from './routes/Anonymous'
import Messages from './routes/Messages'
import Membership from './routes/Membership'
import Account from './routes/Account'
import Legal from './routes/Legal'
import Data from './routes/Data'
import Admin from './routes/Admin'
import Profile from './routes/Profile'

const GuestActivation = lazy(() => import('./components/discovery/GuestActivation'))
const LegalModal = lazy(() => import('./components/LegalModal'))
const NotificationPanel = lazy(() => import('./components/NotificationPanel'))
const MatchInsights = lazy(() => import('./components/MatchInsights'))

function AppShell() {
  const {
    session, authReady, authError, retryAuth, dismissAuthError,
    profile, profileBundle, syncProfileAndMatches,
    toast, online, notify, go,
    guestAgeConfirmed, setGuestAgeConfirmed,
    unreadNotifications,
    selectedPerson, setSelectedPerson,
    insightPerson, setInsightPerson,
    showAuth, setShowAuth, showOnboarding, setShowOnboarding, showLegal, setShowLegal,
    heartPerson, safetyPerson,
  } = useApp()
  const location = useLocation()
  const view = viewFromPath(location.pathname)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => safeStorage.get('tongpin-sidebar') === 'collapsed')
  useEffect(() => { safeStorage.set('tongpin-sidebar', sidebarCollapsed ? 'collapsed' : 'expanded') }, [sidebarCollapsed])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  usePointerRipple()

  useEffect(() => {
    const query = matchMedia('(max-width:760px)')
    const close = () => { if (!query.matches) setMobileMenuOpen(false) }
    if (query.addEventListener) query.addEventListener('change', close)
    else query.addListener(close)
    return () => { if (query.removeEventListener) query.removeEventListener('change', close); else query.removeListener(close) }
  }, [])
  useEffect(() => {
    if (!mobileMenuOpen) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileMenuOpen(false); menuButtonRef.current?.focus(); return }
      if (event.key === 'Tab') {
        const sidebar = document.getElementById('app-sidebar')
        const items = sidebar?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]')
        if (!items?.length) return
        const first = items[0], last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    requestAnimationFrame(() => document.querySelector<HTMLElement>('#app-sidebar .mobile-close')?.focus())
    addEventListener('keydown', close)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', close); document.body.style.overflow = previous }
  }, [mobileMenuOpen])
  const closeMobileMenu = () => { setMobileMenuOpen(false); menuButtonRef.current?.focus() }

  const title = useMemo(() => viewTitle(view, profileBundle?.profile.nickname), [view, profileBundle?.profile.nickname])
  useEffect(() => { document.title = `${title} · 同频` }, [title])

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>跳转到主内容</a>
    <Sidebar view={view} sidebarCollapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed(x => !x)} mobileMenuOpen={mobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
    {mobileMenuOpen && <button className="sidebar-scrim" aria-label="关闭菜单" onClick={closeMobileMenu} />}
    <main id="main-content" tabIndex={-1} className={!session ? 'guest-main' : ''}>
      <Topbar
        title={title} view={view}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => mobileMenuOpen ? closeMobileMenu() : setMobileMenuOpen(true)}
        menuButtonRef={menuButtonRef}
        unreadNotifications={unreadNotifications}
        onOpenNotifications={() => setShowNotifications(true)}
      />
      {!authReady && <div className="auth-sync-banner" role="status" aria-live="polite"><LoaderCircle className="spin" size={15} />正在确认账号状态，访客内容可以继续浏览</div>}
      {authReady && authError && <div className="auth-sync-banner warning" role="status" aria-live="polite"><WifiOff size={15} />账号服务响应较慢，<button type="button" onClick={retryAuth}>重试</button><button type="button" onClick={dismissAuthError}>以访客继续</button></div>}
      {view === 'home' && !session && <GuestActivation onExplore={() => go('exploration')} onAuth={() => setShowAuth(true)} />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Discovery />} />
          <Route path="/exploration" element={<Exploration />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/moments" element={<Moments />} />
          <Route path="/anonymous" element={<Anonymous />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/account" element={<Account />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/data" element={<Data />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </main>
    <MobileNav view={view} />
    {!session && !guestAgeConfirmed && <GuestAgeGate onAccept={() => { safeStorage.set('tongpin-guest-age-confirmed', 'yes'); setGuestAgeConfirmed(true) }} />}
    {!online && <div className="network-banner"><WifiOff />当前网络已断开，部分操作将在恢复连接后可用</div>}
    {!isSupabaseConfigured && <div className="demo-badge"><WifiOff size={13} />演示模式</div>}
    {toast && <motion.div className="toast" role="status" aria-live="polite" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>{toast}</motion.div>}
    <AnimatePresence>
      {selectedPerson && <ProfileModal person={selectedPerson} onClose={() => setSelectedPerson(null)} onHeart={() => heartPerson(selectedPerson)} onReport={() => safetyPerson(selectedPerson, 'report')} onBlock={() => safetyPerson(selectedPerson, 'block')} />}
      {showOnboarding && <Onboarding
        initial={profile ? { nickname: profile.nickname, birthYear: profile.birth_year ?? 2003, school: profile.school, major: profile.major ?? '', grade: profile.grade ?? '' } : undefined}
        onClose={() => setShowOnboarding(false)}
        onSave={async (traits, frequency, details) => {
          if (!session || !supabase) { setShowAuth(true); return }
          await saveProfile(session.user.id, { nickname: details.nickname.trim(), birth_year: details.birthYear, school: details.school.trim(), major: details.major.trim() || null, grade: details.grade.trim() || null, onboarding_complete: true })
          const { error } = await supabase.from('preferences').update({ desired_traits: traits, preferred_values: traits, interaction_frequency: frequency, updated_at: new Date().toISOString() }).eq('user_id', session.user.id)
          if (error) throw error
          await syncProfileAndMatches(session.user.id)
          notify('同频画像已保存')
        }}
      />}
      {showNotifications && session && <Suspense fallback={null}><NotificationPanel userId={session.user.id} onClose={() => setShowNotifications(false)} onNavigate={link => go(link as ViewKey)} /></Suspense>}
      {showLegal && session && <Suspense fallback={null}><LegalModal session={session} required={!profileBundle?.profile.accepted_terms_at} onClose={() => setShowLegal(false)} onAccepted={() => { setShowLegal(false); void syncProfileAndMatches(session.user.id); notify('年龄与协议确认成功') }} /></Suspense>}
      {insightPerson && <Suspense fallback={<PageLoading label="正在生成匹配分析" />}><MatchInsights person={insightPerson} onClose={() => setInsightPerson(null)} onChanged={() => { void syncProfileAndMatches(session?.user.id ?? '') }} /></Suspense>}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </AnimatePresence>
  </div>
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </HashRouter>
  )
}
