import { useState } from 'react'
import { User } from 'lucide-react'

export default function Avatar({ src, size = 44, online = false }: { src: string; size?: number; online?: boolean }) {
  const [failed,setFailed]=useState(false)
  return <div className="avatar-wrap" style={{ width: size, height: size }}>{failed?<span className="avatar-fallback"><User/></span>:<img className="avatar" src={src} alt="头像" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>} {online && <span className="online" />}</div>
}