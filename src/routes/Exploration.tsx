import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import PageLoading from '../components/common/PageLoading'

const SelfExploration = lazy(() => import('../components/SelfExploration'))

export default function Exploration() {
  const { session, notify, go } = useApp()
  return <motion.div className="page" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><Suspense fallback={<PageLoading label="正在打开探索工作室"/>}><SelfExploration userId={session?.user.id} onResult={result=>notify(`已生成「${result.title}」：先看看你的关系线索，再决定是否注册`)} onOpenMatches={()=>go('matches')} /></Suspense></motion.div>
}
