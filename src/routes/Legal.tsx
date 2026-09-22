import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import PageLoading from '../components/common/PageLoading'

const LegalDocuments = lazy(() => import('../components/LegalDocuments'))

export default function Legal() {
  return <motion.div className="page" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><Suspense fallback={<PageLoading/>}><LegalDocuments/></Suspense></motion.div>
}
