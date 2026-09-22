import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, Flag, Heart, LoaderCircle, MessageCircle, Send } from 'lucide-react'
import type { SocialPost as Post } from '../../lib/social'
import Avatar from '../common/Avatar'

export default function PostCard({ post, onLike, onComment, onDelete, onReport, onNotice, userAvatar }: { post: Post; onLike: () => void; onComment: (text: string) => Promise<void>|void; onDelete?: () => void; onReport?: () => void; onNotice?:(text:string)=>void; userAvatar:string }) {
  const [comment, setComment] = useState('')
  const [open, setOpen] = useState(post.comments.length > 0)
  const [saved,setSaved]=useState(false)
  const [commenting,setCommenting]=useState(false)
  const sendComment=async()=>{const value=comment.trim();if(!value||commenting)return;setCommenting(true);try{await onComment(value);setComment('')}catch{onNotice?.('评论发送失败，内容已保留')}finally{setCommenting(false)}}
  const share=async()=>{const text=`${post.name}：${post.text}`;try{if(navigator.share)await navigator.share({title:'同频动态',text,url:location.href});else{await navigator.clipboard.writeText(text);onNotice?.('动态内容已复制')}}catch(error){if(error instanceof Error&&error.name!=='AbortError')onNotice?.('分享失败，请稍后重试')}}
  return <motion.article layout className="post-card glass-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
    <header><Avatar src={post.avatar} size={45} online /><div><strong>{post.name}</strong><span>{post.school} · {post.time}</span></div>{onDelete?<button className="delete-post" onClick={onDelete}>删除</button>:onReport?<button className="report-post" onClick={onReport}><Flag size={14}/>举报</button>:null}</header>
    <p className="post-text">{post.text}</p><div className="tag-row">{post.tags.map(t => <span key={t}>#{t}</span>)}</div>
    {post.image && <img className="post-image" src={post.image} alt="动态配图" />}
    <div className="post-actions"><button aria-pressed={post.liked} aria-label={post.liked?'取消点赞':'点赞'} onClick={onLike} className={post.liked ? 'liked' : ''}><Heart size={19} fill={post.liked ? 'currentColor' : 'none'} />{post.likes}</button><button aria-expanded={open} onClick={() => setOpen(!open)}><MessageCircle size={19} />{post.comments.length}</button><button onClick={()=>void share()}><Send size={18} />分享</button><button className={`save ${saved?'liked':''}`} aria-pressed={saved} aria-label={saved?'取消临时收藏':'临时收藏'} onClick={()=>{setSaved(x=>!x);onNotice?.(saved?'已取消收藏':'已暂存在本设备')}}><Bookmark size={18} fill={saved?'currentColor':'none'}/></button></div>
    <AnimatePresence>{open && <motion.div className="comments" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
      {post.comments.map(c => <div className="comment" key={c.id}><Avatar src={c.avatar} size={29} /><p><strong>{c.name}</strong>{c.text}</p></div>)}
      <div className="comment-input"><Avatar src={userAvatar} size={29}/><input disabled={commenting} maxLength={500} value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();void sendComment()}}} placeholder="友善地说点什么…"/><button disabled={!comment.trim()||commenting} onClick={()=>void sendComment()}>{commenting?<LoaderCircle className="spin" size={16}/>:<Send size={16}/>}</button></div>
    </motion.div>}</AnimatePresence>
  </motion.article>
}