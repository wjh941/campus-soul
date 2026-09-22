import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import PageLoading from '../components/common/PageLoading'

const AnonymousChat = lazy(() => import('../components/AnonymousChat'))

export default function Anonymous() {
  const { session, setShowAuth } = useApp()
  return <motion.div className="page anonymous-page" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><Suspense fallback={<PageLoading label="正在连接匿名信号"/>}><AnonymousChat session={session} onRequireAuth={()=>setShowAuth(true)}/></Suspense></motion.div>
}
