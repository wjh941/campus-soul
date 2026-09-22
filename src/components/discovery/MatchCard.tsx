import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Heart, LoaderCircle, MapPin, Sparkles } from 'lucide-react'
import type { Person } from '../../lib/demo'

export default function MatchCard({ person, onOpen, onInsight, onHeart, demo = false }: { person: Person; onOpen: () => void; onInsight?: () => void; onHeart?:()=>Promise<void>; demo?: boolean }) {
  const [heartBusy,setHeartBusy]=useState(false)
  return <motion.article className={`match-card ${demo?'demo-match-card':''}`} whileHover={{ y: -7 }} transition={{ type: 'spring', stiffness: 260 }} onClick={onOpen} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpen()}}} role="button" tabIndex={0} aria-label={`查看${person.name}的资料，${person.score>=80?'高契合':'匹配线索'}`}>
    <div className="match-photo"><img src={person.avatar} alt={person.name} /><div className="score-orbit"><b>{person.score>=80?'高契合':'匹配线索'}</b><span>仅供认识</span></div><button className="floating-heart" disabled={demo||heartBusy} aria-label={demo?'演示资料，登录后可发送心动':`向${person.name}发送心动`} onClick={async e=>{e.stopPropagation();if(!onHeart||heartBusy)return;setHeartBusy(true);try{await onHeart()}finally{setHeartBusy(false)}}}>{heartBusy?<LoaderCircle className="spin" size={17}/>:<Heart size={19} />}</button></div>
    <div className="match-content"><div className="person-title"><h3>{person.name}<span>{person.age}</span></h3><span className="distance"><MapPin size={13} />{person.distance}</span></div><p className="school-line"><GraduationCap size={15} />{person.school} · {person.major}</p><p className="quote">“{person.quote}”</p>{onInsight&&<button className="insight-link" onClick={e=>{e.stopPropagation();onInsight()}}><Sparkles size={12}/>查看匹配分析</button>}<div className="tag-row">{person.tags.map(t => <span key={t}>{t}</span>)}</div><div className="mini-bars">{['价值观', '兴趣', '生活节奏'].map((x, i) => <div key={x}><span>{x}</span><i><b style={{ width: `${person.dimensions[i]}%`, background: person.color }} /></i></div>)}</div></div>
  </motion.article>
}