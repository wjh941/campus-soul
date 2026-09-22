import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import PageLoading from '../components/common/PageLoading'

const AdminPanel = lazy(() => import('../components/AdminPanel'))

export default function Admin() {
  const { authReady, session, profileBundle, go, setShowAuth } = useApp()
  return <motion.div className="page" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>{!authReady||session&&!profileBundle?<PageLoading label="正在验证管理权限"/>:profileBundle?.profile.is_admin?<Suspense fallback={<PageLoading/>}><AdminPanel/></Suspense>:<div className="route-guard glass-card"><ShieldCheck/><span className="section-kicker">RESTRICTED AREA</span><h2>此区域仅对审核管理员开放</h2><p>{session?'当前账号没有平台审核权限。':'请使用具备审核权限的账号登录。'}</p>{!session&&<button className="primary" onClick={()=>setShowAuth(true)}>管理员登录 <ArrowRight/></button>}<button className="secondary" onClick={()=>go('account')}>返回关系与安全</button></div>}</motion.div>
}
