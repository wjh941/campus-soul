import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'

export type SocialComment = { id: string | number; name: string; avatar: string; text: string }
export type SocialPost = {
  id: string | number; authorId?: string; name: string; avatar: string; school: string; time: string; text: string
  image?: string; tags: string[]; likes: number; liked: boolean; comments: SocialComment[]
}

const fallbackAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop'

export function relativeTime(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return '刚刚'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`
  return `${Math.floor(seconds / 86400)}天前`
}

export async function fetchSocialPosts(userId?: string): Promise<SocialPost[]> {
  if (!supabase) return []
  const { data: rows, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50)
  if (error) throw error
  const authorIds = [...new Set(rows.map(row => row.author_id))]
  const postIds = rows.map(row => row.id)
  const [{ data: profiles }, { data: comments }, { data: likes }] = await Promise.all([
    supabase.from('profiles').select('*').in('id', authorIds),
    postIds.length ? supabase.from('comments').select('*').in('post_id', postIds).order('created_at') : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from('post_likes').select('*').in('post_id', postIds) : Promise.resolve({ data: [] }),
  ])
  const commentAuthors = [...new Set((comments ?? []).map(c => c.author_id))]
  const missingAuthors = commentAuthors.filter(id => !authorIds.includes(id))
  const { data: extraProfiles } = missingAuthors.length ? await supabase.from('profiles').select('*').in('id', missingAuthors) : { data: [] }
  const allProfiles = [...(profiles ?? []), ...(extraProfiles ?? [])]
  const profileMap = new Map(allProfiles.map(profile => [profile.id, profile]))
  return rows.map(row => {
    const author = profileMap.get(row.author_id)
    const postLikes = (likes ?? []).filter(like => like.post_id === row.id)
    return {
      id: row.id, authorId: row.author_id, name: author?.nickname ?? '同频用户', avatar: author?.avatar_url ?? fallbackAvatar,
      school: author?.school ?? '认证高校', time: relativeTime(row.created_at), text: row.content,
      image: row.image_url ?? undefined, tags: Array.isArray(row.tags)?row.tags:[], likes: postLikes.length,
      liked: Boolean(userId && postLikes.some(like => like.user_id === userId)),
      comments: (comments ?? []).filter(comment => comment.post_id === row.id).map(comment => ({
        id: comment.id, name: profileMap.get(comment.author_id)?.nickname ?? '同频用户',
        avatar: profileMap.get(comment.author_id)?.avatar_url ?? fallbackAvatar, text: comment.content,
      })),
    }
  })
}

const maxPostImageBytes = 5 * 1024 * 1024
const postImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function createPost(user: User, content: string, image?: File) {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const trimmed = content.trim()
  if (!trimmed) throw new Error('动态内容不能为空')
  if (trimmed.length > 2000) throw new Error('动态内容不能超过 2000 字')
  let imageUrl: string | null = null
  let uploadedPath: string | undefined
  if (image) {
    if (image.size > maxPostImageBytes) throw new Error('动态图片不能超过 5 MB')
    if (!postImageTypes.includes(image.type)) throw new Error('仅支持 JPG、PNG、WebP 或 GIF')
    const extension = ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'} as Record<string,string>)[image.type]
    uploadedPath = `${user.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('post-images').upload(uploadedPath, image, { contentType: image.type, upsert: false })
    if (uploadError) throw uploadError
    imageUrl = supabase.storage.from('post-images').getPublicUrl(uploadedPath).data.publicUrl
  }
  const { error } = await supabase.from('posts').insert({ author_id: user.id, content: trimmed, image_url: imageUrl, tags: ['我的此刻'] })
  if (error) { if (uploadedPath) await supabase.storage.from('post-images').remove([uploadedPath]).catch(() => undefined); throw error }
}

export async function togglePostLike(postId: string, userId: string, liked: boolean) {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const result = liked
    ? await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    : await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
  if (result.error) throw result.error
}

export async function createComment(postId: string, userId: string, content: string) {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const { error } = await supabase.from('comments').insert({ post_id: postId, author_id: userId, content: content.trim() })
  if (error) throw error
}

export async function reportPost(postId:string,reason:string,details=''){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('report_post',{target_post:postId,report_reason:reason,report_details:details});if(error)throw error}
export async function deletePost(postId:string,userId:string){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.from('posts').delete().eq('id',postId).eq('author_id',userId);if(error)throw error}
export { isSupabaseConfigured }
