import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, ShieldAlert } from 'lucide-react'

type Props={children:ReactNode}
type State={failed:boolean}
export default class AppErrorBoundary extends Component<Props,State>{
 state:State={failed:false}
 static getDerivedStateFromError(){return{failed:true}}
 componentDidCatch(error:Error,info:ErrorInfo){console.error('App render failed',error,info)}
 render(){if(!this.state.failed)return this.props.children;return <main className="fatal-state"><ShieldAlert/><h1>页面暂时没有加载成功</h1><p>你的账号数据不会丢失。请检查网络后重新打开页面。</p><button className="primary" onClick={()=>window.location.reload()}><RefreshCw/>重新加载</button></main>}
}
