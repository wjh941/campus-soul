import { useCallback, useEffect, useState } from 'react'
import { Bell, BellRing, Check, LoaderCircle, X } from 'lucide-react'
import { enableBrowserNotifications, fetchNotifications, markAllRead } from '../lib/notifications'

type Item = Awaited<ReturnType<typeof fetchNotifications>>[number]

export default function NotificationPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    try { setItems(await fetchNotifications(userId)) } finally { setLoading(false) }
  }, [userId])
  useEffect(() => { window.setTimeout(() => void load(), 0) }, [load])
  const enable = async () => {
    try { await enableBrowserNotifications(); setMessage('浏览器通知已开启') }
    catch (e) { setMessage(e instanceof Error ? e.message : '开启失败') }
  }
  const readAll = async () => { await markAllRead(userId); await load() }
  return <aside className="notification-panel">
    <header><div><Bell /><h2>通知中心</h2></div><button onClick={onClose}><X /></button></header>
    <button className="browser-notify" onClick={() => void enable()}><BellRing />开启浏览器通知</button>
    {message && <p className="notify-message">{message}</p>}
    <button className="mark-read" onClick={() => void readAll()}><Check />全部已读</button>
    <div className="notification-items">
      {loading ? <LoaderCircle className="spin" /> : !items.length ? <div className="notify-empty">暂时没有新通知</div> : items.map(item => <article className={item.read_at ? '' : 'unread'} key={item.id}><i /><div><b>{item.title}</b><p>{item.body}</p><time>{new Date(item.created_at).toLocaleString()}</time></div></article>)}
    </div>
  </aside>
}
