import { useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Check, LoaderCircle, ShieldCheck, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useDialogLifecycle } from '../hooks/useDialogLifecycle'

type Props = { session: Session; onAccepted: () => void; onClose: () => void; required?: boolean }
export default function LegalModal({ session, onAccepted, onClose, required = false }: Props) {
  const [birthday, setBirthday] = useState('')
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dialog=useDialogLifecycle<HTMLDivElement>(onClose,{escape:!required})
  const submit = async () => {
    if (!supabase || !birthday || !terms || !privacy) return
    setBusy(true)
    const { error: submitError } = await supabase.rpc('accept_legal', { birthday })
    setBusy(false)
    if (submitError) return setError(submitError.message)
    onAccepted()
  }
  const maxBirthday = useMemo(() => { const date = new Date(); date.setFullYear(date.getFullYear() - 18); return date.toISOString().slice(0, 10) }, [])
  return <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} onMouseDown={e=>{if(!required&&e.target===e.currentTarget)onClose()}}>
    <div ref={dialog} tabIndex={-1} className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
      {!required && <button className="modal-close" aria-label="关闭年龄与协议确认" onClick={onClose}><X /></button>}
      <ShieldCheck className="legal-icon" /><span className="section-kicker">SAFE & RESPONSIBLE</span>
      <h2 id="legal-modal-title">欢迎来到「同频」18+ 社区</h2><p>为了保护每一次真实连接，请确认年龄并了解社区基本规则。</p>
      <div className="legal-points"><span><b>仅限成年人</b>你必须已满 18 周岁</span><span><b>真诚与尊重</b>禁止骚扰、仇恨与欺诈行为</span><span><b>隐私由你掌控</b>认证材料不会公开展示</span></div>
      <label>出生日期<input type="date" max={maxBirthday} value={birthday} onChange={e => setBirthday(e.target.value)} /></label>
      <label className="legal-check"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} /><span>我已阅读并同意《同频服务条款》和《社区行为准则》</span></label>
      <label className="legal-check"><input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} /><span>我已阅读并同意《隐私政策》，理解个人信息处理方式</span></label>
      {error && <div className="auth-message">{error}</div>}
      <button className="primary legal-submit" disabled={busy || !birthday || !terms || !privacy} onClick={() => void submit()}>{busy ? <LoaderCircle className="spin" /> : <Check />}确认并继续</button><small>账户：{session.user.email}</small>
    </div>
  </motion.div>
}
