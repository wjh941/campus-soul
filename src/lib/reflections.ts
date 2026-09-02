import { supabase } from './supabase'
export async function saveDailyReflection(day:number,answer:string){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('save_daily_reflection',{reflection_day:day,answer});if(error)throw error}
export async function saveChoiceCompass(day:number,choice:string){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('save_daily_reflection',{reflection_day:-day-1,answer:`choice:${choice}`});if(error)throw error}
export async function saveExplorationResult(testId:string,resultTitle:string){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('save_exploration_result',{test_id:testId,result_title:resultTitle});if(error)throw error}
