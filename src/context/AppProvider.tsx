import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { createComment, createPost, deletePost, fetchSocialPosts, reportPost, togglePostLike, type SocialPost } from '../lib/social'
import { sendHeart } from '../lib/messaging'
import { friendlyError, safeStorage, withTimeout } from '../lib/resilience'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import {
  blockUser, disableLocation, fetchIntelligentMapped, fetchLocationState, fetchMatches,
  fetchNearbyMatches, fetchProfileBundle, reportUser, saveApproximateLocation,
  type MatchPerson, type ProfileBundle,
} from '../lib/profiles'
import { people, seedPosts, type Person } from '../lib/demo'
import { pathFor, viewFromPath, type ViewKey } from '../lib/navigation'
import { AppContext, type AppContextValue, type InsightPerson } from './AppContext'

export function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const [posts, setPosts] = useState<SocialPost[]>(isSupabaseConfigured ? [] : seedPosts)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [matchPeople, setMatchPeople] = useState<Person[]>(isSupabaseConfigured ? [] : people)
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [profileBundle, setProfileBundle] = useState<ProfileBundle>()
  const [showLegal, setShowLegal] = useState(false)
  const [guestAgeConfirmed, setGuestAgeConfirmed] = useState(() => safeStorage.get('tongpin-guest-age-confirmed') === 'yes')
  const [unreadNotifications, setUnreadNotifications] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [discoveryRadius, setDiscoveryRadius] = useState(50)
  const [nearbyPeople, setNearbyPeople] = useState<MatchPerson[]>([])
  const [dataMode, setDataMode] = useState<'demo' | 'real' | 'unavailable'>(isSupabaseConfigured ? 'unavailable' : 'demo')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [authError, setAuthError] = useState(false)
  const [authAttempt, setAuthAttempt] = useState(0)
  const [showAuth, setShowAuth] = useState(false)
  const [toast, setToast] = useState('')
  const [insightPerson, setInsightPerson] = useState<InsightPerson | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (safeStorage.get('campus-theme') as 'light' | 'dark') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const toastTimer = useRef<number | undefined>(undefined)
  const syncRef = useRef<{ userId: string; promise: Promise<void> } | null>(null)
  const online = useOnlineStatus()

  const notify = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }, [])
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  useEffect(() => { document.documentElement.dataset.theme = theme; safeStorage.set('campus-theme', theme) }, [theme])

  // Unread notification badge, kept fresh via realtime channel.
  useEffect(() => {
    if (!session || !supabase) {
      const timer = window.setTimeout(() => setUnreadNotifications(false), 0)
      return () => window.clearTimeout(timer)
    }
    let active = true
    const client = supabase
    const refresh = async () => {
      const { count } = await client.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).is('read_at', null)
      if (active) setUnreadNotifications(Boolean(count))
    }
    void refresh()
    const channel = client.channel(`notifications:${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => void refresh())
      .subscribe()
    return () => { active = false; void client.removeChannel(channel) }
  }, [session])

  const syncProfileAndMatches = useCallback((userId: string) => {
    if (syncRef.current?.userId === userId) return syncRef.current.promise
    const promise = (async () => {
      setMatchesLoading(true)
      try {
        if (supabase) {
          const pending = Object.entries(localStorage).filter(([key]) => key.startsWith('tongpin-explore-'))
          if (pending.length) {
            const selfAssessment = Object.fromEntries(pending.map(([key, value]) => [key.replace('tongpin-explore-', ''), value]))
            const { error } = await supabase.from('profiles').update({ self_assessment: selfAssessment, updated_at: new Date().toISOString() }).eq('id', userId)
            if (!error) pending.forEach(([key]) => localStorage.removeItem(key))
          }
        }
        const [bundle, matches, intelligent] = await withTimeout(Promise.all([fetchProfileBundle(userId), fetchMatches(), fetchIntelligentMapped().catch(() => [])]), 9000, '匹配数据加载超时，请稍后重试')
        setProfileBundle(bundle)
        const locationState = await fetchLocationState()
        setLocationEnabled(Boolean(locationState?.enabled))
        setLocationUpdatedAt(locationState?.updated_at ?? null)
        setShowLegal(!bundle.profile.accepted_terms_at || !bundle.profile.accepted_privacy_at || !bundle.profile.birth_date)
        const realPeople = intelligent.length ? intelligent : matches
        setMatchPeople(realPeople)
        setDataMode(realPeople.length ? 'real' : 'unavailable')
      } catch (error) {
        notify(friendlyError(error, '真实匹配加载失败'))
        setDataMode('unavailable')
        setMatchPeople([])
      } finally {
        setMatchesLoading(false)
      }
    })()
    syncRef.current = { userId, promise }
    void promise.finally(() => { if (syncRef.current?.promise === promise) syncRef.current = null })
    return promise
  }, [notify])

  const syncPosts = useCallback(async (userId?: string) => {
    if (!isSupabaseConfigured) return
    try {
      const remote = await withTimeout(fetchSocialPosts(userId), 7000, '动态加载超时')
      setPosts(remote)
    } catch (error) {
      setPosts([])
      notify(friendlyError(error, '动态加载失败，请稍后重试'))
    }
  }, [notify])

  useEffect(() => {
    if (!supabase) return
    withTimeout(supabase.auth.getSession(), 8000, '登录状态读取超时').then(({ data }) => {
      setAuthReady(true); setAuthError(false); setSession(data.session)
      if (data.session) { void syncPosts(data.session.user.id); void syncProfileAndMatches(data.session.user.id) }
    }).catch(() => { setAuthReady(true); setAuthError(true); setSession(null) })
    const client = supabase
    const { data } = client.auth.onAuthStateChange((event, nextSession) => {
      setAuthReady(true); setSession(nextSession)
      if (event === 'SIGNED_OUT') notify('登录状态已失效，请重新登录')
      if (nextSession) window.setTimeout(() => {
        void syncPosts(nextSession.user.id); void syncProfileAndMatches(nextSession.user.id)
        if (event === 'SIGNED_IN') void fetchProfileBundle(nextSession.user.id).then(bundle => {
          if (!bundle.profile.accepted_terms_at || !bundle.profile.accepted_privacy_at || !bundle.profile.birth_date) setShowOnboarding(false)
          else if (!bundle.profile.onboarding_complete) setShowOnboarding(true)
        }).catch(() => undefined)
      }, 0)
    })
    const reconnect = () => {
      void client.auth.getSession().then(({ data: current }) => {
        if (current.session) { void syncPosts(current.session.user.id); void syncProfileAndMatches(current.session.user.id); notify('网络已恢复，数据已重新同步') }
      })
    }
    addEventListener('tongpin:reconnected', reconnect)
    return () => { data.subscription.unsubscribe(); removeEventListener('tongpin:reconnected', reconnect) }
  }, [authAttempt, notify, syncPosts, syncProfileAndMatches])

  const go = useCallback((target: ViewKey, matchId?: string) => {
    const base = pathFor(target)
    navigate(matchId ? `${base}?matchId=${encodeURIComponent(matchId)}` : base)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [navigate])

  const requireUser = useCallback(() => {
    if (!session?.user) { setShowAuth(true); return null }
    return session.user
  }, [session])

  const addPost = useCallback(async (text: string, image?: File) => {
    const user = requireUser()
    if (isSupabaseConfigured && user) {
      try {
        await createPost(user, text, image)
        await syncPosts(user.id)
        setShowComposer(false)
        notify('动态发布成功')
      } catch (error) {
        const message = error instanceof Error ? error.message : '发布失败'
        notify(message)
        throw error instanceof Error ? error : new Error(message)
      }
      return
    }
    if (isSupabaseConfigured) return
    setPosts(p => [{ id: Date.now(), name: '小满', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop', school: '上海大学', time: '刚刚', text, tags: ['我的此刻'], likes: 0, liked: false, comments: [] }, ...p])
    notify('演示动态已发布')
  }, [notify, requireUser, syncPosts])

  const flagPost = useCallback(async (id: string | number) => {
    const user = requireUser()
    if (!user) return
    try { await reportPost(String(id), '不恰当的动态内容'); notify('动态举报已提交') } catch (error) { notify(error instanceof Error ? error.message : '举报失败') }
  }, [notify, requireUser])

  const removePost = useCallback(async (id: string | number) => {
    const user = requireUser()
    if (!user) return
    try { await deletePost(String(id), user.id); setPosts(x => x.filter(p => p.id !== id)); notify('动态已删除') } catch (error) { notify(error instanceof Error ? error.message : '删除失败') }
  }, [notify, requireUser])

  const like = useCallback(async (id: string | number) => {
    const current = posts.find(p => p.id === id)
    if (!current) return
    if (isSupabaseConfigured) {
      const user = requireUser()
      if (!user) return
      try { await togglePostLike(String(id), user.id, current.liked) } catch (error) { return notify(error instanceof Error ? error.message : '操作失败') }
    }
    setPosts(ps => ps.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p))
  }, [notify, posts, requireUser])

  const comment = useCallback(async (id: string | number, text: string) => {
    if (isSupabaseConfigured) {
      const user = requireUser()
      if (!user) return
      try {
        await createComment(String(id), user.id, text)
        await syncPosts(user.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : '评论失败'
        notify(message)
        throw error instanceof Error ? error : new Error(message)
      }
      return
    }
    setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: [...p.comments, { id: Date.now(), name: '小满', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop', text }] } : p))
  }, [notify, requireUser, syncPosts])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
    setSession(null)
    setProfileBundle(undefined)
    setMatchPeople(isSupabaseConfigured ? [] : people)
    setDataMode(isSupabaseConfigured ? 'unavailable' : 'demo')
    setPosts(isSupabaseConfigured ? [] : seedPosts)
    if (['data', 'admin', 'account', 'profile', 'messages'].includes(viewFromPath(routerLocation.pathname))) go('home')
    notify('已安全退出')
  }, [go, notify, routerLocation.pathname])

  const safetyPerson = useCallback(async (person: Person, action: 'report' | 'block') => {
    const user = requireUser()
    const targetId = 'userId' in person ? person.userId : undefined
    if (!user || !targetId) return notify('展示资料无法执行此操作')
    try {
      if (action === 'block') {
        await blockUser(targetId)
        setMatchPeople(items => items.filter(item => !('userId' in item) || item.userId !== targetId))
        notify(`已屏蔽 ${person.name}`)
      } else {
        await reportUser(user.id, targetId, '不恰当的个人资料')
        notify('举报已提交，我们会尽快审核')
      }
      setSelectedPerson(null)
    } catch (error) { notify(error instanceof Error ? error.message : '操作失败') }
  }, [notify, requireUser])

  const locateAndDiscover = useCallback(() => {
    const user = requireUser()
    if (!user) return
    if (!navigator.geolocation) return notify('当前浏览器不支持地理定位')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          await saveApproximateLocation(position.coords.latitude, position.coords.longitude, Math.round(position.coords.accuracy))
          setLocationEnabled(true)
          setLocationUpdatedAt(new Date().toISOString())
          setNearbyPeople(await fetchNearbyMatches(discoveryRadius))
          notify('附近发现已开启，仅保存模糊位置')
        } catch (error) { notify(error instanceof Error ? error.message : '附近发现开启失败') } finally { setLocating(false) }
      },
      error => { setLocating(false); notify(error.code === 1 ? '你没有允许位置权限，可随时在浏览器设置中开启' : '暂时无法获取位置') },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }, [discoveryRadius, notify, requireUser])

  const turnOffLocation = useCallback(async () => {
    try { await disableLocation(); setLocationEnabled(false); setNearbyPeople([]); setLocationUpdatedAt(null); notify('附近发现已关闭，已移除本地候选') } catch (error) { notify(error instanceof Error ? error.message : '关闭附近发现失败') }
  }, [notify])

  const updateRadius = useCallback((value: number) => {
    setDiscoveryRadius(value)
    if (locationEnabled) void fetchNearbyMatches(value).then(setNearbyPeople).catch(error => notify(error instanceof Error ? error.message : '附近推荐更新失败'))
  }, [locationEnabled, notify])

  const heartPerson = useCallback(async (person: Person) => {
    const user = requireUser()
    if (!user) return
    const targetId = 'userId' in person ? person.userId : undefined
    if (!targetId) { notify('该用户是展示资料，真实用户注册后即可发送心动'); setSelectedPerson(null); return }
    try {
      const result = await sendHeart(targetId)
      notify(result.matched ? `你和${person.name}互相心动了！` : `已向${person.name}发送心动`)
      if (result.matched) go('messages')
      setSelectedPerson(null)
    } catch (error) { notify(error instanceof Error ? error.message : '发送心动失败') }
  }, [go, notify, requireUser])

  const userAvatar = profileBundle?.profile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop'
  const profile = profileBundle?.profile

  const value = useMemo<AppContextValue>(() => ({
    session, authReady, authError,
    retryAuth: () => setAuthAttempt(x => x + 1),
    dismissAuthError: () => setAuthError(false),
    requireUser, signOut, showAuth, setShowAuth,
    profileBundle, profile, userAvatar, syncProfileAndMatches, matchPeople, matchesLoading, dataMode,
    posts, addPost, like, comment, removePost, flagPost,
    notify, toast, theme, setTheme, online, guestAgeConfirmed, setGuestAgeConfirmed,
    unreadNotifications, setUnreadNotifications,
    selectedPerson, setSelectedPerson, insightPerson, setInsightPerson,
    showOnboarding, setShowOnboarding, showLegal, setShowLegal, showComposer, setShowComposer,
    heartPerson, safetyPerson,
    locationEnabled, locationUpdatedAt, locating, discoveryRadius, nearbyPeople, locateAndDiscover, turnOffLocation, updateRadius,
    go,
  }), [session, authReady, authError, requireUser, signOut, showAuth, profileBundle, profile, userAvatar, syncProfileAndMatches, matchPeople, matchesLoading, dataMode, posts, addPost, like, comment, removePost, flagPost, notify, toast, theme, online, guestAgeConfirmed, unreadNotifications, selectedPerson, insightPerson, showOnboarding, showLegal, showComposer, heartPerson, safetyPerson, locationEnabled, locationUpdatedAt, locating, discoveryRadius, nearbyPeople, locateAndDiscover, turnOffLocation, updateRadius, go])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
