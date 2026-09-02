-- Expire abandoned active anonymous sessions after 30 minutes of inactivity.
alter table public.anonymous_sessions add column if not exists last_seen_at timestamptz not null default now();
create index if not exists anonymous_sessions_last_seen_idx on public.anonymous_sessions(last_seen_at) where status='active';
create or replace function public.heartbeat_anonymous_session(target_session uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.anonymous_sessions set last_seen_at=now() where id=target_session and status='active' and auth.uid() in(user_a,user_b);
end; $$;
grant execute on function public.heartbeat_anonymous_session(uuid) to authenticated;
create or replace function public.get_anonymous_session() returns setof public.anonymous_sessions language plpgsql security definer set search_path='' as $$
begin
 update public.anonymous_sessions set status='ended',ended_at=now() where status='active' and last_seen_at < now()-interval '30 minutes';
 return query select * from public.anonymous_sessions where status='active' and auth.uid() in(user_a,user_b) order by created_at desc limit 1;
end; $$;
