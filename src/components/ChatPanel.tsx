import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, LoaderCircle, MessageCircle, Search, Send, Sparkles } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { fetchConversations, fetchMessages, markConversationRead, sendMessage, subscribeToMessages, type ChatMessage, type Conversation } from '../lib/messaging'
import { supabase } from '../lib/supabase'
import { ConversationGuidance, SafetyTip } from './ChatGuidance'

function MiniAvatar({ src, size = 42 }: { src: string; size?: number }) { return <img className="chat-avatar" style={{ width: size, height: size }} src={src} alt="用户头像" /> }
function time(value: string) { return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) }

export default function ChatPanel({ session, onRequireAuth }: { session: Session | null; onRequireAuth: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [active, setActive] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [query,setQuery]=useState('')
  const [nudge,setNudge]=useState('')
  const [ended,setEnded]=useState(false)
  const [showSafety,setShowSafety]=useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const requestRef=useRef(0)
  const visibleConversations=useMemo(()=>{const value=query.trim().toLowerCase();return value?conversations.filter(item=>[item.name,item.school,item.lastMessage].some(text=>String(text??'').toLowerCase().includes(value))):conversations},[conversations,query])
  const loadConversations = useCallback(async () => { if (!session) return; setLoading(true); try { setConversations(await fetchConversations(session.user.id)); setError('') } catch (e) { setError(e instanceof Error ? e.message : '会话加载失败') } finally { setLoading(false) } }, [session])
  useEffect(()=>{if(!session)return;const timer=window.setTimeout(()=>void loadConversations(),0);return()=>clearTimeout(timer)},[session,loadConversations])
  useEffect(() => {
    if (!active || !session) return
    const request=++requestRef.current;const start=window.setTimeout(()=>{if(request===requestRef.current){setMessages([]);setLoading(true);setError('')}},0)
    void fetchMessages(active.id).then(data=>{if(request===requestRef.current)setMessages(data)}).catch(e=>{if(request===requestRef.current)setError(e instanceof Error?e.message:'消息加载失败')}).finally(()=>{if(request===requestRef.current)setLoading(false)})
    void markConversationRead(active.id, session.user.id).then(() => setConversations(items => items.map(item => item.id === active.id ? { ...item, unread: 0 } : item)))
    const channel = subscribeToMessages(active.id, message => { setMessages(items => items.some(item => item.id === message.id) ? items : [...items, message]); if (message.senderId !== session.user.id) void markConversationRead(active.id, session.user.id) })
    return()=>{clearTimeout(start);requestRef.current=request+1;if(channel&&supabase)void supabase.removeChannel(channel)}
  }, [active, session])
  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [messages])
  const sendNudge=(text:string)=>{setNudge(text);window.setTimeout(()=>setNudge(''),2200)}
  const submit = async () => { if (!active || !session || !input.trim() || sending) return; const value = input.trim(); setInput(''); setSending(true); try { await sendMessage(active.id, session.user.id, value) } catch (e) { setInput(value); setError(e instanceof Error ? e.message : '发送失败') } finally { setSending(false) } }
  if (!session) return <section className="chat-locked"><div><MessageCircle /><h2>登录后开始同频对话</h2><p>只有互相心动的人才能开启私信，减少打扰，也让每次交流更真诚。</p><button className="primary" onClick={onRequireAuth}>登录同频 <Sparkles size={17} /></button></div></section>
  return <section className={`chat-shell ${active ? 'mobile-chat-open' : ''}`}>
    <aside className="conversation-list"><header><div><span className="section-kicker">YOUR CONNECTIONS</span><h2>消息</h2></div></header><label className="chat-search"><Search size={16} /><input aria-label="搜索会话" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索同频的人" /></label>{loading && !conversations.length ? <div className="chat-loading"><LoaderCircle className="spin" />正在加载会话</div> : error && !conversations.length ? <div className="chat-error"><p>{error}</p><button onClick={loadConversations}>重新加载</button></div> : !conversations.length ? <div className="empty-conversations"><span><Sparkles /></span><h3>等待第一次双向心动</h3><p>当对方也向你发送心动后，会话会出现在这里。</p></div> : <div className="conversation-items">{query&&visibleConversations.length===0?<div className="manage-empty">没有找到相关会话</div>:visibleConversations.map(item => <button key={item.id} className={active?.id === item.id ? 'active' : ''} onClick={() => setActive(item)}><MiniAvatar src={item.avatar} /><div><b>{item.name}</b><p>{item.lastMessage}</p></div><span>{time(item.lastAt)}{item.unread > 0 && <em>{item.unread}</em>}</span></button>)}</div>}</aside>
    <div className="chat-room">{active ? <><header><button className="chat-back" aria-label="返回会话列表" onClick={() => setActive(null)}><ArrowLeft /></button><MiniAvatar src={active.avatar} size={39} /><div><b>{active.name}</b><span><i />{active.school} · 已互相心动</span></div></header><SafetyTip open={showSafety} onToggle={()=>setShowSafety(x=>!x)}/><div className="conversation-tools"><button type="button" onClick={()=>sendNudge('已标记为稍后回复，你可以安心处理自己的事情')}>稍后回复</button><button type="button" onClick={()=>{setEnded(true);sendNudge('已礼貌结束这段对话')}}>礼貌结束</button></div>{nudge&&<div className="chat-nudge" role="status">{nudge}</div>}<div className="message-stream" aria-live="polite">{loading&&<div className="chat-loading"><LoaderCircle className="spin"/>正在加载消息</div>}{error&&<div className="chat-error"><p>{error}</p><button onClick={()=>setActive({...active})}>重新加载</button></div>}<div className="match-day"><ConversationGuidance onUse={text=>setInput(text)}/></div><AnimatePresence initial={false}>{messages.map(message => <motion.div key={message.id} className={`message-row ${message.senderId === session.user.id ? 'mine' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><div className="message-bubble">{message.content}</div><time>{time(message.createdAt)}</time></motion.div>)}</AnimatePresence><div ref={bottom} /></div><div className="message-composer"><textarea aria-label="输入消息" value={input} maxLength={2000} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void submit() } }} placeholder="写下真诚的第一句话…" /><button aria-label="发送消息" disabled={!input.trim() || sending} onClick={() => void submit()}>{sending ? <LoaderCircle className="spin" /> : <Send />}</button></div>{ended&&<div className="chat-ended"><b>这段对话已礼貌结束</b><span>尊重彼此节奏，也是一种温柔。</span><button type="button" onClick={()=>setEnded(false)}>继续交流</button></div>}</> : <div className="chat-placeholder"><span><MessageCircle /></span><h2>选择一段对话</h2><p>每一次连接，都从双方的心动开始。</p></div>}</div>
  </section>
}
