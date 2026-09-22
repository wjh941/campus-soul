import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { ChevronRight, LoaderCircle, WifiOff } from 'lucide-react'
import { people } from '../lib/demo'
import type { MatchPerson } from '../lib/profiles'
import MatchCard from '../components/discovery/MatchCard'
import PostCard from '../components/moments/PostCard'

const DailyPulse = lazy(() => import('../components/DailyPulse'))
const ChoiceCompass = lazy(() => import('../components/ChoiceCompass'))
const WaitlistCard = lazy(() => import('../components/WaitlistCard'))
const DiscoveryMap = lazy(() => import('../components/DiscoveryMap'))

export default function Discovery() {
  const { notify, go, session, posts, userAvatar, dataMode, matchPeople, locationEnabled, locationUpdatedAt, locating, discoveryRadius, nearbyPeople, turnOffLocation, updateRadius, locateAndDiscover, heartPerson, like, comment, removePost, flagPost, setSelectedPerson, setInsightPerson } = useApp()
  const discoveryPeople: MatchPerson[] = dataMode==='real' && nearbyPeople.length ? nearbyPeople : dataMode==='demo' ? matchPeople.slice(0,8).map(person => 'userId' in person ? person : {...person,id:String(person.id),userId:'',reasons:['兴趣方向彼此呼应','生活节奏相近'],verified:false,distanceKm:Number.parseFloat(person.distance)||2.4,bearing:(Number(person.id)*67)%360}) : []
  const dailyPulse=<Suspense fallback={<div className="discovery-loading"><LoaderCircle className="spin" /></div>}><DailyPulse userId={session?.user.id} people={dataMode==='real'?matchPeople.filter((person):person is MatchPerson=>'userId' in person):[]} onOpen={person=>setSelectedPerson(person)} onOpenAssessment={()=>go('assessment')} onNotice={notify}/></Suspense>
  return <motion.div className="page discovery-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{dailyPulse}<Suspense fallback={null}><ChoiceCompass userId={session?.user.id} onNotice={notify} onOpenMatches={()=>go('matches')}/></Suspense>{!session&&<Suspense fallback={null}><WaitlistCard/></Suspense>}<Suspense fallback={<div className="discovery-loading"><LoaderCircle className="spin"/></div>}><DiscoveryMap people={discoveryPeople} demo={dataMode!=='real' || !session} located={locationEnabled} locating={locating} radius={discoveryRadius} updatedAt={locationUpdatedAt} onDisable={turnOffLocation} onRadius={updateRadius} onLocate={()=>void locateAndDiscover()} onOpen={setSelectedPerson} onHeart={person=>void heartPerson(person)}/></Suspense><section className="section-head"><div><span className="section-kicker">DAILY PICKS</span><h2>今日心动推荐</h2></div><button onClick={() => go('matches')}>查看全部 <ChevronRight size={17} /></button></section>{dataMode==='demo'&&<div className="demo-content-note"><WifiOff/>演示数据 · 上海校园场景示例 · 不代表真实用户或附近位置</div>}{dataMode==='unavailable'&&<div className="demo-content-note"><WifiOff/>暂无可用的真实推荐。请完善资料或稍后重试，当前不会展示演示人物。</div>}<div className="match-grid">{(dataMode==='demo'?people.slice(0,3):dataMode==='real'?matchPeople.slice(0,3):[]).map(p => <MatchCard key={p.id} person={p} demo={dataMode!=='real' || !session} onOpen={() => setSelectedPerson(p)} onHeart={()=>heartPerson(p)} onInsight={'userId' in p && 'reasons' in p ? () => setInsightPerson(p as unknown as MatchPerson) : undefined} />)}</div><section className="section-head moment-title"><div><span className="section-kicker">CAMPUS MOMENTS</span><h2>同频的人，此刻在做什么</h2></div><button onClick={() => go('moments')}>进入广场 <ChevronRight size={17} /></button></section><div className="home-feed">{posts.slice(0, 2).map(p => <PostCard key={p.id} post={p} onLike={() => like(p.id)} onComment={t => comment(p.id, t)} onDelete={('authorId' in p && p.authorId===session?.user.id)?()=>void removePost(p.id):undefined} onReport={('authorId' in p && p.authorId!==session?.user.id)?()=>void flagPost(p.id):undefined} onNotice={notify} userAvatar={userAvatar}/>)}</div></motion.div>
}
