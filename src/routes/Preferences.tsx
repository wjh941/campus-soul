import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import PageLoading from '../components/common/PageLoading'

const ExpectationStudio = lazy(() => import('../components/ExpectationStudio'))

export default function Preferences() {
  const { session, notify, setShowAuth } = useApp()
  return <motion.div className="page preference-page" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><Suspense fallback={<PageLoading label="正在打开期待工作室"/>}><ExpectationStudio session={session} onRequireAuth={()=>setShowAuth(true)} onSaved={()=>notify('期待已保存')}/></Suspense></motion.div>
}
