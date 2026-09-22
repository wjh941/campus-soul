import { useApp } from '../../context/AppContext'
import { mobileNav } from '../../lib/navigation'

export default function MobileNav({ view }: { view: string }) {
  const { go } = useApp()
  return <nav className="mobile-nav" aria-label="移动导航">{mobileNav.map(item => <button key={item.id} aria-current={view === item.id ? 'page' : undefined} className={view === item.id ? 'active' : ''} onClick={() => go(item.id)}><span className="mobile-nav-icon"><item.icon size={21} />{item.badge && <i>{item.badge}</i>}</span><span>{item.id === 'profile' ? '我的' : item.label}</span></button>)}</nav>
}
