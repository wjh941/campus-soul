import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { ArrowRight, Sparkles } from 'lucide-react'
import PageLoading from '../components/common/PageLoading'

const AssessmentCenter = lazy(() => import('../components/AssessmentExperience'))

export default function Assessment() {
  const { session, notify, go, setShowAuth } = useApp()
  return <motion.div className="page" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>{session?<Suspense fallback={<PageLoading label="正在打开自我评测"/>}><AssessmentCenter session={session} onSaved={()=>{notify('自我评测已保存，匹配已更新');go('matches')}}/></Suspense>:<div className="assessment-locked"><Sparkles/><h2>登录后开始自我评测</h2><p>完成评测后，我们会根据你的性格、生活节奏和关系期待生成更透明的匹配分析。</p><button className="primary" onClick={()=>setShowAuth(true)}>登录并开始评测 <ArrowRight/></button></div>}</motion.div>
}
