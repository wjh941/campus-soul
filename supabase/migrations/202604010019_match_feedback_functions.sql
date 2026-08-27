-- Renumbered from the historical duplicate 202604010013 migration so Supabase CLI can track it uniquely.
-- Step 2A: match weight column and feedback table.
alter table public.preferences add column if not exists match_weights jsonb not null default '{"values":35,"lifestyle":25,"interests":20,"communication":10,"intent":10}'::jsonb;
create table if not exists public.match_feedback(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,target_user_id uuid not null references public.profiles(id) on delete cascade,feedback text not null check(feedback in('interested','not_now','not_fit')),created_at timestamptz not null default now(),unique(user_id,target_user_id));
alter table public.match_feedback enable row level security;
drop policy if exists "Users manage own match feedback" on public.match_feedback;
create policy "Users manage own match feedback" on public.match_feedback for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
