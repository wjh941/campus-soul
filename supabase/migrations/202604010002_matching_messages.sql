-- Matching and realtime messaging. Run after 202604010001_initial_schema.sql.
create table public.heart_signals (
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  active boolean not null default true,
  check (user_a < user_b),
  unique (user_a, user_b)
);
create index matches_user_a_idx on public.matches(user_a) where active;
create index matches_user_b_idx on public.matches(user_b) where active;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_match_created_idx on public.messages(match_id, created_at desc);

create table public.conversation_reads (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

alter table public.heart_signals enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_reads enable row level security;

create policy "Users see heart signals involving them" on public.heart_signals for select to authenticated
using ((select auth.uid()) = sender_id or (select auth.uid()) = receiver_id);
create policy "Users send their own heart" on public.heart_signals for insert to authenticated
with check ((select auth.uid()) = sender_id);
create policy "Users withdraw their own heart" on public.heart_signals for delete to authenticated
using ((select auth.uid()) = sender_id);

create policy "Participants read matches" on public.matches for select to authenticated
using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);
create policy "Participants deactivate matches" on public.matches for update to authenticated
using ((select auth.uid()) = user_a or (select auth.uid()) = user_b)
with check ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

create policy "Participants read messages" on public.messages for select to authenticated
using (exists (select 1 from public.matches m where m.id = match_id and m.active and ((select auth.uid()) = m.user_a or (select auth.uid()) = m.user_b)));
create policy "Participants send messages" on public.messages for insert to authenticated
with check ((select auth.uid()) = sender_id and exists (select 1 from public.matches m where m.id = match_id and m.active and ((select auth.uid()) = m.user_a or (select auth.uid()) = m.user_b)));

create policy "Users read own receipts" on public.conversation_reads for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own receipts" on public.conversation_reads for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own receipts" on public.conversation_reads for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Atomically send a heart and create a match only when the interest is mutual.
create or replace function public.send_heart(target_user uuid)
returns table (matched boolean, match_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  low_user uuid;
  high_user uuid;
  created_match uuid;
begin
  if me is null then raise exception 'Authentication required'; end if;
  if me = target_user then raise exception 'Cannot send a heart to yourself'; end if;
  if not exists (select 1 from public.profiles where id = target_user) then raise exception 'Profile not found'; end if;
  insert into public.heart_signals(sender_id, receiver_id) values(me, target_user) on conflict do nothing;
  if exists(select 1 from public.heart_signals where sender_id = target_user and receiver_id = me) then
    low_user := least(me, target_user); high_user := greatest(me, target_user);
    insert into public.matches(user_a, user_b) values(low_user, high_user)
    on conflict(user_a, user_b) do update set active = true returning id into created_match;
    insert into public.conversation_reads(match_id, user_id) values(created_match, me), (created_match, target_user) on conflict do nothing;
    return query select true, created_match;
  else
    return query select false, null::uuid;
  end if;
end;
$$;
grant execute on function public.send_heart(uuid) to authenticated;

-- Include the messages table in Supabase Realtime. Ignore duplicate membership safely.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
