import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Search, Sparkles, User, X } from 'lucide-react'
import { safeStorage } from '../lib/resilience'

type Person={id:string|number;name:string;school:string;major:string;tags:string[];avatar:string}
type Page={id:string;label:string}
type Props={people:Person[];pages:Page[];onPerson:(id:string|number)=>void;onPage:(id:string)=>void}
type Item={key:string;kind:'page'|'person';page?:Page;person?:Person}

export default function GlobalSearch({people,pages,onPerson,onPage}:Props){
 const[open,setOpen]=useState(false)
 const[query,setQuery]=useState('')
 const[active,setActive]=useState(0)
 const[recent,setRecent]=useState<string[]>(()=>{try{return JSON.parse(safeStorage.get('tongpin-searches')||'[]')}catch{return[]}})
 const input=useRef<HTMLInputElement>(null)
 const trigger=useRef<HTMLButtonElement>(null)
 const normalized=query.trim().toLowerCase()
 const peopleResults=useMemo(()=>normalized?people.filter(p=>[p.name,p.school,p.major,...p.tags].some(v=>v.toLowerCase().includes(normalized))).slice(0,6):[],[normalized,people])
 const pageResults=useMemo(()=>normalized?pages.filter(p=>p.label.toLowerCase().includes(normalized)).slice(0,5):[],[normalized,pages])
 const items=useMemo<Item[]>(()=>[...pageResults.map(page=>({key:`page-${page.id}`,kind:'page' as const,page})),...peopleResults.map(person=>({key:`person-${person.id}`,kind:'person' as const,person}))],[pageResults,peopleResults])
 useEffect(()=>{const key=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setOpen(true)}else if(event.key==='Escape'&&open){setOpen(false);trigger.current?.focus()}};addEventListener('keydown',key);return()=>removeEventListener('keydown',key)},[open])
 useEffect(()=>{if(open){document.body.style.overflow='hidden';requestAnimationFrame(()=>input.current?.focus())}return()=>{document.body.style.overflow=''}},[open])
 const close=()=>{setOpen(false);trigger.current?.focus()}
 const remember=(value:string)=>{const next=[value,...recent.filter(x=>x!==value)].slice(0,5);setRecent(next);safeStorage.set('tongpin-searches',JSON.stringify(next))}
 const choose=(item:Item)=>{if(item.page){remember(item.page.label);onPage(item.page.id)}else if(item.person){remember(item.person.name);onPerson(item.person.id)}close()}
 const inputKey=(event:React.KeyboardEvent)=>{if(!items.length)return;if(event.key==='ArrowDown'){event.preventDefault();setActive(i=>(i+1)%items.length)}else if(event.key==='ArrowUp'){event.preventDefault();setActive(i=>(i-1+items.length)%items.length)}else if(event.key==='Enter'){event.preventDefault();choose(items[active])}}
 return <>
  <button ref={trigger} className="search search-trigger" onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-expanded={open}><Search/><span>搜索校园、兴趣或用户</span><kbd>⌘ K</kbd></button>
  {open&&<div className="global-search-backdrop" onClick={close} role="presentation"><section className="global-search" role="dialog" aria-modal="true" aria-label="全局搜索" onClick={event=>event.stopPropagation()}>
   <header><Search/><input ref={input} role="combobox" aria-expanded={Boolean(normalized)} aria-controls="global-search-results" aria-activedescendant={items[active]?.key} value={query} onChange={event=>{setQuery(event.target.value);setActive(0)}} onKeyDown={inputKey} placeholder="输入姓名、学校、专业、兴趣或功能"/><button onClick={close} aria-label="关闭搜索"><X/></button></header>
   {!normalized?<div className="search-empty"><Sparkles/><h3>寻找你的同频</h3><p>可以搜索“摄影”“复旦大学”“自我评测”</p>{recent.length>0&&<div className="recent-searches"><b><Clock3/>最近搜索</b>{recent.map(value=><button key={value} onClick={()=>setQuery(value)}>{value}</button>)}</div>}</div>:<div id="global-search-results" className="search-results" role="listbox">{items.map((item,index)=>item.page?<button id={item.key} role="option" aria-selected={active===index} className={active===index?'active':''} key={item.key} onMouseEnter={()=>setActive(index)} onClick={()=>choose(item)}><span className="search-result-icon"><Sparkles/></span><div><b>{item.page.label}</b><small>前往功能页面</small></div></button>:<button id={item.key} role="option" aria-selected={active===index} className={active===index?'active':''} key={item.key} onMouseEnter={()=>setActive(index)} onClick={()=>choose(item)}><img src={item.person!.avatar} alt="" loading="lazy"/><div><b>{item.person!.name}</b><small>{item.person!.school} · {item.person!.major}</small></div><span>{item.person!.tags.slice(0,2).join(' · ')}</span></button>)}{!items.length&&<div className="no-search-result"><User/><b>没有找到相关结果</b><p>换个名字、学校或兴趣试试</p></div>}</div>}
   <footer><span>↑↓ 浏览</span><span>Enter 选择</span><span>Esc 关闭</span></footer>
  </section></div>}
 </>
}
