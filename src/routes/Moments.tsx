import { motion } from 'framer-motion'
import { ImagePlus, MessageCircle, Send, ShieldCheck, Users, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { people } from '../lib/demo'
import Avatar from '../components/common/Avatar'
import Composer from '../components/moments/Composer'
import PostCard from '../components/moments/PostCard'

export default function Moments() {
  const { session, notify, posts, matchPeople, userAvatar, addPost, like, comment, removePost, flagPost, setSelectedPerson, setShowAuth, showComposer, setShowComposer } = useApp()
  return <motion.div className="page moments-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><div className="feed-column">{showComposer?<Composer onPost={addPost} authenticated={Boolean(session) || !isSupabaseConfigured} avatar={userAvatar} onClose={()=>setShowComposer(false)}/>:<button className="open-composer primary" onClick={()=>session||!isSupabaseConfigured?setShowComposer(true):setShowAuth(true)}><ImagePlus/>发布一条同频动态<Send/></button>}<div className="feed-tabs"><button className="active">最新动态</button></div>{posts.length?posts.map(p => <PostCard key={p.id} post={p} onLike={() => like(p.id)} onComment={t => comment(p.id, t)} onDelete={('authorId' in p && p.authorId===session?.user.id)?()=>void removePost(p.id):undefined} onReport={('authorId' in p && p.authorId!==session?.user.id)?()=>void flagPost(p.id):undefined} onNotice={notify} userAvatar={userAvatar}/>):<div className="match-empty glass-card"><MessageCircle/><h3>还没有真实动态</h3><p>发布第一条内容，或稍后回来看看。</p></div>}</div><aside className="right-rail"><div className="rail-card"><h3><Users size={18} />{session?'当前推荐':'功能预览'}</h3>{(session?matchPeople:people).slice(0, 3).map(p => <div className="mini-person" key={p.id}><Avatar src={p.avatar} size={38} /><div><b>{p.name}</b><span>{p.school}</span></div><button onClick={()=>setSelectedPerson(p)}>查看</button></div>)}</div><div className="rail-card"><h3><Zap size={18} />社区话题</h3>{['# 分享真实的此刻','# 最近单曲循环','# 周末搭子计划'].map((x,i)=><div className="trend" key={x}><b>0{i+1}</b><span>{x}<small>话题建议</small></span></div>)}</div><div className="safety-card"><ShieldCheck /><div><b>同频安全中心</b><p>真实高校认证 · 隐私保护</p></div></div></aside></motion.div>
}
