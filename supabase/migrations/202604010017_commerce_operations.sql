-- Commerce operations: safe order cancellation and admin-only aggregate/support RPCs.
create or replace function public.cancel_my_pending_order(target_order uuid) returns void language plpgsql security definer set search_path='' as $f$
begin
 update public.orders set status='cancelled' where id=target_order and user_id=auth.uid() and status='pending';
 if not found then raise exception 'Pending order not found'; end if;
end;$f$;
grant execute on function public.cancel_my_pending_order(uuid) to authenticated;
create or replace function public.admin_commerce_summary() returns jsonb language plpgsql stable security definer set search_path='' as $f$
begin
 if not public.is_admin() then raise exception 'Admin access required';end if;
 return jsonb_build_object(
  'waitlist',jsonb_build_object('waiting',(select count(*) from public.waitlist_entries where status='waiting'),'invited',(select count(*) from public.waitlist_entries where status='invited'),'joined',(select count(*) from public.waitlist_entries where status='joined')),
  'orders',jsonb_build_object('pending',(select count(*) from public.orders where status='pending'),'paid',(select count(*) from public.orders where status='paid'),'refunded',(select count(*) from public.orders where status='refunded'),'revenue_cents',(select coalesce(sum(amount_cents),0) from public.orders where status='paid')),
  'subscriptions',jsonb_build_object('active',(select count(*) from public.subscriptions where status in('active','trialing') and ends_at>now())),
  'support',jsonb_build_object('open',(select count(*) from public.support_tickets where status='open'),'in_progress',(select count(*) from public.support_tickets where status='in_progress')),
  'events',coalesce((select jsonb_object_agg(event_name,total) from(select event_name,count(*) total from public.product_events where created_at>now()-interval '30 days' group by event_name)e),'{}'::jsonb)
 );
end;$f$;
grant execute on function public.admin_commerce_summary() to authenticated;
create or replace function public.admin_support_queue(result_limit int default 100) returns table(id uuid,user_id uuid,email text,category text,subject text,body text,status text,priority text,created_at timestamptz) language plpgsql stable security definer set search_path='' as $f$
begin
 if not public.is_admin() then raise exception 'Admin access required';end if;
 return query select t.id,t.user_id,u.email::text,t.category,t.subject,t.body,t.status,t.priority,t.created_at from public.support_tickets t left join auth.users u on u.id=t.user_id order by case t.priority when 'urgent' then 0 when 'high' then 1 else 2 end,t.created_at asc limit least(greatest(result_limit,1),200);
end;$f$;
grant execute on function public.admin_support_queue(int) to authenticated;
create or replace function public.admin_update_ticket(target_ticket uuid,next_status text,next_priority text default null) returns void language plpgsql security definer set search_path='' as $f$
begin
 if not public.is_admin() then raise exception 'Admin access required';end if;
 if next_status not in('open','in_progress','resolved','closed') then raise exception 'Invalid status';end if;
 if next_priority is not null and next_priority not in('normal','high','urgent') then raise exception 'Invalid priority';end if;
 update public.support_tickets set status=next_status,priority=coalesce(next_priority,priority),updated_at=now() where id=target_ticket;
 if not found then raise exception 'Ticket not found';end if;
end;$f$;
grant execute on function public.admin_update_ticket(uuid,text,text) to authenticated;
