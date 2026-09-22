import {
  BookOpen, Coffee, Compass, Heart, Home, MessageCircle, PawPrint,
  ShieldCheck, Sparkles, Target, User, VenetianMask,
} from 'lucide-react'

export type ViewKey = 'home' | 'exploration' | 'matches' | 'preferences' | 'assessment' | 'moments' | 'anonymous' | 'messages' | 'membership' | 'account' | 'legal' | 'data' | 'admin' | 'profile'
export const views: ViewKey[] = ['home', 'exploration', 'matches', 'preferences', 'assessment', 'moments', 'anonymous', 'messages', 'membership', 'account', 'legal', 'data', 'admin', 'profile']

type NavItem = { id: ViewKey; label: string; icon: typeof Home; badge?: string; step?: string; featured?: boolean }
type NavGroup = { label: string; hint: string; items: NavItem[] }
export const navGroups: NavGroup[] = [
  { label: '同频旅程', hint: '认识自己，再遇见彼此', items: [
    { id: 'home', label: '发现', icon: Home },
    { id: 'assessment', label: '3 分钟自测', icon: Sparkles },
    { id: 'exploration', label: '探索结果', icon: PawPrint },
    { id: 'preferences', label: '设置匹配偏好', icon: Target },
    { id: 'matches', label: '查看我的匹配', icon: Heart, step: '03', featured: true },
  ] },
  { label: '互动空间', hint: '动态、匿名与真实连接', items: [
    { id: 'moments', label: '同频动态', icon: Compass },
    { id: 'anonymous', label: '匿名相遇', icon: VenetianMask },
    { id: 'messages', label: '消息', icon: MessageCircle },
  ] },
  { label: '我的同频', hint: '资料与会员权益', items: [
    { id: 'profile', label: '我的主页', icon: User },
    { id: 'membership', label: '会员与支持', icon: Coffee },
  ] },
  { label: '安全与帮助', hint: '关系管理和平台规则', items: [
    { id: 'account', label: '关系与安全', icon: ShieldCheck },
    { id: 'legal', label: '信任中心', icon: BookOpen },
  ] },
]
export const mobileNav = navGroups.flatMap(group => group.items).filter(item => ['home', 'matches', 'moments', 'messages', 'profile'].includes(item.id))

export const pathFor = (view: ViewKey) => (view === 'home' ? '/' : `/${view}`)

export function viewFromPath(pathname: string): ViewKey {
  const value = pathname.replace(/^\/+/, '').split('/')[0]
  return views.includes(value as ViewKey) ? value as ViewKey : 'home'
}

export function viewTitle(view: ViewKey, nickname?: string): string {
  if (view === 'home') return nickname ? `你好，${nickname}` : '欢迎来到同频'
  return ({
    exploration: '探索内心',
    matches: '为你找到的同频',
    preferences: '按偏好推荐',
    moments: '同频动态',
    assessment: '自我评测',
    anonymous: '匿名相遇',
    messages: '同频消息',
    membership: '会员与支持',
    account: '关系与安全',
    legal: '信任与安全中心',
    data: '数据与账号',
    admin: '平台审核',
    profile: '我的同频空间',
  })[view]
}
