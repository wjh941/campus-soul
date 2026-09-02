import { supabase } from './supabase'
export async function saveDailyReflection(day:number,answer:string){if(!supabase)throw new Error('Supabase 尚未配置');const{error}=await supabase.rpc('save_daily_reflection',{reflection_day:day,answer});if(error)throw error}
