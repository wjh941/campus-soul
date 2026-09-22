import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import PageLoading from '../components/common/PageLoading'

const DataRights = lazy(() => import('../components/DataRights'))

export default function Data() {
  const { authReady, session, go, setShowAuth } = useApp()
  return <motion.div className="page" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>{!authReady?<PageLoading label="正在确认账号状态"/>:session?<Suspense fallback={<PageLoading/>}><DataRights session={session}/></Suspense>:<div className="route-guard glass-card"><ShieldCheck/><span className="section-kicker">ACCOUNT REQUIRED</span><h2>登录后管理你的数据</h2><p>数据导出和永久注销只对当前账号本人开放。</p><button className="primary" onClick={()=>setShowAuth(true)}>登录并继续 <ArrowRight/></button><button className="secondary" onClick={()=>go('home')}>返回首页</button></div>}</motion.div>
}
