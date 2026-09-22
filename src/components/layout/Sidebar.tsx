import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, LifeBuoy, LogIn, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Settings, Sparkles, Sun, User, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { navGroups } from '../../lib/navigation'
import Avatar from '../common/Avatar'

type SidebarProps = {
  view: string
  sidebarCollapsed: boolean
  onToggleCollapsed: () => void
  mobileMenuOpen: boolean
  onCloseMobileMenu: () => void
}

export default function Sidebar({ view, sidebarCollapsed, onToggleCollapsed, mobileMenuOpen, onCloseMobileMenu }: SidebarProps) {
  const { session, profileBundle, userAvatar, theme, setTheme, go, setShowAuth, signOut } = useApp()
  const [navOpen, setNavOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(navGroups.map(group => [group.label, true])))
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  return <aside id="app-sidebar" className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="主导航">
    <div className="sidebar-head"><button className="brand" onClick={() => go('home')} aria-label="返回首页"><span><Sparkles size={18} /></span><div><b>同频</b><small>REAL CONNECTIONS</small></div></button><button className="collapse-toggle" onClick={onToggleCollapsed} aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}>{sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button><button className="mobile-close" onClick={onCloseMobileMenu} aria-label="关闭菜单"><X /></button></div>
    <div className="sidebar-scroll"><div className="journey-status"><span><Sparkles /></span><div><b>同频旅程</b><small>从了解自己开始</small></div><i><em style={{ width: `${view === 'assessment' ? '34%' : view === 'exploration' ? '50%' : view === 'preferences' ? '67%' : view === 'matches' ? '100%' : '12%'}` }} /></i></div>{navGroups.map(group => {
      const active = group.items.some(item => item.id === view)
      const open = sidebarCollapsed || navOpen[group.label] !== false
      return <section className={`nav-group ${open ? 'open' : 'closed'} ${active ? 'has-active' : ''}`} key={group.label}><button className="nav-group-toggle" aria-expanded={open} onClick={() => setNavOpen(current => ({ ...current, [group.label]: !open }))}><span><b>{group.label}</b><small>{group.hint}</small></span><ChevronDown /></button><nav aria-label={group.label}>{group.items.map(item => <button title={sidebarCollapsed ? item.label : undefined} aria-current={view === item.id ? 'page' : undefined} key={item.id} className={`${view === item.id ? 'active' : ''} ${item.featured ? 'featured' : ''}`} onClick={() => go(item.id)}><span className="nav-icon"><item.icon size={19} /></span><span className="nav-label">{item.label}</span>{item.badge && <em>{item.badge}</em>}</button>)}</nav></section>
    })}</div>
    <div className="sidebar-bottom"><button className="side-extra" onClick={() => session ? go('data') : setShowAuth(true)}><Settings size={18} /><span>数据与账号</span></button><button className="side-extra" onClick={() => go('legal')}><LifeBuoy size={18} /><span>帮助与条款</span></button><div className="side-profile-wrap"><button className="side-profile" onClick={() => setProfileMenuOpen(x => !x)} aria-expanded={profileMenuOpen}><Avatar src={userAvatar} size={38} online={Boolean(session)} /><div><b>{profileBundle?.profile.nickname || session?.user.user_metadata.nickname || '访客'}</b><span>{profileBundle?.profile.life_stage || (session ? '已登录' : '演示模式')}</span></div><ChevronDown size={16} className={profileMenuOpen ? 'rotate' : ''} /></button>{profileMenuOpen && <motion.div className="profile-popover" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><button onClick={() => go('profile')}><User />我的主页</button><button onClick={() => session ? go('data') : setShowAuth(true)}><Settings />账号设置</button><button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon /> : <Sun />}{theme === 'light' ? '深色模式' : '浅色模式'}</button><i />{session ? <button className="logout" onClick={signOut}><LogOut />退出登录</button> : <button onClick={() => setShowAuth(true)}><LogIn />登录同频</button>}</motion.div>}</div></div>
  </aside>
}
