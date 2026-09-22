import { Sparkles } from 'lucide-react'

export default function PageLoading({label='正在加载内容'}:{label?:string}){return <div className="premium-loader" role="status" aria-live="polite"><div className="loader-orbit"><i/><i/><Sparkles/></div><b>{label}</b><span>正在为你准备更好的体验</span><div className="loader-lines" aria-hidden="true"><i/><i/><i/></div></div>}