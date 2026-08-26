-- Business hardening: validate anonymous input and enforce bounded message/report content.
create or replace function public.send_heart(target_user uuid)
returns table(matched boolean,match_id uuid) language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();low_user uuid;high_user uuid;created_match uuid;
begin
 if me is null or not public.can_interact(me) then raise exception 'Account is not eligible to interact';end if;
 if target_user is null or me=target_user then raise exception 'Invalid target user';end if;
 if exists(select 1 from public.user_blocks b where(b.blocker_id=me and b.blocked_id=target_user)or(b.blocker_id=target_user and b.blocked_id=me))then raise exception 'Profile unavailable';end if;
 if not exists(select 1 from public.profiles where id=target_user and profile_visible and account_status='active' and birth_date is not null and birth_date<=current_date-interval '18 years')then raise exception 'Profile unavailable';end if;
 insert into public.heart_signals(sender_id,receiver_id)values(me,target_user)on conflict do nothing;
 if exists(select 1 from public.heart_signals where sender_id=target_user and receiver_id=me)then
  low_user:=least(me,target_user);high_user:=greatest(me,target_user);
  insert into public.matches(user_a,user_b)values(low_user,high_user)on conflict(user_a,user_b)do update set active=true returning id into created_match;
  insert into public.conversation_reads(match_id,user_id)values(created_match,me),(created_match,target_user)on conflict do nothing;
  insert into public.notifications(user_id,type,title,body,link)values(target_user,'match','新的双向心动','你们已经互相心动，现在可以开始对话。','messages'),(me,'match','新的双向心动','你们已经互相心动，现在可以开始对话。','messages');
  return query select true,created_match;
 else return query select false,null::uuid;end if;
end;$$;grant execute on function public.send_heart(uuid)to authenticated;

create or replace function public.report_anonymous_session(target_session uuid,report_reason text)
returns void language plpgsql security definer set search_path=''as $$declare partner uuid;begin
 if char_length(trim(coalesce(report_reason,''))) not between 1 and 500 then raise exception 'Invalid report reason';end if;
 select case when user_a=auth.uid()then user_b else user_a end into partner from public.anonymous_sessions where id=target_session and auth.uid()in(user_a,user_b);
 if partner is null then raise exception'Session unavailable';end if;
 insert into public.reports(reporter_id,target_user_id,reason,details)values(auth.uid(),partner,left(trim(report_reason),500),'匿名会话 '||target_session::text);
 update public.anonymous_sessions set status='ended',ended_at=now()where id=target_session;
end;$$;grant execute on function public.report_anonymous_session(uuid,text)to authenticated;
