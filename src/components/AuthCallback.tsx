import { useEffect, useState } from 'react'
import { Check, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

type State = 'checking' | 'confirmed' | 'recovery' | 'error'
export default function AuthCallback() {
  const [state, setState] = useState<State>('checking')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const client = supabase
    if (!client) { const timer=setTimeout(()=>setState('error'),0);return()=>clearTimeout(timer) }
    const hash = new URLSearchParams(location.hash.slice(1))
    const query = new URLSearchParams(location.search)
    const callbackError = query.get('error_description') || hash.get('error_description')
    if (callbackError) {
      const timer=setTimeout(()=>{setMessage(decodeURIComponent(callbackError.replace(/\+/g,' ')));setState('error')},0)
      return()=>clearTimeout(timer)
    }
    const type = query.get('type') || hash.get('type')
    const code = query.get('code')
    const tokenHash = query.get('token_hash')
    const run = async () => {
      try {
        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (tokenHash && type) {
          const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: type as 'signup' | 'recovery' | 'email' })
          if (error) throw error
        }
        const { data } = await client.auth.getSession()
        if (!data.session) throw new Error('验证链接无效或已经过期，请重新发送邮件')
        setState(type === 'recovery' ? 'recovery' : 'confirmed')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '邮箱验证失败')
        setState('error')
      }
    }
    void run()
  }, [])
  const update = async () => {
    const client = supabase
    if (!client || password.length < 8) return
    setBusy(true); setMessage('')
    try {
      const { error } = await client.auth.updateUser({ password })
      if (error) throw error
      setState('confirmed'); setMessage('密码已更新，请继续进入同频')
    } catch (error) { setMessage(error instanceof Error ? error.message : '密码更新失败') }
    finally { setBusy(false) }
  }
  const enter = () => { const url = new URL(location.href); url.hash = ''; url.search = ''; location.replace(url.toString()) }
  return <main className="auth-callback"><section>
    {state === 'checking' ? <><LoaderCircle className="spin" /><h1>正在确认邮箱</h1><p>请稍候，不要重复打开验证链接。</p></>
      : state === 'recovery' ? <><KeyRound /><h1>设置新密码</h1><p>请输入至少 8 位的新密码，设置完成后即可登录。</p><label>新密码<input autoFocus type="password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} /></label>{message && <div className="auth-message">{message}</div>}<button className="primary" disabled={busy || password.length < 8} onClick={() => void update()}>{busy ? <LoaderCircle className="spin" /> : <KeyRound />}更新密码</button></>
      : state === 'confirmed' ? <><Check /><h1>邮箱确认成功</h1><p>{message || '账号已经可以使用，现在可以进入网站完成资料。'}</p><button className="primary" onClick={enter}><ShieldCheck />进入同频</button></>
      : <><ShieldCheck /><h1>链接无法完成验证</h1><p>{message || '链接可能已经过期或使用过。请返回网站重新登录或发送恢复邮件。'}</p><button className="secondary" onClick={enter}>返回网站</button></>}
  </section></main>
}
