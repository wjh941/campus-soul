import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, ImagePlus, LoaderCircle, Send, Upload, X } from 'lucide-react'
import { safeStorage } from '../../lib/resilience'
import Avatar from '../common/Avatar'

export default function Composer({ onPost, authenticated, avatar, onClose }: { onPost: (text: string, image?: File) => Promise<void>; authenticated: boolean; avatar:string; onClose:()=>void }) {
  const [text, setText] = useState(()=>safeStorage.get('tongpin-post-draft')??'')
  const [image, setImage] = useState<File>()
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [error,setError]=useState(''),[preview,setPreview]=useState(false)
  useEffect(()=>{if(text)safeStorage.set('tongpin-post-draft',text);else safeStorage.remove('tongpin-post-draft')},[text])
  const chooseImage=(file?:File)=>{setError('');if(!file)return setImage(undefined);if(file.size>5*1024*1024)return setError('动态图片不能超过 5 MB');if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return setError('仅支持 JPG、PNG、WebP 或 GIF');setImage(file)}
  const submit = async () => {
    if (!text.trim() || busy) return
    setBusy(true)
    try { await onPost(text.trim(), image); setText('');setError('');setImage(undefined);if(fileRef.current)fileRef.current.value='' } catch(e){setError(e instanceof Error?e.message:'发布失败，草稿已保留')} finally { setBusy(false) }
  }
  return <section className="composer-page"><header><div><span className="section-kicker">CREATE A MOMENT</span><h2>分享此刻的同频信号</h2><p>真实、轻松地记录今天。发布前你可以先预览内容。</p></div><button className="composer-close secondary" type="button" onClick={onClose}><X/>取消</button></header><div className="composer glass-card"><Avatar src={avatar} size={45} /><div className="composer-main">{preview?<div className="composer-preview"><span>发布预览</span><p>{text||'还没有输入内容'}</p>{image&&<small>📎 {image.name}</small>}</div>:<textarea value={text} maxLength={2000} onChange={e => setText(e.target.value)} placeholder={authenticated ? '此刻，你想和大家分享什么？' : '登录后发布真实同频动态'} />}{image && <div className="image-chip"><Upload size={13} /><span>{image.name}</span><button aria-label="移除已选择的图片" onClick={() => {setImage(undefined);if(fileRef.current)fileRef.current.value=''}}><X size={13}/></button></div>}{error&&<div className="composer-error">{error}</div>}<div className="composer-tools"><div><button type="button" className="preview-toggle" onClick={()=>setPreview(x=>!x)}>{preview?<EyeOff size={17}/>:<Eye size={17}/>} {preview?'返回编辑':'预览'}</button><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => chooseImage(e.target.files?.[0])} /><button onClick={() => fileRef.current?.click()}><ImagePlus size={18} />图片</button></div><button className="primary small" disabled={!text.trim() || busy} onClick={submit}>{busy ? <LoaderCircle className="spin" size={15} /> : <>发布 <Send size={15} /></>}</button></div></div></div><small className="composer-note">发布后内容会进入同频动态，其他用户可以点赞、评论或举报。</small>{text&&<small className="composer-draft-status" role="status">草稿已自动保存</small>}</section>
}