-- Persist self-exploration results per account for future device recovery.
create table if not exists public.exploration_results(user_id uuid not null references auth.users(id) on delete cascade,test_id text not null,result_title text not null check(char_length(result_title)<=120),created_at timestamptz not null default now());
alter table public.exploration_results enable row level security;
create policy "Users manage own exploration results" on public.exploration_results for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create or replace function public.save_exploration_result(test_id text,result_title text) returns void language plpgsql security invoker as $$ begin insert into public.exploration_results(user_id,test_id,result_title) values(auth.uid(),test_id,result_title); end; $$;
grant execute on function public.save_exploration_result(text,text) to authenticated;
