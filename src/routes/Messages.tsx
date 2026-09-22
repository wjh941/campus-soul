import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { useSearchParams } from 'react-router-dom'
import PageLoading from '../components/common/PageLoading'

const ChatPanel = lazy(() => import('../components/ChatPanel'))

export default function Messages() {
  const { session, setShowAuth } = useApp()
  const [searchParams] = useSearchParams()
  const initialMatchId = searchParams.get('matchId') ?? undefined
  return <motion.div className="page chat-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Suspense fallback={<PageLoading label="正在打开同频消息"/>}><ChatPanel session={session} initialMatchId={initialMatchId} onRequireAuth={() => setShowAuth(true)} /></Suspense></motion.div>
}
