import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, LoaderCircle, ShieldCheck, Sparkles, WifiOff, X } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [school, setSchool] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) return setMessage('请先配置 Supabase 环境变量')
    setBusy(true); setMessage('')
    try {
      const result = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options:{data:{nickname,school},emailRedirectTo:new URL(`${import.meta.env.BASE_URL}?auth=callback`,location.origin).toString()} })
      if (result.error) { const raw=result.error.message; const friendly=raw.toLowerCase().includes('user already registered')?'这个邮箱已经注册过，请切换到“登录”。':raw.toLowerCase().includes('email')&&raw.toLowerCase().includes('confirm')?'邮箱确认功能未完成，请检查验证邮件或让管理员在 Supabase Auth 中关闭邮箱确认。':raw.toLowerCase().includes('rate limit')?'注册请求过于频繁，请稍后再试。':raw; return setMessage(friendly) }
      if (mode === 'register' && !result.data.session) return setMessage('账号已创建，但需要先完成邮箱验证。请检查收件箱、垃圾邮件，点击验证链接后再切换到“登录”。')
      onClose()
    } catch (error) { setMessage(error instanceof Error ? error.message : '认证服务暂时不可用，请稍后重试') } finally { setBusy(false) }
  }
  return <motion.div className="modal-backdrop auth-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.div className="auth-modal" initial={{ y: 25, scale: .96 }} animate={{ y: 0, scale: 1 }} onClick={e => e.stopPropagation()}><button type="button" className="modal-close" aria-label="关闭登录窗口" onClick={onClose}><X /></button><div className="auth-art"><div className="brand light"><span><Sparkles size={19} /></span>同频</div><div><span className="eyebrow light-text">TONGPIN 18+</span><h2>让值得的相遇，<br />从真实开始。</h2><p>高校身份 · 安全社区 · 深度匹配</p></div><div className="auth-proof"><ShieldCheck /><span><b>隐私优先</b>你的邮箱不会公开展示</span></div></div><form className="auth-form" onSubmit={submit}><span className="section-kicker">WELCOME TO TONGPIN</span><h2>{mode === 'login' ? '欢迎回来' : '创建同频账号'}</h2><p>{mode === 'login' ? '登录后继续探索真实的校园连接' : '使用校园邮箱，开始建立你的同频画像'}</p>{mode === 'register' && <><label>昵称<input value={nickname} onChange={e => setNickname(e.target.value)} required maxLength={30} placeholder="大家怎么称呼你" /></label><label>学校<input value={school} onChange={e => setSchool(e.target.value)} required maxLength={80} placeholder="你所在的大学" /></label></>}<label>邮箱<input type="email" value={email} onChange={e => setEmail(e.target.value.trim())} required placeholder="name@example.com" /></label><label>密码<input type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required placeholder="至少 6 位字符" /></label>{message && <div className="auth-message">{message}</div>}<button className="primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <>{mode === 'login' ? '登录' : '注册账号'} <ArrowRight size={17} /></>}</button>{mode==='login'&&<button type="button" className="auth-recovery" disabled={busy||!email} onClick={async()=>{if(!supabase)return;setBusy(true);setMessage('');const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:new URL(`${import.meta.env.BASE_URL}?auth=callback&type=recovery`,location.origin).toString()});setBusy(false);setMessage(error?error.message:'密码恢复邮件已发送，请检查收件箱和垃圾邮件。')}}>忘记密码？发送恢复邮件</button>}<div className="auth-switch">{mode === 'login' ? '还没有账号？' : '已经注册？'}<button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>{mode === 'login' ? '立即注册' : '返回登录'}</button></div>{!isSupabaseConfigured && <div className="demo-notice"><WifiOff size={16} /><span><b>当前是演示模式</b>配置 .env.local 后即可使用真实账户</span></div>}</form></motion.div></motion.div>
}