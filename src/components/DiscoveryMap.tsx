import { useMemo, useState } from 'react'
import { Crosshair, Heart, LocateFixed, LockKeyhole, MapPin, Navigation, SlidersHorizontal, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import type { MatchPerson } from '../lib/profiles'

type Props={people:MatchPerson[];located:boolean;locating:boolean;radius:number;onRadius:(value:number)=>void;onLocate:()=>void;onOpen:(person:MatchPerson)=>void;onHeart:(person:MatchPerson)=>void}
export default function DiscoveryMap({people,located,locating,radius,onRadius,onLocate,onOpen,onHeart}:Props){
 const[selected,setSelected]=useState<string|undefined>(people[0]?.id)
 const shown=useMemo(()=>people.slice(0,8),[people]),active=shown.find(x=>x.id===selected)??shown[0]
 return <section className="discovery-hero">
  <div className="discovery-copy"><span className="eyebrow"><Sparkles/>LIVE DISCOVERY</span><h2>看见你与附近的人，<br/><em>如何彼此靠近。</em></h2><p>距离告诉你们相隔多远，契合度呈现价值观、兴趣与生活节奏的共振。</p><div className="discovery-actions"><button className="primary" onClick={onLocate}><LocateFixed/>{locating?'正在定位…':located?'更新我的位置':'开启附近发现'}</button><span><LockKeyhole/>仅保存约 1 公里精度的模糊位置</span></div><div className="discovery-stats"><div><b>{active?.score??96}%</b><span>最高契合</span></div><div><b>{active?.distanceKm??2.4}<small> km</small></b><span>最近距离</span></div><div><b>{shown.length||24}</b><span>附近同频</span></div></div></div>
  <div className="connection-map" aria-label="附近用户距离和契合度关系图">
   <div className="map-grid"/><div className="range-ring r1"/><div className="range-ring r2"/><div className="range-ring r3"/><span className="range-label l1">近</span><span className="range-label l2">{Math.round(radius/2)} km</span><span className="range-label l3">{radius} km</span>
   <motion.button className="map-me" animate={{scale:[1,1.04,1]}} transition={{repeat:Infinity,duration:3}} onClick={onLocate}><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120"/><i/><span>你</span></motion.button>
   {shown.map((person,index)=>{const angle=((person.bearing??index*52)-90)*Math.PI/180,distance=Math.min(.94,Math.max(.25,(person.distanceKm??(index+1)*5)/radius)),x=50+Math.cos(angle)*distance*42,y=50+Math.sin(angle)*distance*42;return <motion.button key={person.id} className={`map-person ${active?.id===person.id?'active':''}`} style={{left:`${x}%`,top:`${y}%`}} initial={{opacity:0,scale:.4}} animate={{opacity:1,scale:1}} transition={{delay:index*.08}} onClick={()=>setSelected(person.id)}><img src={person.avatar}/><b>{person.score}%</b><span>{person.distance}</span></motion.button>})}
   {!located&&<button className="map-permission" onClick={onLocate}><Navigation/><b>开启位置，点亮附近的人</b><span>我们不会展示你的精确坐标</span></button>}
   {active&&<motion.div className="map-person-card" key={active.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><img src={active.avatar}/><div><b>{active.name} · {active.age}</b><span><MapPin/>{active.distance} · {active.score}% 契合</span></div><button onClick={()=>onOpen(active)}>查看</button><button className="map-heart" onClick={()=>onHeart(active)}><Heart/></button></motion.div>}
  </div>
  <div className="radius-control"><SlidersHorizontal/><label>发现半径 <b>{radius} km</b><input type="range" min="5" max="100" step="5" value={radius} onChange={e=>onRadius(Number(e.target.value))}/></label><button onClick={onLocate}><Crosshair/>定位</button></div>
 </section>
}
