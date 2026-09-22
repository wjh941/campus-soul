import { Suspense, lazy } from 'react'
import { Bell, LogIn, LogOut, Moon, Search, Sparkles, Sun } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { navGroups, type ViewKey } from '../../lib/navigation'
import Avatar from '../common/Avatar'

const ConnectionHealth = lazy(() => import('../ConnectionHealth'))
const PwaControls = lazy(() => import('../PwaControls'))
const GlobalSearch = lazy(() => import('../GlobalSearch'))

type TopbarProps = {
  title: string
  view: string
  mobileMenuOpen: boolean
  onToggleMobileMenu: () => void
  menuButtonRef: React.RefObject<HTMLButtonElement | null>
  unreadNotifications: boolean
  onOpenNotifications: () => void
}

export default function Topbar({ title, view, mobileMenuOpen, onToggleMobileMenu, menuButtonRef, unreadNotifications, onOpenNotifications }: TopbarProps) {
  const { session, matchPeople, userAvatar, theme, setTheme, notify, go, setShowAuth, setSelectedPerson, signOut, setUnreadNotifications } = useApp()
  return <header className="topbar"><div><div className="mobile-title"><button ref={menuButtonRef} className="mobile-menu-button" onClick={onToggleMobileMenu} aria-label={mobileMenuOpen ? '关闭模块导航' : '打开模块导航'} aria-controls="app-sidebar" aria-expanded={mobileMenuOpen}><svg className="morph-menu" viewBox="0 0 24 24" aria-hidden="true"><path className="morph-top" d="M4 7h16"/><path className="morph-mid" d="M4 12h16"/><path className="morph-bottom" d="M4 17h16"/></svg></button><p className="mobile-brand"><Sparkles size={17} />同频</p></div><h1>{title} <span>👋</span></h1>{view === 'home' && <p>今天也有新的故事，正在靠近你。</p>}</div><div className="top-actions"><Suspense fallback={null}><ConnectionHealth /><PwaControls /></Suspense><button className="icon-btn theme-toggle" aria-label={theme === 'light' ? '切换深色模式' : '切换浅色模式'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><Suspense fallback={<button className="search search-trigger"><Search /><span>搜索校园、兴趣或用户</span><kbd>⌘ K</kbd></button>}><GlobalSearch people={matchPeople.map(p => ({ id: p.id, name: p.name, school: p.school, major: p.major, tags: p.tags, avatar: p.avatar }))} pages={navGroups.flatMap(g => g.items).map(x => ({ id: x.id, label: x.label }))} onPerson={id => { const person = matchPeople.find(p => p.id === id); if (person) setSelectedPerson(person) }} onPage={id => go(id as ViewKey)} /></Suspense><button className="icon-btn notification" aria-label="打开通知中心" onClick={() => { if (!session) { setShowAuth(true); notify('登录后查看账号通知'); return } setUnreadNotifications(false); onOpenNotifications() }}><Bell size={20} />{unreadNotifications && <i />}</button>{session ? <button className="session-pill" onClick={signOut}><LogOut size={15} />退出</button> : <button className="session-pill" onClick={() => setShowAuth(true)}><LogIn size={15} />登录</button>}<button className="top-avatar-button" aria-label={session ? '打开我的主页' : '登录后查看个人主页'} onClick={() => session ? go('profile') : setShowAuth(true)}><Avatar src={userAvatar} size={38} /></button></div></header>
}
