import { supabase } from './supabase'
import type { Json } from './database.types'
export type Assessment={answers:Record<string,string|string[]>;requirements:Record<string,string|string[]>;weights:{values:number;lifestyle:number;interests:number;communication:number;intent:number}}
export async function saveAssessment(data:Assessment){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('save_self_assessment',{answers:data.answers as Json,requirements:data.requirements as Json,weights:data.weights as Json});if(error)throw error}
export async function fetchIntelligentMatches(){if(!supabase)return[];const{data,error}=await supabase.rpc('get_intelligent_matches_v2',{result_limit:30});if(error)throw error;return data??[]}
export async function saveMatchWeights(weights:Assessment['weights']){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('save_match_weights',{weights:weights as Json});if(error)throw error}
export async function saveMatchFeedback(target:string,type:'interested'|'not_now'|'not_fit'){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('save_match_feedback',{target,feedback_type:type});if(error)throw error}
