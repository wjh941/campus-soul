import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Search, Sparkles, User, X } from 'lucide-react'

type Person={id:string|number;name:string;school:string;major:string;tags:string[];avatar:string}
type Page={id:string;label:string}
type Props={people:Person[];pages:Page[];onPerson:(id:string|number)=>void;onPage:(id:string)=>void}
export default function GlobalSearch({people,pages,onPerson,onPage}:Props){
 const[open,setOpen]=useState(false),[query,setQuery]=useState(''),[recent,setRecent]=useState<string[]>(()=>JSON.parse(localStorage.getItem('tongpin-searches')||'[]'))
 const input=useRef<HTMLInputElement>(null)
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setOpen(true)}if(e.key==='Escape')setOpen(false)};addEventListener('keydown',key);return()=>removeEventListener('keydown',key)},[])
 useEffect(()=>{if(open)setTimeout(()=>input.current?.focus(),0)},[open])
 const normalized=query.trim().toLowerCase()
 const results=useMemo(()=>normalized?people.filter(p=>[p.name,p.school,p.major,...p.tags].some(v=>v.toLowerCase().includes(normalized))).slice(0,6):[],[normalized,people])
 const pageResults=useMemo(()=>normalized?pages.filter(p=>p.label.toLowerCase().includes(normalized)).slice(0,5):[],[normalized,pages])
 const remember=(value:string)=>{const next=[value,...recent.filter(x=>x!==value)].slice(0,5);setRecent(next);localStorage.setItem('tongpin-searches',JSON.stringify(next))}
 const choosePerson=(person:Person)=>{remember(person.name);onPerson(person.id);setOpen(false)}
 const choosePage=(page:Page)=>{remember(page.label);onPage(page.id);setOpen(false)}
 return <><button className="search search-trigger" onClick={()=>setOpen(true)}><Search/><span>搜索校园、兴趣或用户</span><kbd>⌘ K</kbd></button>{open&&<div className="global-search-backdrop" onClick={()=>setOpen(false)}><section className="global-search" onClick={e=>e.stopPropagation()}><header><Search/><input ref={input} value={query} onChange={e=>setQuery(e.target.value)} placeholder="输入姓名、学校、专业、兴趣或功能"/><button onClick={()=>setOpen(false)}><X/></button></header>{!normalized?<div className="search-empty"><Sparkles/><h3>寻找你的同频</h3><p>可以搜索“摄影”“复旦大学”“自我评测”</p>{recent.length>0&&<div className="recent-searches"><b><Clock3/>最近搜索</b>{recent.map(x=><button key={x} onClick={()=>setQuery(x)}>{x}</button>)}</div>}</div>:<div className="search-results">{pageResults.map(page=><button key={page.id} onClick={()=>choosePage(page)}><span className="search-result-icon"><Sparkles/></span><div><b>{page.label}</b><small>前往功能页面</small></div></button>)}{results.map(person=><button key={person.id} onClick={()=>choosePerson(person)}><img src={person.avatar} alt="" loading="lazy"/><div><b>{person.name}</b><small>{person.school} · {person.major}</small></div><span>{person.tags.slice(0,2).join(' · ')}</span></button>)}{!results.length&&!pageResults.length&&<div className="no-search-result"><User/><b>没有找到相关结果</b><p>换个名字、学校或兴趣试试</p></div>}</div>}<footer><span>↑↓ 浏览</span><span>Enter 选择</span><span>Esc 关闭</span></footer></section></div>}</>
}
