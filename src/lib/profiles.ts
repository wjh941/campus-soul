import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Database } from './database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Preference = Database['public']['Tables']['preferences']['Row']
export type ProfileBundle = { profile: Profile; preference: Preference; photos: Database['public']['Tables']['profile_photos']['Row'][] }
export type MatchPerson = {
  id: string; userId: string; name: string; age: number; school: string; major: string; score: number; distance: string
  avatar: string; tags: string[]; quote: string; color: string; dimensions: number[]; reasons: string[]; verified: boolean; topics?: string[]; analysis?: Record<string, number>
  distanceKm?: number; bearing?: number
}
const fallbackAvatar='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop'
export async function resolveProfileMedia(path:string|null|undefined){if(!path||path.startsWith('http'))return path??null;if(!supabase)return null;const {data,error}=await supabase.storage.from('profile-media').createSignedUrl(path,60*60);if(error)throw error;return data.signedUrl}

export async function fetchProfileBundle(userId:string):Promise<ProfileBundle>{
  if(!supabase) throw new Error('Supabase 尚未配置')
  const [{data:profile,error},{data:preference},{data:photos}]=await Promise.all([
    supabase.from('profiles').select('*').eq('id',userId).single(),
    supabase.from('preferences').select('*').eq('user_id',userId).single(),
    supabase.from('profile_photos').select('*').eq('user_id',userId).order('position')
  ])
  if(error||!profile) throw error??new Error('资料不存在')
  if(!preference) throw new Error('偏好资料不存在')
  const safeProfile={...profile,interests:Array.isArray(profile.interests)?profile.interests:[],lifestyle:Array.isArray(profile.lifestyle)?profile.lifestyle:[],relationship_values:Array.isArray(profile.relationship_values)?profile.relationship_values:[],self_assessment:profile.self_assessment??{}}
  const safePreference={...preference,desired_traits:Array.isArray(preference.desired_traits)?preference.desired_traits:[],preferred_genders:Array.isArray(preference.preferred_genders)?preference.preferred_genders:[],preferred_interests:Array.isArray(preference.preferred_interests)?preference.preferred_interests:[],preferred_values:Array.isArray(preference.preferred_values)?preference.preferred_values:[],preferred_lifestyle:Array.isArray(preference.preferred_lifestyle)?preference.preferred_lifestyle:[],preferred_life_stages:Array.isArray(preference.preferred_life_stages)?preference.preferred_life_stages:[]}
  const resolvedAvatar=await resolveProfileMedia(safeProfile.avatar_url);const resolvedPhotos=await Promise.all((photos??[]).map(async photo=>({...photo,url:(await resolveProfileMedia(photo.url))??photo.url})));return {profile:{...safeProfile,avatar_url:resolvedAvatar},preference:safePreference,photos:resolvedPhotos}
}

export async function saveProfile(userId:string, profile:Database['public']['Tables']['profiles']['Update'], preference?:Database['public']['Tables']['preferences']['Update']){
  if(!supabase) throw new Error('Supabase 尚未配置')
  const {error}=await supabase.from('profiles').update({...profile,updated_at:new Date().toISOString()}).eq('id',userId)
  if(error) throw error
  if(preference){const {error:prefError}=await supabase.from('preferences').update({...preference,updated_at:new Date().toISOString()}).eq('user_id',userId);if(prefError)throw prefError}
}

async function uploadMedia(user:User,file:File,kind:'avatar'|'photo'){
  if(!supabase) throw new Error('Supabase 尚未配置')
  if(file.size>5*1024*1024)throw new Error('图片不能超过 5 MB')
  const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};const ext=extensions[file.type];if(!ext)throw new Error('仅支持 JPG、PNG 或 WebP');const path=`${user.id}/${kind}-${crypto.randomUUID()}.${ext}`
  const {error}=await supabase.storage.from('profile-media').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error
  return path
}
export async function uploadAvatar(user:User,file:File){const uploaded=await uploadMedia(user,file,'avatar');await saveProfile(user.id,{avatar_url:uploaded});return uploaded}
export async function addProfilePhoto(user:User,file:File,position:number){
  if(!supabase)throw new Error('Supabase 尚未配置');const url=await uploadMedia(user,file,'photo')
  const {error}=await supabase.from('profile_photos').upsert({user_id:user.id,url,position});if(error)throw error;return url
}

async function mapMatches(data: Database['public']['Functions']['get_match_recommendations']['Returns']): Promise<MatchPerson[]> {
  return Promise.all(data.map(async(p,i)=>({id:p.user_id,userId:p.user_id,name:p.nickname,age:p.birth_year?new Date().getFullYear()-p.birth_year:20,school:p.school,major:p.major??'探索中',score:p.overall_score,distance:'同城校园',avatar:(await resolveProfileMedia(p.avatar_url))??fallbackAvatar,tags:[p.personality,...p.interests].filter(Boolean).slice(0,3) as string[],quote:p.bio??'期待认识真诚、同频的人。',color:['#ff715b','#7c5cff','#34b991','#2f8cff'][i%4],dimensions:[p.value_score,p.interest_score,p.lifestyle_score],reasons:p.reasons,verified:p.verified})))
}
export async function saveApproximateLocation(lat:number,lng:number,accuracy?:number){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('save_approximate_location',{lat,lng,accuracy:accuracy??null});if(error)throw error}
export async function disableLocation(){if(!supabase)return;const{error}=await supabase.rpc('disable_location');if(error)throw error}
export async function fetchLocationState(){if(!supabase)return null;const{data,error}=await supabase.from('user_locations').select('enabled,updated_at').maybeSingle();if(error)throw error;return data}
export async function fetchNearbyMatches(radius=100):Promise<MatchPerson[]>{if(!supabase)return[];const{data,error}=await supabase.rpc('get_nearby_discovery',{result_limit:20,max_distance_km:radius});if(error)throw error;return await Promise.all((data??[]).map(async(p,i)=>({id:p.user_id,userId:p.user_id,name:p.nickname,age:p.birth_year?new Date().getFullYear()-p.birth_year:20,school:p.school,major:p.major??'探索中',score:p.overall_score,distance:`${p.distance_km} km`,distanceKm:p.distance_km,bearing:p.bearing_degrees,avatar:(await resolveProfileMedia(p.avatar_url))??fallbackAvatar,tags:[p.personality,...p.interests].filter(Boolean).slice(0,3)as string[],quote:p.bio??'期待认识真诚、同频的人。',color:['#ff715b','#7c5cff','#34b991','#2f8cff'][i%4],dimensions:[p.value_score,p.interest_score,p.lifestyle_score],reasons:p.reasons,verified:p.verified})))}
export async function fetchIntelligentMapped():Promise<MatchPerson[]> { if(!supabase)return[]; const {data,error}=await supabase.rpc('get_intelligent_matches_v2',{result_limit:30}); if(error)throw error; return await Promise.all((data??[]).map(async(p,i)=>({id:p.user_id,userId:p.user_id,name:p.nickname,age:p.birth_year?new Date().getFullYear()-p.birth_year:20,school:p.school,major:p.major??'探索中',score:p.overall_score,distance:'同频推荐',avatar:(await resolveProfileMedia(p.avatar_url))??fallbackAvatar,tags:[p.personality,...p.interests].filter(Boolean).slice(0,3)as string[],quote:p.bio??'期待认识真诚、同频的人。',color:['#ff715b','#7c5cff','#34b991','#2f8cff'][i%4],dimensions:[p.value_score,p.interest_score,p.lifestyle_score],reasons:p.reasons,topics:p.topics,analysis:p.analysis as Record<string,number>,verified:p.verified})))}
export async function fetchMatches():Promise<MatchPerson[]>{
  if(!supabase)return[];const {data,error}=await supabase.rpc('get_match_recommendations',{result_limit:30});if(error)throw error
  return await mapMatches(data??[])
}

export async function fetchPreferenceMatches(page=0,pageSize=9):Promise<MatchPerson[]>{
  if(!supabase)return[];const{data,error}=await supabase.rpc('get_preference_recommendations',{page_size:pageSize,page_offset:page*pageSize});if(error)throw error
  return await mapMatches(data??[])
}
export async function saveRecommendationPreferences(userId:string,settings:{age_min:number;age_max:number;preferred_genders:string[];preferred_interests:string[];preferred_values:string[];same_school_only:boolean;same_city_only:boolean;preferred_life_stages:string[];verified_only:boolean;minimum_match_score:number;recommendation_sort:string;ideal_requirements?:Record<string,string[]>}){
  if(!supabase)throw new Error('Supabase 尚未配置');const {ideal_requirements,...preferenceSettings}=settings;const payload=ideal_requirements?{...preferenceSettings,ideal_requirements,updated_at:new Date().toISOString()}:{...preferenceSettings,updated_at:new Date().toISOString()};const{error}=await supabase.from('preferences').update(payload).eq('user_id',userId);if(error)throw error
}
export async function blockUser(targetId:string){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('block_user',{target_user:targetId});if(error)throw error}
export async function reportUser(userId:string,targetId:string,reason:string,details=''){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.from('reports').insert({reporter_id:userId,target_user_id:targetId,reason,details});if(error)throw error}

