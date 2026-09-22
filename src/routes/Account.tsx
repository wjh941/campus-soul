import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import PageLoading from '../components/common/PageLoading'

const AccountCenter = lazy(() => import('../components/AccountCenter'))

export default function Account() {
  const { session, profileBundle, go } = useApp()
  return <motion.div className="page" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><Suspense fallback={<PageLoading/>}><AccountCenter session={session} isAdmin={profileBundle?.profile.is_admin??false} onAdmin={()=>go('admin')}/></Suspense></motion.div>
}
