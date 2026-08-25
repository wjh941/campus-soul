import { useEffect, useState } from 'react'
import { Check, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/resilience'

type State = 'checking' | 'confirmed' | 'recovery' | 'error'
export default function AuthCallback() {
  const initial = new URLSearchParams(location.search)
  const [state, setState] = useState<State>('checking')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const recoveryRequested = initial.get('type') === 'recovery'
  useEffect(() => {
    const client = supabase
    let alive = true
    const finish = (next: State, text = '') => { if (alive) { setState(next); setMessage(text) } }
    const timer = window.setTimeout(() => finish('error', '验证服务响应超时。请返回网站重新发送一封最新邮件。'), 15000)
    const run = async () => {
      if (!client) return finish('error', '认证服务尚未配置')
      const hash = new URLSearchParams(location.hash.slice(1))
      const query = new URLSearchParams(location.search)
      const callbackError = query.get('error_description') || hash.get('error_description')
      if (callbackError) return finish('error', decodeURIComponent(callbackError.replace(/\+/g, ' ')))
      const type = query.get('type') || hash.get('type')
      try {
        const code = query.get('code')
        const tokenHash = query.get('token_hash')
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')
        if (code) {
          const { error } = await withTimeout(client.auth.exchangeCodeForSession(code), 10000, '邮箱验证请求超时')
          if (error) throw error
        } else if (tokenHash && type) {
          const { error } = await withTimeout(client.auth.verifyOtp({ token_hash: tokenHash, type: type as 'signup' | 'recovery' | 'email' }), 10000, '邮箱验证请求超时')
          if (error) throw error
        } else if (accessToken && refreshToken) {
          const { error } = await withTimeout(client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }), 10000, '登录会话建立超时')
          if (error) throw error
        }
        const { data } = await withTimeout(client.auth.getSession(), 8000, '登录状态确认超时')
        if (!data.session) throw new Error('邮件链接缺少有效登录凭证，可能已经使用或过期')
        finish(type === 'recovery' || recoveryRequested ? 'recovery' : 'confirmed')
      } catch (error) { finish('error', error instanceof Error ? error.message : '邮箱验证失败') }
    }
    void run().finally(() => clearTimeout(timer))
    return () => { alive = false; clearTimeout(timer) }
  }, [recoveryRequested])
  const update = async () => {
    const client = supabase
    if (!client || password.length < 8) return
    setBusy(true); setMessage('')
    try {
      const { error } = await withTimeout(client.auth.updateUser({ password }), 10000, '密码更新请求超时')
      if (error) throw error
      setState('confirmed'); setMessage('密码已更新，请继续进入同频')
    } catch (error) { setMessage(error instanceof Error ? error.message : '密码更新失败') }
    finally { setBusy(false) }
  }
  const enter = () => { const url = new URL(location.href); url.hash = ''; url.search = ''; location.replace(url.toString()) }
  return <main className="auth-callback"><section aria-live="polite">
    {state === 'checking' ? <><LoaderCircle className="spin" /><h1>正在确认邮箱</h1><p>通常只需几秒。如果超过15秒，将提供重新操作入口。</p></>
      : state === 'recovery' ? <><KeyRound /><h1>设置新密码</h1><p>请输入至少8位的新密码，设置完成后即可登录。</p><label>新密码<input autoFocus type="password" minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label>{message && <div className="auth-message">{message}</div>}<button className="primary" disabled={busy || password.length < 8} onClick={() => void update()}>{busy ? <LoaderCircle className="spin" /> : <KeyRound />}更新密码</button></>
      : state === 'confirmed' ? <><Check /><h1>操作成功</h1><p>{message || '邮箱已经确认，账号现在可以使用。'}</p><button className="primary" onClick={enter}><ShieldCheck />进入同频</button></>
      : <><ShieldCheck /><h1>链接无法完成验证</h1><p>{message}</p><button className="secondary" onClick={enter}>返回网站重新发送</button></>}
  </section></main>
}
