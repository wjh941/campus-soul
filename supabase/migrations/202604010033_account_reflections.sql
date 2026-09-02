-- Account-scoped daily reflections, available across signed-in devices.
create table if not exists public.account_reflections(user_id uuid not null references auth.users(id) on delete cascade,reflection_day integer not null,answer text not null check(char_length(answer)<=40),updated_at timestamptz not null default now(),primary key(user_id,reflection_day));
alter table public.account_reflections enable row level security;
create policy "Users manage own reflections" on public.account_reflections for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create or replace function public.save_daily_reflection(reflection_day integer,answer text) returns void language plpgsql security invoker as $$ begin insert into public.account_reflections(user_id,reflection_day,answer) values(auth.uid(),reflection_day,answer) on conflict(user_id,reflection_day) do update set answer=excluded.answer,updated_at=now(); end; $$;
grant execute on function public.save_daily_reflection(integer,text) to authenticated;
