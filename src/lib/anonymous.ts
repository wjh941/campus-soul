import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Database } from './database.types'
export type AnonymousSession=Database['public']['Tables']['anonymous_sessions']['Row']
export type AnonymousMessage=Database['public']['Tables']['anonymous_messages']['Row']
export type AnonymousGame=Database['public']['Tables']['anonymous_games']['Row']
export async function heartbeatAnonymousQueue(){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('heartbeat_anonymous_queue');if(error)throw error}
export async function reportAndLeaveAnonymous(sessionId:string,reason:string){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('report_and_leave_anonymous',{target_session:sessionId,report_reason:reason});if(error)throw error}
export async function heartbeatAnonymousSession(sessionId:string){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('heartbeat_anonymous_session',{target_session:sessionId});if(error)throw error}
export async function joinAnonymous(mode:string){if(!supabase)throw new Error('Supabase 尚未配置');const{data,error}=await supabase.rpc('join_anonymous_queue',{chosen_mode:mode});if(error)throw error;return data?.[0]??{state:'waiting',session_id:null}}
export async function getAnonymousSession(){if(!supabase)return null;const{data,error}=await supabase.rpc('get_anonymous_session');if(error)throw error;return data?.[0]??null}
export async function fetchAnonymousMessages(sessionId:string){if(!supabase)return[];const{data,error}=await supabase.from('anonymous_messages').select('*').eq('session_id',sessionId).order('created_at');if(error)throw error;return data}
export async function fetchAnonymousGames(sessionId:string){if(!supabase)return[];const{data,error}=await supabase.from('anonymous_games').select('*').eq('session_id',sessionId).order('created_at');if(error)throw error;return data}
export async function sendAnonymousMessage(sessionId:string,userId:string,content:string){if(!supabase)throw new Error('Supabase 尚未配置');const value=content.trim();if(!value)throw new Error('消息内容不能为空');if(value.length>2000)throw new Error('消息不能超过 2000 个字符');const{error}=await supabase.from('anonymous_messages').insert({session_id:sessionId,sender_id:userId,content:value});if(error)throw error}
export async function createAnonymousGame(sessionId:string,type:'sync'|'scenario'){if(!supabase)throw new Error('Supabase 尚未配置');const{data,error}=await supabase.rpc('create_anonymous_game',{target_session:sessionId,chosen_type:type});if(error)throw error;return data}
export async function answerAnonymousGame(gameId:string,choice:number){if(!supabase)throw new Error('Supabase 尚未配置');const{data,error}=await supabase.rpc('answer_anonymous_game',{game_id:gameId,choice});if(error)throw error;return data}
export async function requestReveal(sessionId:string){if(!supabase)return false;const{data,error}=await supabase.rpc('request_anonymous_reveal',{target_session:sessionId});if(error)throw error;return data}
export async function getRevealedPartner(sessionId:string){if(!supabase)return null;const{data,error}=await supabase.rpc('get_revealed_partner',{target_session:sessionId});if(error)throw error;return data?.[0]??null}
export async function reportAnonymous(sessionId:string,reason='匿名聊天中的不当行为'){if(!supabase)return;const{error}=await supabase.rpc('report_anonymous_session',{target_session:sessionId,report_reason:reason});if(error)throw error}
export async function leaveAnonymous(sessionId:string){if(!supabase)return;const{error}=await supabase.rpc('leave_anonymous_chat',{target_session:sessionId});if(error)throw error}
export function subscribeAnonymous(sessionId:string,onMessage:(message:AnonymousMessage)=>void):RealtimeChannel|null{if(!supabase)return null;return supabase.channel(`anonymous:${sessionId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'anonymous_messages',filter:`session_id=eq.${sessionId}`},payload=>onMessage(payload.new as AnonymousMessage)).subscribe()}
