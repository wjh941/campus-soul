import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import PageLoading from '../components/common/PageLoading'

const MembershipCenter = lazy(() => import('../components/MembershipCenter'))

export default function Membership() {
  const { session, setShowAuth } = useApp()
  return <motion.div className="page" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><Suspense fallback={<PageLoading label="正在加载会员权益"/>}><MembershipCenter session={session} onRequireAuth={()=>setShowAuth(true)}/></Suspense></motion.div>
}
