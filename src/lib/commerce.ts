import { supabase } from './supabase'
import type { Json } from './database.types'
export type Plan={id:string;name:string;description:string;price_cents:number;billing_period:string;entitlements:Record<string,string|number|boolean>;active:boolean;sort_order:number}
export type Membership={plan:Plan;subscription:null|{id:string;status:string;starts_at:string;ends_at:string;auto_renew:boolean};orders:{id:string;plan_id:string;amount_cents:number;currency:string;status:string;created_at:string}[]}
export type Admirer={user_id:string;nickname:string;avatar_url:string|null;school:string;created_at:string;can_view:boolean}
const client=()=>{if(!supabase)throw new Error('Supabase 尚未配置');return supabase}
export async function fetchPlans(){const{data,error}=await client().from('membership_plans').select('*').eq('active',true).order('sort_order');if(error)throw error;return(data??[])as unknown as Plan[]}
export async function fetchMembership(){const{data,error}=await client().rpc('get_my_membership');if(error)throw error;return data as unknown as Membership}
export async function fetchAdmirers(){const{data,error}=await client().rpc('get_my_admirers');if(error)throw error;return(data??[])as unknown as Admirer[]}
export async function cancelPendingOrder(id:string){const{error}=await client().rpc('cancel_my_pending_order',{target_order:id});if(error)throw error}
export async function createPendingOrder(plan:string){const{data,error}=await client().rpc('create_pending_order',{chosen_plan:plan});if(error)throw error;return data as string}
export async function createSupportTicket(userId:string,category:string,subject:string,body:string){const{error}=await client().from('support_tickets').insert({user_id:userId,category,subject:subject.trim(),body:body.trim()});if(error)throw error;void trackEvent('support_created',{category})}
export async function fetchMyTickets(userId:string){const{data,error}=await client().from('support_tickets').select('*').eq('user_id',userId).order('created_at',{ascending:false});if(error)throw error;return data??[]}
export async function joinWaitlist(email:string,city:string,school:string,referral:string,consent:boolean){const{error}=await client().rpc('join_waitlist',{contact_email:email,contact_city:city,contact_school:school,referral,accepted:consent});if(error)throw error}
export async function fetchAdminCommerce(){const[{data:summary,error},{data:tickets,error:ticketError}]=await Promise.all([client().rpc('admin_commerce_summary'),client().rpc('admin_support_queue',{result_limit:100})]);if(error||ticketError)throw error??ticketError;return{summary:summary as Record<string,unknown>,tickets:tickets??[]}}
export async function updateSupportTicket(id:string,status:string,priority?:string){const{error}=await client().rpc('admin_update_ticket',{target_ticket:id,next_status:status,next_priority:priority??null});if(error)throw error}
export async function trackEvent(event:string,properties:Record<string,unknown>={}){if(!supabase)return;await supabase.rpc('track_product_event',{chosen_event:event,properties:properties as Json})}
