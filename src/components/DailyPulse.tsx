import { useState } from 'react'
import { ArrowRight, Check, Clock3, Compass, Sparkles } from 'lucide-react'
import { safeStorage } from '../lib/resilience'
const prompts=['今天什么时刻让你觉得自己被理解？','如果周末突然空出一天，你会怎么安排？','最近有什么小事让你恢复了能量？','你希望别人更了解你的哪一面？','最近一次让你会心一笑的瞬间是什么？','理想的陪伴，对你来说是什么样的？','最近有什么值得推荐给同频的人？']
const options=['记录给自己','分享给同频的人','先想一想']
export default function DailyPulse({onOpenAssessment,onNotice}:{onOpenAssessment:()=>void;onNotice:(text:string)=>void}){
 const[day]=useState(()=>Math.floor(Date.now()/86400000)),[answer,setAnswer]=useState(()=>safeStorage.get(`tongpin-daily-${Math.floor(Date.now()/86400000)}`)||'')
 const saved=Boolean(answer),prompt=prompts[day%prompts.length],key=`tongpin-daily-${day}`,week=Math.floor(day/7)
 const save=(value:string)=>{setAnswer(value);safeStorage.set(key,value);onNotice('今日同频回答已保存，仅保存在本设备')}
 return <section className="daily-retention"><div className="daily-prompt"><header><span><Sparkles/>TODAY IN TUNING</span><small><Clock3/>今日问题</small></header><h2>{prompt}</h2><p>花一分钟记录真实感受，它会帮助你更了解自己的关系节奏。</p><div className="daily-actions">{options.map(option=><button type="button" className={answer===option?'selected':''} aria-pressed={answer===option} onClick={()=>save(option)} key={option}>{answer===option&&<Check/>}{option}</button>)}</div>{saved&&<div className="daily-saved"><Check/>已记录今天的回答</div>}</div><aside className="weekly-insight"><div className="weekly-orb"><Compass/></div><span className="section-kicker">WEEK {week%52+1} REFLECTION</span><h3>本周关系自我观察</h3><p>完成评测并留下几次真实回答，生成属于你的沟通节奏与关系需要小结。</p><button type="button" onClick={onOpenAssessment}>查看我的分析<ArrowRight/></button></aside></section>
}
