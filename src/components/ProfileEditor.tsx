import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Camera, Check, ImagePlus, LoaderCircle, ShieldCheck, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { addProfilePhoto, fetchProfileBundle, saveProfile, uploadAvatar, type ProfileBundle } from '../lib/profiles'

const interests = ['电影', '摄影', '阅读', '音乐', '运动', '旅行', '展览', '游戏', '手作', '小动物']
const values = ['真诚', '有边界感', '情绪稳定', '热爱生活', '有行动力', '幽默', '温柔', '保持好奇']

type Props = { user: User; onClose: () => void; onSaved: () => void }

export default function ProfileEditor({ user, onClose, onSaved }: Props) {
  const [bundle, setBundle] = useState<ProfileBundle>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const avatarRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void fetchProfileBundle(user.id).then(setBundle).catch(e => setError(e instanceof Error ? e.message : '资料加载失败'))
  }, [user.id])

  if (!bundle) return <div className="modal-backdrop"><div className="editor-loading">{error || <><LoaderCircle className="spin" />正在加载资料</>}</div></div>
  const profile = bundle.profile
  const update = (patch: Partial<typeof profile>) => setBundle({ ...bundle, profile: { ...profile, ...patch } })
  const toggle = (key: 'interests' | 'relationship_values', value: string) => update({ [key]: profile[key].includes(value) ? profile[key].filter(x => x !== value) : [...profile[key], value] })

  const submit = async () => {
    setBusy(true); setError('')
    try {
      await saveProfile(user.id, {
        nickname: profile.nickname, school: profile.school, major: profile.major, grade: profile.grade, life_stage: profile.life_stage, city: profile.city, occupation: profile.occupation, industry: profile.industry, organization: profile.organization,
        bio: profile.bio, birth_year: profile.birth_year, gender: profile.gender, personality: profile.personality,
        interests: profile.interests, lifestyle: profile.lifestyle, relationship_values: profile.relationship_values,
        hometown: profile.hometown, ideal_date: profile.ideal_date, profile_visible: profile.profile_visible,
        onboarding_complete: true,
      }, {
        desired_traits: profile.relationship_values, preferred_interests: profile.interests,
        preferred_values: profile.relationship_values, preferred_lifestyle: profile.lifestyle,
      })
      onSaved(); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : '保存失败') } finally { setBusy(false) }
  }

  const validImage=(file:File)=>{if(file.size>5*1024*1024)throw new Error('图片不能超过 5 MB');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('仅支持 JPG、PNG 或 WebP')}
  const changeAvatar = async (file?: File) => {
    if (!file) return; setBusy(true);setError('');try{validImage(file)}catch(e){setError(e instanceof Error?e.message:'图片不符合要求');setBusy(false);return}
    try { update({ avatar_url: await uploadAvatar(user, file) }) } catch (e) { setError(e instanceof Error ? e.message : '上传失败') } finally { setBusy(false) }
  }
  const addPhoto = async (file?: File) => {
    if (!file) return; setBusy(true);setError('');try{validImage(file)}catch(e){setError(e instanceof Error?e.message:'图片不符合要求');setBusy(false);return}
    try { await addProfilePhoto(user, file, bundle.photos.length); setBundle(await fetchProfileBundle(user.id)) } catch (e) { setError(e instanceof Error ? e.message : '上传失败') } finally { setBusy(false) }
  }

  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <motion.div className="profile-editor" initial={{ y: 30, scale: .97 }} animate={{ y: 0, scale: 1 }}>
      <header><div><span className="section-kicker">REAL PROFILE</span><h2>编辑真实资料</h2><p>完整资料能显著提升匹配质量</p></div><button className="modal-close editor-close" onClick={onClose}><X /></button></header>
      <div className="editor-scroll">
        <section className="avatar-editor">
          <div className="profile-avatar"><img src={profile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300'} alt="当前头像" /><button onClick={() => avatarRef.current?.click()}><Camera /></button></div>
          <input hidden ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void changeAvatar(e.target.files?.[0])} />
          <div><b>你的主头像</b><p>清晰、自然且单人的照片更容易获得信任</p></div>
        </section>
        <div className="editor-form">
          <label>昵称<input value={profile.nickname} onChange={e => update({ nickname: e.target.value })} /></label>
          <label>人生阶段<select value={profile.life_stage} onChange={e => update({ life_stage: e.target.value })}><option>高中阶段（已满18岁）</option><option>大学</option><option>研究生</option><option>职场</option><option>自由职业</option><option>创业</option><option>其他</option></select></label>
          <label>所在城市<input value={profile.city ?? ''} onChange={e => update({ city: e.target.value })} placeholder="例如 上海" /></label>
          <label>学校 / 教育机构<input value={profile.school} onChange={e => update({ school: e.target.value })} placeholder="非学生可填写最高学历院校" /></label>
          <label>公司 / 组织<input value={profile.organization ?? ''} onChange={e => update({ organization: e.target.value })} /></label>
          <label>职业<input value={profile.occupation ?? ''} onChange={e => update({ occupation: e.target.value })} /></label>
          <label>行业<input value={profile.industry ?? ''} onChange={e => update({ industry: e.target.value })} /></label>
          <label>专业<input value={profile.major ?? ''} onChange={e => update({ major: e.target.value })} /></label>
          <label>年级<input value={profile.grade ?? ''} onChange={e => update({ grade: e.target.value })} /></label>
          <label>出生年份<input type="number" min="1940" max="2008" value={profile.birth_year ?? 2003} onChange={e => update({ birth_year: Number(e.target.value) })} /></label>
          <label>性别<select value={profile.gender ?? '不公开'} onChange={e => update({ gender: e.target.value })}><option>不公开</option><option>女</option><option>男</option><option>非二元</option></select></label>
          <label>MBTI<input maxLength={20} value={profile.personality ?? ''} onChange={e => update({ personality: e.target.value.toUpperCase() })} placeholder="例如 INFJ" /></label>
          <label>家乡<input value={profile.hometown ?? ''} onChange={e => update({ hometown: e.target.value })} /></label>
          <label className="wide">关于我<textarea maxLength={500} value={profile.bio ?? ''} onChange={e => update({ bio: e.target.value })} placeholder="分享真实的你，而不是完美的你" /></label>
          <label className="wide">理想约会<input value={profile.ideal_date ?? ''} onChange={e => update({ ideal_date: e.target.value })} placeholder="例如：旧书店 + 黄昏散步" /></label>
        </div>
        <section className="editor-tags"><h3>我的兴趣</h3><div>{interests.map(x => <button className={profile.interests.includes(x) ? 'selected' : ''} onClick={() => toggle('interests', x)} key={x}>{profile.interests.includes(x) && <Check />}{x}</button>)}</div><h3>我看重的关系品质</h3><div>{values.map(x => <button className={profile.relationship_values.includes(x) ? 'selected' : ''} onClick={() => toggle('relationship_values', x)} key={x}>{profile.relationship_values.includes(x) && <Check />}{x}</button>)}</div></section>
        <section className="photo-editor"><div><h3>生活照片</h3><p>最多展示 6 张，帮助对方了解你的生活切面</p></div><div className="editor-photo-grid">{bundle.photos.map(photo => <img key={photo.id} src={photo.url} alt="个人生活" />)}{bundle.photos.length < 6 && <button onClick={() => photoRef.current?.click()}><ImagePlus /><span>添加照片</span></button>}</div><input hidden ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void addPhoto(e.target.files?.[0])} /></section>
        <label className="visibility"><input type="checkbox" checked={profile.profile_visible} onChange={e => update({ profile_visible: e.target.checked })} /><ShieldCheck /><span><b>允许出现在匹配推荐中</b><small>关闭后，其他用户将无法在匹配页发现你</small></span></label>
        {error && <div className="auth-message">{error}</div>}
      </div>
      <footer><button className="secondary" onClick={onClose}>取消</button><button className="primary" disabled={busy || !profile.nickname.trim() || !profile.school.trim()} onClick={submit}>{busy ? <LoaderCircle className="spin" /> : <Check />}保存资料</button></footer>
    </motion.div>
  </motion.div>
}
