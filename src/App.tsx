import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, ChevronRight, Compass, Heart, Home, ImagePlus, MapPin, MessageCircle, PawPrint,
  Search, Send, ShieldCheck, SlidersHorizontal, Sparkles, User,
  Users, X, Zap, GraduationCap, Coffee, BookOpen, Check, ArrowRight,
  Quote, Bookmark, Settings, Camera, LogIn, LogOut, LoaderCircle, Upload, WifiOff, Moon, Sun, Target, Flag, Ban, PanelLeftClose, PanelLeftOpen, ChevronDown, LifeBuoy, VenetianMask, Eye, EyeOff, LockKeyhole
} from 'lucide-react'
import { supabase } from './lib/supabase'
import { createComment, createPost, deletePost, fetchSocialPosts, isSupabaseConfigured, reportPost, togglePostLike } from './lib/social'
import { sendHeart } from './lib/messaging'
import { friendlyError, safeStorage, withTimeout } from './lib/resilience'
import { useDialogLifecycle } from './hooks/useDialogLifecycle'
import { blockUser, fetchIntelligentMapped, fetchMatches, fetchNearbyMatches, fetchProfileBundle, reportUser, saveApproximateLocation, saveProfile, type MatchPerson, type ProfileBundle } from './lib/profiles'
import './App.css'

const DailyPulse = lazy(() => import('./components/DailyPulse'))
const ChoiceCompass = lazy(() => import('./components/ChoiceCompass'))
const ChatPanel = lazy(() => import('./components/ChatPanel'))
const ProfileEditor = lazy(() => import('./components/ProfileEditor'))
const AccountCenter = lazy(() => import('./components/AccountCenter'))
const AdminPanel = lazy(() => import('./components/AdminPanel'))
const LegalModal = lazy(() => import('./components/LegalModal'))
const NotificationPanel = lazy(() => import('./components/NotificationPanel'))
const LegalDocuments = lazy(() => import('./components/LegalDocuments'))
const DataRights = lazy(() => import('./components/DataRights'))
const DiscoveryMap = lazy(() => import('./components/DiscoveryMap'))
const AnonymousChat = lazy(() => import('./components/AnonymousChat'))
const AssessmentCenter = lazy(() => import('./components/AssessmentExperience'))
const ExpectationStudio = lazy(() => import('./components/ExpectationStudio'))
const SelfExploration = lazy(() => import('./components/SelfExploration'))
const MatchInsights = lazy(() => import('./components/MatchInsights'))
const PwaControls = lazy(() => import('./components/PwaControls'))
const GlobalSearch = lazy(() => import('./components/GlobalSearch'))
const ConnectionHealth = lazy(() => import('./components/ConnectionHealth'))
const MembershipCenter = lazy(()=>import('./components/MembershipCenter'))
const WaitlistCard=lazy(()=>import('./components/WaitlistCard'))

type View = 'home' | 'exploration' | 'matches' | 'preferences' | 'assessment' | 'moments' | 'anonymous' | 'messages' | 'membership' | 'account' | 'legal' | 'data' | 'admin' | 'profile'
const views:View[]=['home','exploration','matches','preferences','assessment','moments','anonymous','messages','membership','account','legal','data','admin','profile']
const viewFromUrl=():View=>{const value=new URLSearchParams(location.search).get('view');return views.includes(value as View)?value as View:'home'}
type Comment = { id: string | number; name: string; avatar: string; text: string }
type Post = {
  id: string | number; authorId?: string; name: string; avatar: string; school: string; time: string; text: string;
  image?: string; tags: string[]; likes: number; liked: boolean; comments: Comment[]
}

const people = [
  { id: 1, name: '林知夏', age: 21, school: '同济大学', major: '建筑学', score: 96, distance: '1.2km', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop', tags: ['INFJ', '胶片摄影', '城市漫游'], quote: '想和有趣的人，把普通日子过成限定版。', color: '#ff715b', dimensions: [98, 94, 91] },
  { id: 2, name: '陈予安', age: 22, school: '复旦大学', major: '新闻传播', score: 92, distance: '3.8km', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop', tags: ['ENFP', 'Livehouse', '网球'], quote: '世界很大，愿我们都保有出发的勇气。', color: '#7c5cff', dimensions: [95, 89, 92] },
  { id: 3, name: '顾南乔', age: 20, school: '华东师范大学', major: '心理学', score: 89, distance: '5.1km', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop', tags: ['INTJ', '话剧', '小动物'], quote: '真诚是永远的必杀技。', color: '#34b991', dimensions: [91, 88, 87] },
  { id: 4, name: '周屿', age: 23, school: '上海交通大学', major: '工业设计', score: 87, distance: '6.4km', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop', tags: ['ISFP', '攀岩', '设计'], quote: '在旷野里，寻找生活的另一种解法。', color: '#2f8cff', dimensions: [88, 86, 91] },
]

const seedPosts: Post[] = [
  { id: 1, name: '林知夏', avatar: people[0].avatar, school: '同济大学', time: '18分钟前', text: '在武康路拐进一条没走过的小巷，遇见了一家只放爵士乐的旧书店。城市的惊喜，大概就藏在“不按计划”里。', image: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=1000&auto=format&fit=crop', tags: ['城市漫游', '今日份浪漫'], likes: 128, liked: false, comments: [{ id: 1, name: '陈予安', avatar: people[1].avatar, text: '求店名！周末也想去坐一下午 📖' }] },
  { id: 2, name: '陈予安', avatar: people[1].avatar, school: '复旦大学', time: '1小时前', text: '“年轻时，我们彼此相爱却浑然不知。” 看完《流浪的月》，在草坪上发了好久的呆。最近你们在读什么？', tags: ['书影音', '寻找同频'], likes: 76, liked: true, comments: [{ id: 1, name: '顾南乔', avatar: people[2].avatar, text: '最近在重读《悉达多》，每个阶段看都有新感受。' }, { id: 2, name: '周屿', avatar: people[3].avatar, text: '这句也太适合初夏了。' }] },
  { id: 3, name: '顾南乔', avatar: people[2].avatar, school: '华东师范大学', time: '昨天 22:14', text: '第一次做陶，杯子歪歪扭扭，但手掌记住了泥土的温度。接受不完美，也是很重要的课题吧。', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1000&auto=format&fit=crop', tags: ['生活碎片', '手作'], likes: 203, liked: false, comments: [] },
]

type NavItem={id:View;label:string;icon:typeof Home;badge?:string;step?:string;featured?:boolean}
type NavGroup={label:string;hint:string;items:NavItem[]}
const navGroups:NavGroup[] = [
  { label: '同频旅程', hint:'认识自己，再遇见彼此', items: [
    { id: 'home' as View, label: '发现', icon: Home },
    { id: 'assessment' as View, label: '3 分钟自测', icon: Sparkles },
    { id: 'exploration' as View, label: '探索结果', icon: PawPrint },
    { id: 'preferences' as View, label: '设置匹配偏好', icon: Target },
    { id: 'matches' as View, label: '查看我的匹配', icon: Heart, step:'03', featured:true },
  ]},
  { label: '互动空间', hint:'动态、匿名与真实连接', items: [
    { id: 'moments' as View, label: '同频动态', icon: Compass },
    { id: 'anonymous' as View, label: '匿名相遇', icon: VenetianMask },
    { id: 'messages' as View, label: '消息', icon: MessageCircle },
  ]},
  { label: '我的同频', hint:'资料与会员权益', items: [
    { id: 'profile' as View, label: '我的主页', icon: User },
    { id: 'membership' as View, label: '会员与支持', icon: Coffee },
  ]},
  { label: '安全与帮助', hint:'关系管理和平台规则', items: [
    { id: 'account' as View, label: '关系与安全', icon: ShieldCheck },
    { id: 'legal' as View, label: '信任中心', icon: BookOpen },
  ]},
]
const mobileNav = navGroups.flatMap(group => group.items).filter(item => ['home','matches','moments','messages','profile'].includes(item.id))

function PageLoading({label='正在加载内容'}:{label?:string}){return <div className="premium-loader" role="status" aria-live="polite"><div className="loader-orbit"><i/><i/><Sparkles/></div><b>{label}</b><span>正在为你准备更好的体验</span><div className="loader-lines" aria-hidden="true"><i/><i/><i/></div></div>}
function GuestActivation({onExplore,onAuth}:{onExplore:()=>void;onAuth:()=>void}){return <section className="guest-activation glass-card" aria-label="首次使用引导"><div className="guest-activation-copy"><span className="section-kicker"><Sparkles size={14}/> FIRST 3 MINUTES</span><h2>先用 3 道题，看看你会遇见怎样的同频。</h2><p>无需先填写完整资料。完成轻量自测后，再决定是否注册和开启附近发现。</p><div className="guest-trust"><span><ShieldCheck size={15}/>仅面向 18+ 用户</span><span><LockKeyhole size={15}/>资料和位置可控</span><span><Ban size={15}/>可随时屏蔽举报</span><span><User size={15}/>不公开邮箱</span></div></div><div className="guest-activation-actions"><button className="primary" type="button" onClick={onExplore}>开始 3 分钟自测 <ArrowRight size={16}/></button><button className="secondary" type="button" onClick={onAuth}>已有账号，直接登录</button></div></section>}
function GuestAgeGate({onAccept}:{onAccept:()=>void}){return <div className="guest-age-gate" role="dialog" aria-modal="true" aria-labelledby="guest-age-title"><div className="guest-age-card"><ShieldCheck className="guest-age-icon"/><span className="section-kicker">18+ COMMUNITY</span><h2 id="guest-age-title">先确认你已满 18 周岁</h2><p>同频面向成年用户。确认后才能浏览演示人物和社交内容；注册时还会再次进行年龄与协议确认。</p><div className="guest-age-points"><span><LockKeyhole size={15}/>邮箱不会公开展示</span><span><Ban size={15}/>可随时屏蔽和举报</span><span><MapPin size={15}/>不会展示精确位置</span></div><button className="primary" type="button" onClick={onAccept}>我已满 18 周岁，继续浏览</button><small>未满 18 周岁请离开此页面。</small></div></div>}

function Avatar({ src, size = 44, online = false }: { src: string; size?: number; online?: boolean }) {
  const [failed,setFailed]=useState(false)
  return <div className="avatar-wrap" style={{ width: size, height: size }}>{failed?<span className="avatar-fallback"><User/></span>:<img className="avatar" src={src} alt="头像" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>} {online && <span className="online" />}</div>
}

type Person = typeof people[0] | MatchPerson
function MatchCard({ person, onOpen, onInsight, onHeart, demo = false }: { person: Person; onOpen: () => void; onInsight?: () => void; onHeart?:()=>Promise<void>; demo?: boolean }) {
  const [heartBusy,setHeartBusy]=useState(false)
  return <motion.article className={`match-card ${demo?'demo-match-card':''}`} whileHover={{ y: -7 }} transition={{ type: 'spring', stiffness: 260 }} onClick={onOpen} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpen()}}} role="button" tabIndex={0} aria-label={`查看${person.name}的资料，${person.score>=80?'高契合':'匹配线索'}`}>
    <div className="match-photo"><img src={person.avatar} alt={person.name} /><div className="score-orbit"><b>{person.score>=80?'高契合':'匹配线索'}</b><span>仅供认识</span></div><button className="floating-heart" disabled={demo||heartBusy} aria-label={demo?'演示资料，登录后可发送心动':`向${person.name}发送心动`} onClick={async e=>{e.stopPropagation();if(!onHeart||heartBusy)return;setHeartBusy(true);try{await onHeart()}finally{setHeartBusy(false)}}}>{heartBusy?<LoaderCircle className="spin" size={17}/>:<Heart size={19} />}</button></div>
    <div className="match-content"><div className="person-title"><h3>{person.name}<span>{person.age}</span></h3><span className="distance"><MapPin size={13} />{person.distance}</span></div><p className="school-line"><GraduationCap size={15} />{person.school} · {person.major}</p><p className="quote">“{person.quote}”</p>{onInsight&&<button className="insight-link" onClick={e=>{e.stopPropagation();onInsight()}}><Sparkles size={12}/>查看匹配分析</button>}<div className="tag-row">{person.tags.map(t => <span key={t}>{t}</span>)}</div><div className="mini-bars">{['价值观', '兴趣', '生活节奏'].map((x, i) => <div key={x}><span>{x}</span><i><b style={{ width: `${person.dimensions[i]}%`, background: person.color }} /></i></div>)}</div></div>
  </motion.article>
}

function Composer({ onPost, authenticated, avatar, onClose }: { onPost: (text: string, image?: File) => Promise<void>; authenticated: boolean; avatar:string; onClose:()=>void }) {
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

function PostCard({ post, onLike, onComment, onDelete, onReport, onNotice, userAvatar }: { post: Post; onLike: () => void; onComment: (text: string) => Promise<void>|void; onDelete?: () => void; onReport?: () => void; onNotice?:(text:string)=>void; userAvatar:string }) {
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

function ProfileModal({ person, onClose, onHeart, onReport, onBlock }: { person: Person; onClose: () => void; onHeart: () => Promise<void>; onReport: () => Promise<void>; onBlock: () => Promise<void> }) {
  const [sending, setSending] = useState(false)
  const dialog=useDialogLifecycle<HTMLDivElement>(onClose)
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><motion.div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${person.name} 的资料`} className="profile-modal" initial={{ scale: .92, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .94, opacity: 0 }} onClick={e => e.stopPropagation()}><button className="modal-close" aria-label="关闭资料" onClick={onClose}><X/></button><div className="modal-cover"><img src={person.avatar} alt="" /><div className="modal-gradient" /><div className="modal-name">{('verified'in person&&person.verified)&&<span className="verified"><ShieldCheck size={15} />身份已认证</span>}<h2>{person.name}, {person.age}</h2><p><GraduationCap size={16} />{person.school} · {person.major}</p></div></div><div className="modal-body"><div className="match-summary"><div className="big-score">{person.score>=80?'高契合':'匹配线索'}</div><div><h3>{person.score>=85?'你们很有可能同频':person.score>=70?'值得进一步了解':'一次新的相遇'}</h3><p>{'analysis'in person?'基于多维资料与关系偏好计算':'当前为基础资料契合度预览'}</p></div></div><div className="why-match"><h3>为什么推荐 TA</h3><div className="reason-grid">{('reasons'in person&&person.reasons.length?person.reasons:['兴趣方向可能彼此呼应','关系期待存在共同点']).slice(0,4).map((reason,index)=><div key={reason}><span>{['🌙','💬','🧭','🎧'][index]}</span><b>{reason}</b><p>{'topics'in person&&person.topics?.[index]?`可以从“${person.topics[index]}”聊起`:'匹配理由来自双方公开资料与偏好'}</p></div>)}</div></div><div className="profile-safety-actions"><button onClick={() => void onReport()}><Flag size={14} />举报</button><button onClick={() => void onBlock()}><Ban size={14} />屏蔽</button></div><div className="modal-actions"><button className="secondary" onClick={onClose}><X size={18} />暂时略过</button><button className="primary" disabled={sending} onClick={async () => { setSending(true); try { await onHeart() } finally { setSending(false) } }}>{sending ? <LoaderCircle className="spin" size={18} /> : <Heart size={18} fill="currentColor" />}发送心动</button></div></div></motion.div></motion.div>
}

type OnboardingProfile={nickname:string;birthYear:number;school:string;major:string;grade:string}
function Onboarding({ onClose, onSave, initial }: { onClose: () => void; initial?:Partial<OnboardingProfile>; onSave?: (traits: string[], frequency: number,profile:OnboardingProfile) => Promise<void> }) {
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<string[]>(['真诚', '有边界感'])
  const [frequency, setFrequency] = useState(55)
  const [saving, setSaving] = useState(false)
  const [profile,setProfile]=useState<OnboardingProfile>({nickname:initial?.nickname??'',birthYear:initial?.birthYear??2003,school:initial?.school??'',major:initial?.major??'',grade:initial?.grade??''})
  const traits = ['真诚', '有边界感', '情绪稳定', '热爱生活', '有行动力', '幽默', '温柔', '保持好奇']
  return <motion.div className="modal-backdrop onboarding-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="onboarding" initial={{ scale: .96 }} animate={{ scale: 1 }}><button type="button" className="modal-close" aria-label="关闭画像设置" onClick={onClose}><X /></button><div className="onboard-side"><div className="brand light"><span><Sparkles size={19} /></span>同频</div><div><span className="eyebrow light-text">SOUL MAPPING</span><h2>不是寻找完美的人，<br />而是遇见真实的彼此。</h2><p>科学维度只是相遇的起点，真诚才是故事的开始。</p></div><div className="side-quote"><Quote size={20} /><p>所有好的关系，都始于一次勇敢的自我表达。</p></div></div><div className="onboard-main"><div className="progress-head"><span>建立你的同频画像</span><b>{step} / 3</b></div><div className="progress-track"><i style={{ width: `${step * 33.33}%` }} /></div>{step === 1 && <motion.div className="step-content" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}><span className="step-icon"><User /></span><h2>先认识一下你</h2><p>这些信息帮助我们找到更适合你的校园伙伴</p><div className="form-grid"><label>你的昵称<input required maxLength={30} value={profile.nickname} onChange={e=>setProfile({...profile,nickname:e.target.value})}/></label><label>出生年份<input type="number" min="1940" max={new Date().getFullYear()-18} value={profile.birthYear} onChange={e=>setProfile({...profile,birthYear:Number(e.target.value)})}/></label><label className="full">所在学校<input required maxLength={80} placeholder="学校或教育机构" value={profile.school} onChange={e=>setProfile({...profile,school:e.target.value})}/></label><label>专业<input maxLength={80} value={profile.major} onChange={e=>setProfile({...profile,major:e.target.value})}/></label><label>年级<input maxLength={30} placeholder="例如 大三" value={profile.grade} onChange={e=>setProfile({...profile,grade:e.target.value})}/></label></div></motion.div>}{step === 2 && <motion.div className="step-content" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}><span className="step-icon"><Sparkles /></span><h2>你更看重什么？</h2><p>选择 2–5 个你期待对方拥有的特质</p><div className="trait-grid">{traits.map(t => <button className={selected.includes(t) ? 'selected' : ''} onClick={() => setSelected(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t])} key={t}>{selected.includes(t) && <Check size={16} />}{t}</button>)}</div><label className="range-label"><span><b>理想的相处频率</b><small>每个人都有自己的舒适节奏</small></span><input type="range" value={frequency} onChange={e => setFrequency(Number(e.target.value))} /><div className="range-marks"><span>各自精彩</span><span>保持联系</span><span>时常陪伴</span></div></label></motion.div>}{step === 3 && <motion.div className="step-content final-step" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}><div className="success-orbit"><Sparkles /><i /><i /></div><h2>你的同频画像已生成</h2><p>我们找到了 <b>24 位</b> 值得认识的校园伙伴</p><div className="result-chips"><span>成长型关系</span><span>慢热但真诚</span><span>高共情力</span></div><div className="privacy-note"><ShieldCheck /><div><b>隐私由你掌控</b><p>你的详细答案不会直接展示给其他人</p></div></div></motion.div>}<div className="step-actions">{step > 1 && <button className="text-btn" onClick={() => setStep(s => s - 1)}>上一步</button>}<button className="primary" disabled={saving} onClick={async () => { if(step===1&&(!profile.nickname.trim()||!profile.school.trim()))return;if (step < 3) return setStep(s => s + 1); setSaving(true); try { await onSave?.(selected, frequency,profile); onClose() } finally { setSaving(false) } }}>{saving ? <LoaderCircle className="spin" size={17} /> : step < 3 ? <>继续 <ArrowRight size={17} /></> : <>查看我的匹配 <Sparkles size={17} /></>}</button></div></div></motion.div></motion.div>
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [school, setSchool] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) return setMessage('请先配置 Supabase 环境变量')
    setBusy(true); setMessage('')
    try {
      const result = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options:{data:{nickname,school},emailRedirectTo:new URL(`${import.meta.env.BASE_URL}?auth=callback`,location.origin).toString()} })
      if (result.error) { const raw=result.error.message; const friendly=raw.toLowerCase().includes('user already registered')?'这个邮箱已经注册过，请切换到“登录”。':raw.toLowerCase().includes('email')&&raw.toLowerCase().includes('confirm')?'邮箱确认功能未完成，请检查验证邮件或让管理员在 Supabase Auth 中关闭邮箱确认。':raw.toLowerCase().includes('rate limit')?'注册请求过于频繁，请稍后再试。':raw; return setMessage(friendly) }
      if (mode === 'register' && !result.data.session) return setMessage('账号已创建，但需要先完成邮箱验证。请检查收件箱、垃圾邮件，点击验证链接后再切换到“登录”。')
      onClose()
    } catch (error) { setMessage(error instanceof Error ? error.message : '认证服务暂时不可用，请稍后重试') } finally { setBusy(false) }
  }
  return <motion.div className="modal-backdrop auth-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.div className="auth-modal" initial={{ y: 25, scale: .96 }} animate={{ y: 0, scale: 1 }} onClick={e => e.stopPropagation()}><button type="button" className="modal-close" aria-label="关闭登录窗口" onClick={onClose}><X /></button><div className="auth-art"><div className="brand light"><span><Sparkles size={19} /></span>同频</div><div><span className="eyebrow light-text">TONGPIN 18+</span><h2>让值得的相遇，<br />从真实开始。</h2><p>高校身份 · 安全社区 · 深度匹配</p></div><div className="auth-proof"><ShieldCheck /><span><b>隐私优先</b>你的邮箱不会公开展示</span></div></div><form className="auth-form" onSubmit={submit}><span className="section-kicker">WELCOME TO TONGPIN</span><h2>{mode === 'login' ? '欢迎回来' : '创建同频账号'}</h2><p>{mode === 'login' ? '登录后继续探索真实的校园连接' : '使用校园邮箱，开始建立你的同频画像'}</p>{mode === 'register' && <><label>昵称<input value={nickname} onChange={e => setNickname(e.target.value)} required maxLength={30} placeholder="大家怎么称呼你" /></label><label>学校<input value={school} onChange={e => setSchool(e.target.value)} required maxLength={80} placeholder="你所在的大学" /></label></>}<label>邮箱<input type="email" value={email} onChange={e => setEmail(e.target.value.trim())} required placeholder="name@example.com" /></label><label>密码<input type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required placeholder="至少 6 位字符" /></label>{message && <div className="auth-message">{message}</div>}<button className="primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <>{mode === 'login' ? '登录' : '注册账号'} <ArrowRight size={17} /></>}</button>{mode==='login'&&<button type="button" className="auth-recovery" disabled={busy||!email} onClick={async()=>{if(!supabase)return;setBusy(true);setMessage('');const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:new URL(`${import.meta.env.BASE_URL}?auth=callback&type=recovery`,location.origin).toString()});setBusy(false);setMessage(error?error.message:'密码恢复邮件已发送，请检查收件箱和垃圾邮件。')}}>忘记密码？发送恢复邮件</button>}<div className="auth-switch">{mode === 'login' ? '还没有账号？' : '已经注册？'}<button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>{mode === 'login' ? '立即注册' : '返回登录'}</button></div>{!isSupabaseConfigured && <div className="demo-notice"><WifiOff size={16} /><span><b>当前是演示模式</b>配置 .env.local 后即可使用真实账户</span></div>}</form></motion.div></motion.div>
}

function App() {
  const [view, setView] = useState<View>(viewFromUrl)
  const [posts, setPosts] = useState(seedPosts)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [matchPeople, setMatchPeople] = useState<Person[]>(people)
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchFilter,setMatchFilter]=useState<'selected'|'high'|'school'>('selected')
  const [profileBundle, setProfileBundle] = useState<ProfileBundle>()
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [showLegal, setShowLegal] = useState(false)
  const [guestAgeConfirmed, setGuestAgeConfirmed] = useState(() => safeStorage.get('tongpin-guest-age-confirmed') === 'yes')
  const [showNotifications, setShowNotifications] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => safeStorage.get('tongpin-sidebar') === 'collapsed')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [navOpen,setNavOpen]=useState<Record<string,boolean>>(()=>Object.fromEntries(navGroups.map(group=>[group.label,true])))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuButtonRef=useRef<HTMLButtonElement>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [locating, setLocating] = useState(false)
  const [discoveryRadius, setDiscoveryRadius] = useState(50)
  const [nearbyPeople, setNearbyPeople] = useState<MatchPerson[]>([])
  useEffect(() => { safeStorage.set('tongpin-sidebar', sidebarCollapsed ? 'collapsed' : 'expanded') }, [sidebarCollapsed])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady,setAuthReady]=useState(!isSupabaseConfigured)
   const [authError,setAuthError]=useState(false),[authAttempt,setAuthAttempt]=useState(0)
  const [showAuth, setShowAuth] = useState(false)
  const [toast, setToast] = useState('')
  const [online, setOnline] = useState(() => navigator.onLine)
  const toastTimer=useRef<number|undefined>(undefined)
  const syncRef = useRef<{userId:string;promise:Promise<void>}|null>(null)
  const [insightPerson, setInsightPerson] = useState<(MatchPerson & { analysis?: Record<string, number>; topics?: string[] }) | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (safeStorage.get('campus-theme') as 'light' | 'dark') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const title = useMemo(() => ({ home: profileBundle?.profile.nickname?`你好，${profileBundle.profile.nickname}`:'欢迎来到同频', exploration:'探索内心', matches: '为你找到的同频', preferences: '按偏好推荐', moments: '同频动态', assessment: '自我评测', anonymous: '匿名相遇', messages: '同频消息', membership:'会员与支持', account: '关系与安全', legal: '信任与安全中心', data: '数据与账号', admin: '平台审核', profile: '我的同频空间' })[view], [view,profileBundle?.profile.nickname])
  useEffect(() => { document.documentElement.dataset.theme = theme; safeStorage.set('campus-theme', theme) }, [theme])
  useEffect(() => {
    const press = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('button:not(:disabled),[role="button"]:not([aria-disabled="true"])')
      if (!target) return
      const rect = target.getBoundingClientRect()
      target.style.setProperty('--ripple-x', `${event.clientX - rect.left}px`)
      target.style.setProperty('--ripple-y', `${event.clientY - rect.top}px`)
      target.classList.remove('ripple-active')
      void target.offsetWidth
      target.classList.add('ripple-active')
      window.setTimeout(() => target.classList.remove('ripple-active'), 480)
    }
    document.addEventListener('pointerdown', press, { passive: true })
    return () => document.removeEventListener('pointerdown', press)
  }, [])
  useEffect(()=>{const pop=()=>setView(viewFromUrl());addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop)},[])
  useEffect(()=>{document.title=`${title} · 同频`;const url=new URL(location.href);if(view==='home')url.searchParams.delete('view');else url.searchParams.set('view',view);history.replaceState({view},'',url)},[title,view])
  useEffect(()=>{const up=()=>{setOnline(true);window.dispatchEvent(new CustomEvent('tongpin:reconnected'))},down=()=>setOnline(false);addEventListener('online',up);addEventListener('offline',down);return()=>{removeEventListener('online',up);removeEventListener('offline',down)}},[])
  const notify = (text: string) => { if(toastTimer.current)clearTimeout(toastTimer.current);setToast(text);toastTimer.current=window.setTimeout(() => setToast(''), 2600) }
  useEffect(()=>()=>{if(toastTimer.current)clearTimeout(toastTimer.current)},[])
  const syncProfileAndMatches = (userId: string) => {
    if(syncRef.current?.userId===userId)return syncRef.current.promise
    const promise=(async()=>{setMatchesLoading(true);try { const [bundle, matches, intelligent] = await withTimeout(Promise.all([fetchProfileBundle(userId), fetchMatches(), fetchIntelligentMapped().catch(() => [])]),12000,'匹配数据加载超时，已保留演示内容'); setProfileBundle(bundle); setShowLegal(!bundle.profile.accepted_terms_at || !bundle.profile.birth_date); setMatchPeople(intelligent.length ? intelligent : matches.length ? matches : people) } catch (error) { notify(friendlyError(error,'真实匹配加载失败')); setMatchPeople(current=>current.length?current:people) } finally { setMatchesLoading(false) }})()
    syncRef.current={userId,promise};void promise.finally(()=>{if(syncRef.current?.promise===promise)syncRef.current=null});return promise
  }
  const syncPosts = async (userId?: string) => {
    if (!isSupabaseConfigured) return
    try { const remote = await withTimeout(fetchSocialPosts(userId),10000,'动态加载超时，已显示本地内容'); setPosts(remote) } catch (error) { notify(friendlyError(error,'动态加载失败')) }
  }
  useEffect(() => {
    if (!supabase) return
    withTimeout(supabase.auth.getSession(),8000,'登录状态读取超时').then(({ data }) => { setAuthReady(true);setAuthError(false);setSession(data.session); if (data.session) { void syncPosts(data.session.user.id); void syncProfileAndMatches(data.session.user.id) } }).catch(()=>{setAuthReady(true);setAuthError(true);setSession(null)})
    const client=supabase
    const { data } = client.auth.onAuthStateChange((event, nextSession) => { setAuthReady(true);setSession(nextSession); if(event==='SIGNED_OUT')notify('登录状态已失效，请重新登录');if (nextSession) window.setTimeout(() => { void syncPosts(nextSession.user.id); void syncProfileAndMatches(nextSession.user.id) }, 0) })
    const reconnect=()=>{void client.auth.getSession().then(({data:current})=>{if(current.session){void syncPosts(current.session.user.id);void syncProfileAndMatches(current.session.user.id);notify('网络已恢复，数据已重新同步')}})};addEventListener('tongpin:reconnected',reconnect)
    return () => {data.subscription.unsubscribe();removeEventListener('tongpin:reconnected',reconnect)}
  }, [authAttempt])
  const requireUser = () => { if (!session?.user) { setShowAuth(true); return null } return session.user }
  const addPost = async (text: string, image?: File) => {
    const user = requireUser()
    if (isSupabaseConfigured && user) { try { await createPost(user, text, image); await syncPosts(user.id); setShowComposer(false); notify('动态发布成功') } catch (error) { const message = error instanceof Error ? error.message : '发布失败'; notify(message); throw error instanceof Error ? error : new Error(message) }; return }
    if (isSupabaseConfigured) return
    setPosts(p => [{ id: Date.now(), name: '小满', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop', school: '上海大学', time: '刚刚', text, tags: ['我的此刻'], likes: 0, liked: false, comments: [] }, ...p]); notify('演示动态已发布')
  }
  const flagPost = async (id:string|number) => { const user=requireUser();if(!user)return;try{await reportPost(String(id),'不恰当的动态内容');notify('动态举报已提交')}catch(error){notify(error instanceof Error?error.message:'举报失败')} }
  const removePost = async (id: string | number) => { const user=requireUser();if(!user)return;try{await deletePost(String(id),user.id);setPosts(x=>x.filter(p=>p.id!==id));notify('动态已删除')}catch(error){notify(error instanceof Error?error.message:'删除失败')} }
  const like = async (id: string | number) => { const current = posts.find(p => p.id === id); if (!current) return; if (isSupabaseConfigured) { const user = requireUser(); if (!user) return; try { await togglePostLike(String(id), user.id, current.liked) } catch (error) { return notify(error instanceof Error ? error.message : '操作失败') } } setPosts(ps => ps.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)) }
  const comment = async (id: string | number, text: string) => { if (isSupabaseConfigured) { const user = requireUser(); if (!user) return; try { await createComment(String(id), user.id, text); await syncPosts(user.id) } catch (error) { const message = error instanceof Error ? error.message : '评论失败'; notify(message); throw error instanceof Error ? error : new Error(message) }; return } setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: [...p.comments, { id: Date.now(), name: '小满', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop', text }] } : p)) }
  const signOut = async () => { await supabase?.auth.signOut(); setSession(null);setProfileBundle(undefined);setMatchPeople(people);setPosts(seedPosts);if(['data','admin','account','profile','messages'].includes(view))go('home');notify('已安全退出') }
  const safetyPerson = async (person: Person, action: 'report' | 'block') => {
    const user = requireUser(); const targetId = 'userId' in person ? person.userId : undefined; if (!user || !targetId) return notify('展示资料无法执行此操作')
    try { if (action === 'block') { await blockUser(targetId); setMatchPeople(items => items.filter(item => !('userId' in item) || item.userId !== targetId)); notify(`已屏蔽 ${person.name}`) } else { await reportUser(user.id, targetId, '不恰当的个人资料'); notify('举报已提交，我们会尽快审核') } setSelectedPerson(null) } catch (error) { notify(error instanceof Error ? error.message : '操作失败') }
  }
  const locateAndDiscover = async () => { const user=requireUser();if(!user)return;if(!navigator.geolocation)return notify('当前浏览器不支持地理定位');setLocating(true);navigator.geolocation.getCurrentPosition(async position=>{try{await saveApproximateLocation(position.coords.latitude,position.coords.longitude,Math.round(position.coords.accuracy));setLocationEnabled(true);setNearbyPeople(await fetchNearbyMatches(discoveryRadius));notify('附近发现已开启，仅保存模糊位置')}catch(error){notify(error instanceof Error?error.message:'附近发现开启失败')}finally{setLocating(false)}},error=>{setLocating(false);notify(error.code===1?'你没有允许位置权限，可随时在浏览器设置中开启':'暂时无法获取位置')},{enableHighAccuracy:false,timeout:10000,maximumAge:300000}) }
  const updateRadius = (value:number) => {setDiscoveryRadius(value);if(locationEnabled)void fetchNearbyMatches(value).then(setNearbyPeople).catch(error=>notify(error instanceof Error?error.message:'附近推荐更新失败'))}
  const heartPerson = async (person: Person) => {
    const user = requireUser(); if (!user) return
    const targetId = 'userId' in person ? person.userId : undefined
    if (!targetId) { notify('该用户是展示资料，真实用户注册后即可发送心动'); setSelectedPerson(null); return }
    try { const result = await sendHeart(targetId); notify(result.matched ? `你和${person.name}互相心动了！` : `已向${person.name}发送心动`); if (result.matched) go('messages'); setSelectedPerson(null) } catch (error) { notify(error instanceof Error ? error.message : '发送心动失败') }
  }

  useEffect(()=>{const query=matchMedia('(max-width:760px)'),close=()=>{if(!query.matches)setMobileMenuOpen(false)};if(query.addEventListener)query.addEventListener('change',close);else query.addListener(close);return()=>{if(query.removeEventListener)query.removeEventListener('change',close);else query.removeListener(close)}},[])
  useEffect(()=>{if(!mobileMenuOpen)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMobileMenuOpen(false);menuButtonRef.current?.focus();return}if(event.key==='Tab'){const sidebar=document.getElementById('app-sidebar');const items=sidebar?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}};requestAnimationFrame(()=>document.querySelector<HTMLElement>('#app-sidebar .mobile-close')?.focus());addEventListener('keydown',close);const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{removeEventListener('keydown',close);document.body.style.overflow=previous}},[mobileMenuOpen])
  const closeMobileMenu=()=>{setMobileMenuOpen(false);menuButtonRef.current?.focus()}
  const go = (target: View) => { if(target!==view){const url=new URL(location.href);if(target==='home')url.searchParams.delete('view');else url.searchParams.set('view',target);history.pushState({view:target},'',url);setView(target)}setMobileMenuOpen(false);setProfileMenuOpen(false);window.scrollTo({top:0,behavior:'smooth'}) }
  const userAvatar = profileBundle?.profile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop'
  const ownPosts=session?posts.filter(post=>'authorId'in post&&post.authorId===session.user.id):[]
  const profile=profileBundle?.profile
  const profileChecks=profile?[profile.avatar_url,profile.nickname,profile.school,profile.major,profile.city,profile.bio,profile.birth_year,profile.gender,profile.personality,profile.interests.length,profile.relationship_values.length,profile.ideal_date]:[]
  const profileCompletion=profile?Math.round(profileChecks.filter(Boolean).length/profileChecks.length*100):0
  const missingProfile=Math.ceil((100-profileCompletion)/Math.max(1,Math.round(100/profileChecks.length)))
  const filteredMatches=useMemo(()=>matchFilter==='high'?matchPeople.filter(person=>person.score>=80):matchFilter==='school'&&profile?matchPeople.filter(person=>person.school===profile.school):matchPeople,[matchPeople,matchFilter,profile])
  const discoveryPeople:MatchPerson[] = nearbyPeople.length ? nearbyPeople : matchPeople.slice(0,8).map(person => 'userId' in person ? person : {...person,id:String(person.id),userId:'',reasons:['兴趣方向彼此呼应','生活节奏相近'],verified:false,distanceKm:Number.parseFloat(person.distance)||2.4,bearing:(Number(person.id)*67)%360})
  const dailyPulse=<Suspense fallback={null}><DailyPulse people={matchPeople.map(person=>'userId' in person?person:{...person,id:String(person.id),userId:'',reasons:['兴趣方向彼此呼应','生活节奏相近'],verified:false})} onOpen={person=>setSelectedPerson(person)} onOpenAssessment={()=>go('assessment')} onNotice={notify}/></Suspense>
  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}><a className="skip-link" href="#main-content">跳转到主内容</a>
    <aside id="app-sidebar" className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="主导航">
      <div className="sidebar-head"><button className="brand" onClick={() => go('home')} aria-label="返回首页"><span><Sparkles size={18} /></span><div><b>同频</b><small>REAL CONNECTIONS</small></div></button><button className="collapse-toggle" onClick={() => setSidebarCollapsed(x => !x)} aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}>{sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button><button className="mobile-close" onClick={closeMobileMenu} aria-label="关闭菜单"><X /></button></div>
      <div className="sidebar-scroll"><div className="journey-status"><span><Sparkles/></span><div><b>同频旅程</b><small>从了解自己开始</small></div><i><em style={{width:`${view==='assessment'?'34%':view==='exploration'?'50%':view==='preferences'?'67%':view==='matches'?'100%':'12%'}`}}/></i></div>{navGroups.map(group => {const active=group.items.some(item=>item.id===view),open=sidebarCollapsed||navOpen[group.label]!==false;return <section className={`nav-group ${open?'open':'closed'} ${active?'has-active':''}`} key={group.label}><button className="nav-group-toggle" aria-expanded={open} onClick={()=>setNavOpen(current=>({...current,[group.label]:!open}))}><span><b>{group.label}</b><small>{group.hint}</small></span><ChevronDown/></button><nav aria-label={group.label}>{group.items.map(item => <button title={sidebarCollapsed ? item.label : undefined} aria-current={view === item.id ? 'page' : undefined} key={item.id} className={`${view === item.id ? 'active' : ''} ${item.featured?'featured':''}`} onClick={() => go(item.id)}><span className="nav-icon"><item.icon size={19} /></span><span className="nav-label">{item.label}</span>{item.badge && <em>{item.badge}</em>}</button>)}</nav></section>})}</div>
      <div className="sidebar-bottom"><button className="side-extra" onClick={() => session ? go('data') : setShowAuth(true)}><Settings size={18}/><span>数据与账号</span></button><button className="side-extra" onClick={() => go('legal')}><LifeBuoy size={18}/><span>帮助与条款</span></button><div className="side-profile-wrap"><button className="side-profile" onClick={() => setProfileMenuOpen(x => !x)} aria-expanded={profileMenuOpen}><Avatar src={userAvatar} size={38} online={Boolean(session)} /><div><b>{profileBundle?.profile.nickname || session?.user.user_metadata.nickname || '访客'}</b><span>{profileBundle?.profile.life_stage || (session ? '已登录' : '演示模式')}</span></div><ChevronDown size={16} className={profileMenuOpen ? 'rotate' : ''} /></button>{profileMenuOpen && <motion.div className="profile-popover" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><button onClick={() => go('profile')}><User/>我的主页</button><button onClick={() => session ? go('data') : setShowAuth(true)}><Settings/>账号设置</button><button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon/> : <Sun/>}{theme === 'light' ? '深色模式' : '浅色模式'}</button><i />{session ? <button className="logout" onClick={signOut}><LogOut/>退出登录</button> : <button onClick={() => setShowAuth(true)}><LogIn/>登录同频</button>}</motion.div>}</div></div>
    </aside>{mobileMenuOpen && <button className="sidebar-scrim" aria-label="关闭菜单" onClick={closeMobileMenu} />}
    <main id="main-content" tabIndex={-1} className={!session?'guest-main':''}><header className="topbar"><div><div className="mobile-title"><button ref={menuButtonRef} className="mobile-menu-button" onClick={()=>mobileMenuOpen?closeMobileMenu():setMobileMenuOpen(true)} aria-label={mobileMenuOpen?'关闭模块导航':'打开模块导航'} aria-controls="app-sidebar" aria-expanded={mobileMenuOpen}><svg className="morph-menu" viewBox="0 0 24 24" aria-hidden="true"><path className="morph-top" d="M4 7h16"/><path className="morph-mid" d="M4 12h16"/><path className="morph-bottom" d="M4 17h16"/></svg></button><p className="mobile-brand"><Sparkles size={17} />同频</p></div><h1>{title} <span>👋</span></h1>{view === 'home' && <p>今天也有新的故事，正在靠近你。</p>}</div><div className="top-actions"><Suspense fallback={null}><ConnectionHealth/><PwaControls/></Suspense><button className="icon-btn theme-toggle" aria-label={theme === 'light' ? '切换深色模式' : '切换浅色模式'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><Suspense fallback={<button className="search search-trigger"><Search/><span>搜索校园、兴趣或用户</span><kbd>⌘ K</kbd></button>}><GlobalSearch people={matchPeople.map(p=>({id:p.id,name:p.name,school:p.school,major:p.major,tags:p.tags,avatar:p.avatar}))} pages={navGroups.flatMap(g=>g.items).map(x=>({id:x.id,label:x.label}))} onPerson={id=>{const person=matchPeople.find(p=>p.id===id);if(person)setSelectedPerson(person)}} onPage={id=>go(id as View)}/></Suspense><button className="icon-btn notification" aria-label="打开通知中心" onClick={() => { if(!session){setShowAuth(true);notify('登录后查看账号通知');return}setNotifications(false);setShowNotifications(true) }}><Bell size={20} />{notifications && <i />}</button>{session ? <button className="session-pill" onClick={signOut}><LogOut size={15} />退出</button> : <button className="session-pill" onClick={() => setShowAuth(true)}><LogIn size={15} />登录</button>}<button className="top-avatar-button" aria-label={session?'打开我的主页':'登录后查看个人主页'} onClick={()=>session?go('profile'):setShowAuth(true)}><Avatar src={userAvatar} size={38}/></button></div></header>
      {!authReady&&<div className="auth-sync-banner" role="status" aria-live="polite"><LoaderCircle className="spin" size={15}/>正在确认账号状态，访客内容可以继续浏览</div>}{authReady&&authError&&<div className="auth-sync-banner warning" role="status" aria-live="polite"><WifiOff size={15}/>账号服务响应较慢，<button type="button" onClick={()=>setAuthAttempt(x=>x+1)}>重试</button><button type="button" onClick={()=>setAuthError(false)}>以访客继续</button></div>}
       {view==='home'&&!session&&<GuestActivation onExplore={()=>go('exploration')} onAuth={()=>setShowAuth(true)}/>}
       <AnimatePresence mode="wait">
        {view === 'home' && <motion.div className="page discovery-page" key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{dailyPulse}<Suspense fallback={null}><ChoiceCompass onNotice={notify} onOpenMatches={()=>go('matches')}/></Suspense>{!session&&<Suspense fallback={null}><WaitlistCard/></Suspense>}<Suspense fallback={<div className="discovery-loading"><LoaderCircle className="spin"/></div>}><DiscoveryMap people={discoveryPeople} demo={!session} located={locationEnabled} locating={locating} radius={discoveryRadius} onRadius={updateRadius} onLocate={()=>void locateAndDiscover()} onOpen={setSelectedPerson} onHeart={person=>void heartPerson(person)}/></Suspense><section className="section-head"><div><span className="section-kicker">DAILY PICKS</span><h2>今日心动推荐</h2></div><button onClick={() => go('matches')}>查看全部 <ChevronRight size={17} /></button></section>{!session&&<div className="demo-content-note"><WifiOff/>演示数据 · 上海校园场景示例 · 不代表真实用户或附近位置，登录并完成 18+ 校验后显示真实推荐</div>}<div className="match-grid">{people.slice(0, 3).map(p => <MatchCard key={p.id} person={p} demo={!session} onOpen={() => setSelectedPerson(p)} onHeart={()=>heartPerson(p)} onInsight={'userId' in p && 'reasons' in p ? () => setInsightPerson(p as unknown as MatchPerson) : undefined} />)}</div><section className="section-head moment-title"><div><span className="section-kicker">CAMPUS MOMENTS</span><h2>同频的人，此刻在做什么</h2></div><button onClick={() => go('moments')}>进入广场 <ChevronRight size={17} /></button></section><div className="home-feed">{posts.slice(0, 2).map(p => <PostCard key={p.id} post={p} onLike={() => like(p.id)} onComment={t => comment(p.id, t)} onDelete={('authorId' in p && p.authorId===session?.user.id)?()=>void removePost(p.id):undefined} onReport={('authorId' in p && p.authorId!==session?.user.id)?()=>void flagPost(p.id):undefined} onNotice={notify} userAvatar={userAvatar}/>)}</div></motion.div>}
        {view === 'matches' && <motion.div className="page" key="matches" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><div className="filter-bar"><div><button className={`filter ${matchFilter==='selected'?'active':''}`} onClick={()=>setMatchFilter('selected')}>为你精选</button><button className={`filter ${matchFilter==='high'?'active':''}`} onClick={()=>setMatchFilter('high')}>高契合度</button><button className={`filter ${matchFilter==='school'?'active':''}`} onClick={()=>setMatchFilter('school')}>同校用户</button></div><button className="secondary" onClick={()=>go('preferences')}><SlidersHorizontal size={17} />筛选偏好</button></div><div className="match-insight glass-card"><div className="insight-icon"><Sparkles /></div><div><b>{session?'匹配雷达已更新':'匹配功能预览'}</b><p>{session?`当前找到 ${matchPeople.length} 位候选人，可继续调整关系期待`:'登录并完善画像后，将根据真实资料生成推荐'}</p></div><button onClick={() => setShowOnboarding(true)}>查看我的画像 <ChevronRight size={16} /></button></div>{matchesLoading ? <div className="match-skeleton-grid">{[1,2,3].map(x => <div className="match-skeleton" key={x}><i /><b /><span /></div>)}</div> : filteredMatches.length?<div className="match-grid full">{filteredMatches.map(p => <MatchCard key={p.id} person={p} onOpen={() => setSelectedPerson(p)} onHeart={()=>heartPerson(p)} onInsight={'userId' in p && 'reasons' in p ? () => setInsightPerson(p as unknown as MatchPerson) : undefined} />)}</div>:<div className="match-empty glass-card"><Sparkles/><h3>这一组暂时没有合适的候选人</h3><p>这不代表没有可能。你可以先完善一项资料、做一次自我探索，或稍后回来查看新的真实推荐。</p><div className="empty-next-actions"><button className="primary" onClick={()=>go('preferences')}>调整匹配偏好</button><button className="secondary" onClick={()=>go('exploration')}>做一次自我探索</button><button className="secondary" onClick={()=>go('moments')}>先逛同频动态</button></div></div>}</motion.div>}
        {view === 'exploration' && <motion.div className="page" key="exploration" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><Suspense fallback={<PageLoading label="正在打开探索工作室"/>}><SelfExploration onResult={result=>notify(`已生成「${result.title}」：先看看你的关系线索，再决定是否注册`)} onOpenMatches={()=>go('matches')} /></Suspense></motion.div>}
        {view === 'assessment' && <motion.div className="page" key="assessment" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>{session?<Suspense fallback={<PageLoading label="正在打开自我评测"/>}><AssessmentCenter session={session} onSaved={()=>{notify('自我评测已保存，匹配已更新');go('matches')}}/></Suspense>:<div className="assessment-locked"><Sparkles/><h2>登录后开始自我评测</h2><p>完成评测后，我们会根据你的性格、生活节奏和关系期待生成更透明的匹配分析。</p><button className="primary" onClick={()=>setShowAuth(true)}>登录并开始评测 <ArrowRight/></button></div>}</motion.div>}
        {view === 'preferences' && <motion.div className="page preference-page" key="preferences-studio" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><Suspense fallback={<PageLoading label="正在打开期待工作室"/>}><ExpectationStudio session={session} onRequireAuth={()=>setShowAuth(true)} onSaved={()=>notify('期待已保存')}/></Suspense></motion.div>}

        {view === 'moments' && <motion.div className="page moments-page" key="moments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><div className="feed-column">{showComposer?<Composer onPost={addPost} authenticated={Boolean(session) || !isSupabaseConfigured} avatar={userAvatar} onClose={()=>setShowComposer(false)}/>:<button className="open-composer primary" onClick={()=>session||!isSupabaseConfigured?setShowComposer(true):setShowAuth(true)}><ImagePlus/>发布一条同频动态<Send/></button>}<div className="feed-tabs"><button className="active">最新动态</button></div>{posts.length?posts.map(p => <PostCard key={p.id} post={p} onLike={() => like(p.id)} onComment={t => comment(p.id, t)} onDelete={('authorId' in p && p.authorId===session?.user.id)?()=>void removePost(p.id):undefined} onReport={('authorId' in p && p.authorId!==session?.user.id)?()=>void flagPost(p.id):undefined} onNotice={notify} userAvatar={userAvatar}/>):<div className="match-empty glass-card"><MessageCircle/><h3>还没有真实动态</h3><p>发布第一条内容，或稍后回来看看。</p></div>}</div><aside className="right-rail"><div className="rail-card"><h3><Users size={18} />{session?'当前推荐':'功能预览'}</h3>{(session?matchPeople:people).slice(0, 3).map(p => <div className="mini-person" key={p.id}><Avatar src={p.avatar} size={38} /><div><b>{p.name}</b><span>{p.school}</span></div><button onClick={()=>setSelectedPerson(p)}>查看</button></div>)}</div><div className="rail-card"><h3><Zap size={18} />社区话题</h3>{['# 分享真实的此刻','# 最近单曲循环','# 周末搭子计划'].map((x,i)=><div className="trend" key={x}><b>0{i+1}</b><span>{x}<small>话题建议</small></span></div>)}</div><div className="safety-card"><ShieldCheck /><div><b>同频安全中心</b><p>真实高校认证 · 隐私保护</p></div></div></aside></motion.div>}
        {view === 'anonymous' && <motion.div className="page anonymous-page" key="anonymous" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><Suspense fallback={<PageLoading label="正在连接匿名信号"/>}><AnonymousChat session={session} onRequireAuth={()=>setShowAuth(true)}/></Suspense></motion.div>}
        {view === 'messages' && <motion.div className="page chat-page" key="messages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Suspense fallback={<PageLoading label="正在打开同频消息"/>}><ChatPanel session={session} onRequireAuth={() => setShowAuth(true)} /></Suspense></motion.div>}
        {view === 'legal' && <motion.div className="page" key="legal" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><Suspense fallback={<PageLoading/>}><LegalDocuments/></Suspense></motion.div>}
        {view === 'data' && <motion.div className="page" key="data" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>{!authReady?<PageLoading label="正在确认账号状态"/>:session?<Suspense fallback={<PageLoading/>}><DataRights session={session}/></Suspense>:<div className="route-guard glass-card"><ShieldCheck/><span className="section-kicker">ACCOUNT REQUIRED</span><h2>登录后管理你的数据</h2><p>数据导出和永久注销只对当前账号本人开放。</p><button className="primary" onClick={()=>setShowAuth(true)}>登录并继续 <ArrowRight/></button><button className="secondary" onClick={()=>go('home')}>返回首页</button></div>}</motion.div>}
        {view==='membership'&&<motion.div className="page" key="membership" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><Suspense fallback={<PageLoading label="正在加载会员权益"/>}><MembershipCenter session={session} onRequireAuth={()=>setShowAuth(true)}/></Suspense></motion.div>}
        {view === 'account' && <motion.div className="page" key="account" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><Suspense fallback={<PageLoading/>}><AccountCenter session={session} isAdmin={profileBundle?.profile.is_admin??false} onAdmin={()=>go('admin')}/></Suspense></motion.div>}
        {view === 'admin' && <motion.div className="page" key="admin" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>{!authReady||session&&!profileBundle?<PageLoading label="正在验证管理权限"/>:profileBundle?.profile.is_admin?<Suspense fallback={<PageLoading/>}><AdminPanel/></Suspense>:<div className="route-guard glass-card"><ShieldCheck/><span className="section-kicker">RESTRICTED AREA</span><h2>此区域仅对审核管理员开放</h2><p>{session?'当前账号没有平台审核权限。':'请使用具备审核权限的账号登录。'}</p>{!session&&<button className="primary" onClick={()=>setShowAuth(true)}>管理员登录 <ArrowRight/></button>}<button className="secondary" onClick={()=>go('account')}>返回关系与安全</button></div>}</motion.div>}
        {view === 'profile' && <motion.div className="page" key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{!session?<div className="assessment-locked"><User/><h2>登录后查看真实个人空间</h2><p>你的资料、照片和动态只会在登录后加载。</p><button className="primary" onClick={()=>setShowAuth(true)}>登录同频 <ArrowRight/></button></div>:!profile?<PageLoading label="正在加载真实资料"/>:<><section className="profile-hero glass-card"><div className="profile-cover"/><div className="profile-info"><button className="profile-avatar avatar-edit-entry" aria-label="编辑头像" onClick={()=>setShowProfileEditor(true)}><Avatar src={userAvatar} size={104}/><span><Camera size={16}/></span></button><div><h2>{profile.nickname}{profile.verified&&<ShieldCheck size={19}/>}</h2><p>{[profile.school,profile.major,profile.grade].filter(Boolean).join(' · ')||'尚未填写学习或工作信息'}</p><div className="tag-row">{[profile.personality,...profile.interests].filter(Boolean).slice(0,5).map(tag=><span key={tag}>{tag}</span>)}{!profile.personality&&!profile.interests.length&&<small>暂未添加兴趣标签</small>}</div></div><button className="secondary" onClick={()=>setShowProfileEditor(true)}><Settings size={17}/>编辑资料</button></div></section><div className="profile-layout"><section><div className="about-card glass-card"><h3>关于我</h3><p>{profile.bio||'还没有填写自我介绍，分享真实的你会让匹配更准确。'}</p><div className="details">{(profile.hometown||profile.city)&&<span><MapPin/>{profile.hometown?`来自${profile.hometown}`:''}{profile.hometown&&profile.city?'，':''}{profile.city?`现居${profile.city}`:''}</span>}{profile.life_stage&&<span><BookOpen/>{profile.life_stage}{profile.occupation?` · ${profile.occupation}`:''}</span>}{profile.ideal_date&&<span><Coffee/>理想约会：{profile.ideal_date}</span>}</div></div><div className="about-card glass-card"><h3>我的动态 <small>{ownPosts.length}</small></h3>{ownPosts.some(post=>post.image)?<div className="photo-grid">{ownPosts.filter(post=>post.image).slice(0,6).map(post=><img key={post.id} src={post.image} alt="我的动态"/>)}</div>:<div className="profile-empty">还没有发布带图片的动态</div>}</div></section><aside><div className="completion-card"><div className="circle-progress"><span>{profileCompletion}<small>%</small></span></div><h3>画像完成度</h3><p>{profileCompletion===100?'资料已完整，继续保持真实表达':`还有约 ${missingProfile} 项资料可以完善`}</p><button className="primary" onClick={()=>setShowProfileEditor(true)}>继续完善</button></div><div className="rail-card stat-card"><h3>我的内容</h3><div><span><b>{ownPosts.length}</b>真实动态</span><span><b>{ownPosts.reduce((sum,post)=>sum+post.likes,0)}</b>动态获赞</span><span><b>{profile.interests.length}</b>兴趣标签</span></div></div></aside></div></>}</motion.div>}
      </AnimatePresence>
    </main>
    <nav className="mobile-nav" aria-label="移动导航">{mobileNav.map(item => <button key={item.id} aria-current={view === item.id ? 'page' : undefined} className={view === item.id ? 'active' : ''} onClick={() => go(item.id)}><span className="mobile-nav-icon"><item.icon size={21} />{item.badge && <i>{item.badge}</i>}</span><span>{item.id === 'profile' ? '我的' : item.label}</span></button>)}</nav>
    {!session&&!guestAgeConfirmed&&<GuestAgeGate onAccept={()=>{safeStorage.set('tongpin-guest-age-confirmed','yes');setGuestAgeConfirmed(true)}}/>}{!online&&<div className="network-banner"><WifiOff/>当前网络已断开，部分操作将在恢复连接后可用</div>}{!isSupabaseConfigured && <div className="demo-badge"><WifiOff size={13} />演示模式</div>}{toast && <motion.div className="toast" role="status" aria-live="polite" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>{toast}</motion.div>}<AnimatePresence>{selectedPerson && <ProfileModal person={selectedPerson} onClose={() => setSelectedPerson(null)} onHeart={() => heartPerson(selectedPerson)} onReport={() => safetyPerson(selectedPerson, 'report')} onBlock={() => safetyPerson(selectedPerson, 'block')} />}{showOnboarding && <Onboarding initial={profile?{nickname:profile.nickname,birthYear:profile.birth_year??2003,school:profile.school,major:profile.major??'',grade:profile.grade??''}:undefined} onClose={() => setShowOnboarding(false)} onSave={async (traits, frequency,details) => { if (!session || !supabase) { setShowAuth(true); return } await saveProfile(session.user.id,{nickname:details.nickname.trim(),birth_year:details.birthYear,school:details.school.trim(),major:details.major.trim()||null,grade:details.grade.trim()||null,onboarding_complete:true}); const { error } = await supabase.from('preferences').update({ desired_traits: traits, preferred_values: traits, interaction_frequency: frequency, updated_at: new Date().toISOString() }).eq('user_id', session.user.id); if (error) throw error; await syncProfileAndMatches(session.user.id); notify('同频画像已保存') }} />}{showProfileEditor && session && <Suspense fallback={<div className="modal-backdrop"><LoaderCircle className="spin" /></div>}><ProfileEditor user={session.user} onClose={() => setShowProfileEditor(false)} onSaved={() => { void syncProfileAndMatches(session.user.id); notify('资料已更新') }} /></Suspense>}{showLegal&&session&&<Suspense fallback={null}><LegalModal session={session} required={!profileBundle?.profile.accepted_terms_at} onClose={()=>setShowLegal(false)} onAccepted={()=>{setShowLegal(false);void syncProfileAndMatches(session.user.id);notify('年龄与协议确认成功')}}/></Suspense>}{showNotifications&&session&&<Suspense fallback={null}><NotificationPanel userId={session.user.id} onClose={()=>setShowNotifications(false)}/></Suspense>}{insightPerson&&<Suspense fallback={<PageLoading label="正在生成匹配分析"/>}><MatchInsights person={insightPerson} onClose={()=>setInsightPerson(null)} onChanged={()=>{void syncProfileAndMatches(session?.user.id??'')}}/></Suspense>}{showAuth && <AuthModal onClose={() => setShowAuth(false)} />}</AnimatePresence>
  </div>
}

export default App
