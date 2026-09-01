-- Expire abandoned anonymous queue entries after five minutes.
alter table public.anonymous_queue add column if not exists last_seen_at timestamptz not null default now();
create index if not exists anonymous_queue_last_seen_idx on public.anonymous_queue(last_seen_at);
create or replace function public.join_anonymous_queue(chosen_mode text default 'balanced') returns table(state text,session_id uuid) language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();partner uuid;sid uuid;
begin
 if not public.can_interact(me) then raise exception 'Account is not eligible to interact'; end if;
 delete from public.anonymous_queue where last_seen_at < now()-interval '5 minutes';
 select id into sid from public.anonymous_sessions where status='active' and me in(user_a,user_b) limit 1;
 if sid is not null then return query select 'matched'::text,sid; return; end if;
 select q.user_id into partner from public.anonymous_queue q where q.user_id<>me and q.mode=chosen_mode and q.last_seen_at>=now()-interval '5 minutes' and not exists(select 1 from public.user_blocks b where (b.blocker_id=me and b.blocked_id=q.user_id) or (b.blocker_id=q.user_id and b.blocked_id=me)) order by q.joined_at for update skip locked limit 1;
 if partner is null then insert into public.anonymous_queue(user_id,mode,joined_at,last_seen_at) values(me,chosen_mode,now(),now()) on conflict(user_id) do update set mode=excluded.mode,joined_at=now(),last_seen_at=now(); return query select 'waiting'::text,null::uuid; return; end if;
 delete from public.anonymous_queue where user_id in(me,partner); insert into public.anonymous_sessions(user_a,user_b) values(least(me,partner),greatest(me,partner)) returning id into sid; insert into public.anonymous_messages(session_id,sender_id,kind,content) values(sid,me,'system','你们已匿名相遇。先聊聊彼此，而不是标签。'); return query select 'matched'::text,sid;
end; $$;
grant execute on function public.join_anonymous_queue(text) to authenticated;
create or replace function public.heartbeat_anonymous_queue() returns void language sql security definer set search_path='' as $$ update public.anonymous_queue set last_seen_at=now() where user_id=auth.uid() $$;
grant execute on function public.heartbeat_anonymous_queue() to authenticated;
