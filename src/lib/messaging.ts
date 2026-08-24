import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type ChatMessage = { id: string; matchId: string; senderId: string; content: string; createdAt: string }
export type Conversation = {
  id: string; partnerId: string; name: string; avatar: string; school: string
  lastMessage: string; lastAt: string; unread: number
}

const fallbackAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop'

export async function sendHeart(targetUserId: string) {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const { data, error } = await supabase.rpc('send_heart', { target_user: targetUserId })
  if (error) throw error
  return data?.[0] ?? { matched: false, match_id: null }
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  if (!supabase) return []
  const client = supabase
  const { data: matches, error } = await client.from('matches').select('*').eq('active', true).order('created_at', { ascending: false })
  if (error) throw error
  const partnerIds = matches.map(match => match.user_a === userId ? match.user_b : match.user_a)
  const { data: profiles } = partnerIds.length ? await client.from('profiles').select('*').in('id', partnerIds) : { data: [] }
  const { data: receipts } = matches.length ? await client.from('conversation_reads').select('*').eq('user_id', userId) : { data: [] }
  const conversations = await Promise.all(matches.map(async match => {
    const partnerId = match.user_a === userId ? match.user_b : match.user_a
    const partner = profiles?.find(profile => profile.id === partnerId)
    const { data: messages } = await client.from('messages').select('*').eq('match_id', match.id).order('created_at', { ascending: false }).limit(50)
    const receipt = receipts?.find(item => item.match_id === match.id)
    const unread = (messages ?? []).filter(message => message.sender_id !== userId && (!receipt || new Date(message.created_at) > new Date(receipt.last_read_at))).length
    return { id: match.id, partnerId, name: partner?.nickname ?? '同频用户', avatar: partner?.avatar_url ?? fallbackAvatar, school: partner?.school ?? '认证高校', lastMessage: messages?.[0]?.content ?? '你们已互相心动，打个招呼吧 ✨', lastAt: messages?.[0]?.created_at ?? match.created_at, unread }
  }))
  return conversations.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
}

export async function fetchMessages(matchId: string): Promise<ChatMessage[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('messages').select('*').eq('match_id', matchId).order('created_at')
  if (error) throw error
  return data.map(item => ({ id: item.id, matchId: item.match_id, senderId: item.sender_id, content: item.content, createdAt: item.created_at }))
}

export async function sendMessage(matchId: string, userId: string, content: string) {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const { error } = await supabase.from('messages').insert({ match_id: matchId, sender_id: userId, content: content.trim() })
  if (error) throw error
}

export async function markConversationRead(matchId: string, userId: string) {
  if (!supabase) return
  const { error } = await supabase.from('conversation_reads').upsert({ match_id: matchId, user_id: userId, last_read_at: new Date().toISOString() })
  if (error) throw error
}

export function subscribeToMessages(matchId: string, onMessage: (message: ChatMessage) => void): RealtimeChannel | null {
  if (!supabase) return null
  return supabase.channel(`messages:${matchId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, payload => {
    const row = payload.new as { id: string; match_id: string; sender_id: string; content: string; created_at: string }
    onMessage({ id: row.id, matchId: row.match_id, senderId: row.sender_id, content: row.content, createdAt: row.created_at })
  }).subscribe()
}
