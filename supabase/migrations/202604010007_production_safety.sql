-- Production enforcement, data rights and administrator user search.
-- Enforce account state, legal consent and 18+ requirements on every social write.
drop policy if exists "Users create own posts" on public.posts;
create policy "Eligible users create own posts" on public.posts for insert to authenticated
with check(auth.uid()=author_id and public.can_interact(auth.uid()));
drop policy if exists "Users update own posts" on public.posts;
create policy "Eligible users update own posts" on public.posts for update to authenticated
using(auth.uid()=author_id and public.can_interact(auth.uid())) with check(auth.uid()=author_id and public.can_interact(auth.uid()));
drop policy if exists "Users create own comments" on public.comments;
create policy "Eligible users create own comments" on public.comments for insert to authenticated
with check(auth.uid()=author_id and public.can_interact(auth.uid()));
drop policy if exists "Users create own likes" on public.post_likes;
create policy "Eligible users create own likes" on public.post_likes for insert to authenticated
with check(auth.uid()=user_id and public.can_interact(auth.uid()));
drop policy if exists "Users send their own heart" on public.heart_signals;
create policy "Eligible users send hearts" on public.heart_signals for insert to authenticated
with check(auth.uid()=sender_id and public.can_interact(auth.uid()));
drop policy if exists "Participants send messages" on public.messages;
create policy "Eligible participants send messages" on public.messages for insert to authenticated
with check(auth.uid()=sender_id and public.can_interact(auth.uid()) and exists(select 1 from public.matches m where m.id=match_id and m.active and(auth.uid()=m.user_a or auth.uid()=m.user_b)));

-- Strengthen the security-definer heart flow too.
create or replace function public.send_heart(target_user uuid)
returns table(matched boolean,match_id uuid) language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();low_user uuid;high_user uuid;created_match uuid;
begin
 if me is null or not public.can_interact(me) then raise exception 'Account is not eligible to interact';end if;
 if me=target_user then raise exception 'Cannot send a heart to yourself';end if;
 if not exists(select 1 from public.profiles where id=target_user and profile_visible and account_status='active')then raise exception 'Profile unavailable';end if;
 insert into public.heart_signals(sender_id,receiver_id)values(me,target_user)on conflict do nothing;
 if exists(select 1 from public.heart_signals where sender_id=target_user and receiver_id=me)then
  low_user:=least(me,target_user);high_user:=greatest(me,target_user);
  insert into public.matches(user_a,user_b)values(low_user,high_user)on conflict(user_a,user_b)do update set active=true returning id into created_match;
  insert into public.conversation_reads(match_id,user_id)values(created_match,me),(created_match,target_user)on conflict do nothing;
  insert into public.notifications(user_id,type,title,body,link)values(target_user,'match','新的双向心动','你们已经互相心动，现在可以开始对话。','messages'),(me,'match','新的双向心动','你们已经互相心动，现在可以开始对话。','messages');
  return query select true,created_match;
 else return query select false,null::uuid;end if;
end;$$;

create or replace function public.report_post(target_post uuid,report_reason text,report_details text default null)
returns void language plpgsql security definer set search_path='' as $$
declare owner_id uuid;begin
 if not public.can_interact(auth.uid())then raise exception 'Account is not eligible to interact';end if;
 select author_id into owner_id from public.posts where id=target_post and moderation_status='published';
 if owner_id is null then raise exception 'Post unavailable';end if;
 insert into public.reports(reporter_id,target_user_id,target_post_id,reason,details)values(auth.uid(),owner_id,target_post,report_reason,report_details);
end;$$;grant execute on function public.report_post(uuid,text,text)to authenticated;

create or replace function public.admin_search_users(search_text text default '',result_limit integer default 30)
returns table(id uuid,nickname text,email text,city text,life_stage text,account_status text,muted_until timestamptz,verified boolean,created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select p.id,p.nickname,u.email,p.city,p.life_stage,p.account_status,p.muted_until,p.verified,p.created_at
 from public.profiles p join auth.users u on u.id=p.id
 where public.is_admin() and(search_text=''or p.nickname ilike'%'||search_text||'%'or u.email ilike'%'||search_text||'%')
 order by p.created_at desc limit greatest(1,least(result_limit,100));
$$;grant execute on function public.admin_search_users(text,integer)to authenticated;

create or replace function public.export_my_data()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('exported_at',now(),'profile',(select to_jsonb(p)from public.profiles p where p.id=auth.uid()),'preferences',(select to_jsonb(x)from public.preferences x where x.user_id=auth.uid()),'posts',coalesce((select jsonb_agg(to_jsonb(x))from public.posts x where x.author_id=auth.uid()),'[]'::jsonb),'comments',coalesce((select jsonb_agg(to_jsonb(x))from public.comments x where x.author_id=auth.uid()),'[]'::jsonb),'matches',coalesce((select jsonb_agg(to_jsonb(x))from public.matches x where x.user_a=auth.uid()or x.user_b=auth.uid()),'[]'::jsonb),'messages',coalesce((select jsonb_agg(to_jsonb(x))from public.messages x where x.sender_id=auth.uid()),'[]'::jsonb));
$$;grant execute on function public.export_my_data()to authenticated;

create or replace function public.delete_my_account(confirm_text text)
returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();begin
 if me is null or confirm_text<>'DELETE MY ACCOUNT'then raise exception 'Invalid confirmation';end if;
 delete from auth.users where id=me;
end;$$;grant execute on function public.delete_my_account(text)to authenticated;
