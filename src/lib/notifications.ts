import { supabase } from './supabase'
export async function fetchNotifications(userId:string){if(!supabase)return[];const{data,error}=await supabase.from('notifications').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(30);if(error)throw error;return data}
export async function markAllRead(userId:string){if(!supabase)return;const{error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',userId).is('read_at',null);if(error)throw error}
export async function enableBrowserNotifications(){if(!('Notification'in window))throw new Error('当前浏览器不支持通知');const result=await Notification.requestPermission();if(result!=='granted')throw new Error('通知权限未开启');return result}
