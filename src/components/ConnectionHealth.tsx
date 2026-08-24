import { useEffect, useState } from 'react'
import { Check, Clipboard, Cloud, RefreshCw, ShieldCheck, Wifi, WifiOff, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/resilience'

type State='checking'|'healthy'|'degraded'|'offline'
export default function ConnectionHealth(){
 const[state,setState]=useState<State>(()=>navigator.onLine?'checking':'offline'),[open,setOpen]=useState(false),[latency,setLatency]=useState<number|null>(null),[copied,setCopied]=useState(false)
 const check=async()=>{if(!navigator.onLine){setState('offline');return}if(!supabase){setState('degraded');return}setState('checking');const start=performance.now();try{await withTimeout(supabase.auth.getSession(),6000);setLatency(Math.round(performance.now()-start));setState('healthy')}catch{setLatency(null);setState('degraded')}}
 useEffect(()=>{const initial=setTimeout(()=>void check(),0);const up=()=>void check(),down=()=>setState('offline');addEventListener('online',up);addEventListener('offline',down);const timer=setInterval(()=>{if(document.visibilityState==='visible')void check()},60000);return()=>{clearTimeout(initial);removeEventListener('online',up);removeEventListener('offline',down);clearInterval(timer)}},[])
 const label={checking:'正在检测',healthy:'连接正常',degraded:'服务连接缓慢',offline:'当前离线'}[state]
 const copy=async()=>{const info=[`同频诊断 ${new Date().toISOString()}`,`页面: ${location.origin}${location.pathname}`,`网络: ${navigator.onLine?'online':'offline'}`,`服务: ${state}`,`延迟: ${latency??'unknown'}ms`,`浏览器: ${navigator.userAgent}`].join('\n');await navigator.clipboard.writeText(info);setCopied(true);setTimeout(()=>setCopied(false),1600)}
 return <><button className={`connection-pill ${state}`} onClick={()=>setOpen(true)} aria-label={`连接状态：${label}`}>{state==='offline'?<WifiOff/>:<Wifi/>}<span>{label}</span></button>{open&&<div className="health-backdrop" onClick={()=>setOpen(false)}><section className="health-panel" role="dialog" aria-modal="true" aria-label="连接健康状态" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setOpen(false)}><X/></button><div className={`health-orb ${state}`}><Cloud/></div><span className="section-kicker">CONNECTION HEALTH</span><h2>{label}</h2><p>{state==='healthy'?'网站与账号服务连接正常。':state==='offline'?'你仍可浏览已缓存的基础页面，互动功能需等待网络恢复。':'页面可以继续使用，但登录或数据同步可能较慢。'}</p><div className="health-metrics"><div><ShieldCheck/><span>隐私诊断</span><b>不包含账号与密钥</b></div><div><RefreshCw/><span>服务延迟</span><b>{latency===null?'未获取':`${latency} ms`}</b></div></div><footer><button className="secondary" onClick={()=>void copy()}>{copied?<Check/>:<Clipboard/>}{copied?'已复制':'复制诊断信息'}</button><button className="primary" onClick={()=>void check()}><RefreshCw/>重新检测</button></footer></section></div>}</>
}
