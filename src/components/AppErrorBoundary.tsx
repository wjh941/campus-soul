import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, ShieldAlert, Trash2 } from 'lucide-react'

type Props={children:ReactNode}
type State={failed:boolean;chunkFailure:boolean;message:string}
export default class AppErrorBoundary extends Component<Props,State>{
 state:State={failed:false,chunkFailure:false,message:''}
 static getDerivedStateFromError(error:Error){return{failed:true,chunkFailure:/chunk|dynamically imported|loading css/i.test(error.message),message:error.message}}
 componentDidCatch(error:Error,info:ErrorInfo){console.error('App render failed',error,info)}
 private recover=async()=>{if(this.state.chunkFailure&&'serviceWorker'in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.map(item=>item.update().catch(()=>undefined)))}window.location.reload()}
 private reset=async()=>{if('caches'in window){const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('tongpin-')).map(key=>caches.delete(key)))}if('serviceWorker'in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.map(item=>item.unregister()))}window.location.reload()}
 render(){if(!this.state.failed)return this.props.children;return <main className="fatal-state"><ShieldAlert/><h1>{this.state.chunkFailure?'发现版本资源不一致':'页面暂时没有加载成功'}</h1><p>{this.state.chunkFailure?'通常是网站刚更新但浏览器仍缓存旧资源，刷新即可恢复。':'你的账号数据不会丢失。页面遇到了显示异常，可先清理缓存恢复。'}</p>{this.state.message&&<details className="fatal-detail"><summary>查看错误详情</summary><code>{this.state.message}</code></details>}<div className="fatal-actions"><button className="primary" onClick={()=>void this.recover()}><RefreshCw/>重新加载</button><button className="secondary" onClick={()=>void this.reset()}><Trash2/>清理缓存并恢复</button></div></main>}
}
