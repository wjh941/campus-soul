import { useCallback, useEffect, useState } from 'react'
import { Ban, Check, Flag, LoaderCircle, Search, ShieldCheck, X } from 'lucide-react'
import { adminSearchUsers, fetchAdminQueue, getEvidenceUrl, moderateTarget, resolveReport, reviewVerification } from '../lib/account'

type Queue = Awaited<ReturnType<typeof fetchAdminQueue>>

export default function AdminPanel() {
  const [data, setData] = useState<Queue>({ verifications: [], reports: [] })
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<Awaited<ReturnType<typeof adminSearchUsers>>>([])
  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await fetchAdminQueue()) } finally { setLoading(false) }
  }, [])
  useEffect(() => { window.setTimeout(() => void load(), 0) }, [load])
  const decide = async (id: string, decision: 'approved' | 'rejected') => {
    await reviewVerification(id, decision)
    await load()
  }
  return <div className="admin-panel">
    <div className="admin-summary">
      <div><ShieldCheck /><span><b>{data.verifications.filter(x => x.status === 'pending').length}</b>待审认证</span></div>
      <div><Flag /><span><b>{data.reports.filter(x => x.status === 'pending').length}</b>待处理举报</span></div>
    </div>
    <section className="admin-card"><h2>用户搜索与处罚</h2><label className="admin-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索昵称或邮箱"/><button onClick={async()=>setUsers(await adminSearchUsers(query))}>搜索</button></label>{users.map(user=><div className="admin-row" key={user.id}><div><b>{user.nickname}</b><span>{user.email} · {user.life_stage} · {user.city||'未填写城市'}</span></div><em>{user.account_status}</em><button onClick={async()=>{await moderateTarget(user.id,null,'mute','管理员操作',24);setUsers(await adminSearchUsers(query))}}>禁言24h</button><button onClick={async()=>{await moderateTarget(user.id,null,'suspend','管理员操作');setUsers(await adminSearchUsers(query))}}>暂停</button><button className="danger-action" onClick={async()=>{await moderateTarget(user.id,null,'ban','严重违反社区规则');setUsers(await adminSearchUsers(query))}}><Ban/>封禁</button></div>)}</section>
    <section className="admin-card"><h2>身份认证队列</h2>
      {loading ? <LoaderCircle className="spin" /> : data.verifications.map(item => <div className="admin-row" key={item.id}>
        <div><b>{item.organization}</b><span>{item.verification_type} · {item.contact_email}</span></div><em>{item.status}</em>
        {item.evidence_url&&<button onClick={async()=>window.open(await getEvidenceUrl(item.evidence_url!),'_blank')}>查看材料</button>}{item.status === 'pending' && <><button className="approve" onClick={() => void decide(item.id, 'approved')}><Check />通过</button><button onClick={() => void decide(item.id, 'rejected')}><X />拒绝</button></>}
      </div>)}
    </section>
    <section className="admin-card"><h2>举报审核</h2>{data.reports.map(item => <div className="admin-row" key={item.id}><div><b>{item.reason}</b><span>{item.details || '无补充说明'} · {new Date(item.created_at).toLocaleDateString()}</span></div><em>{item.status}</em>{item.status==='pending'&&<><button onClick={async()=>{if(item.target_user_id)await moderateTarget(item.target_user_id,null,'warn','举报审核警告');await resolveReport(item.id,'resolved');await load()}}>警告并处理</button><button onClick={async()=>{if(item.target_user_id)await moderateTarget(item.target_user_id,null,'mute','举报审核禁言',24);await resolveReport(item.id,'resolved');await load()}}>禁言24h</button><button onClick={async()=>{await resolveReport(item.id,'dismissed');await load()}}>驳回</button></>}</div>)}</section>
  </div>
}
