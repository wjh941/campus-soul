-- Preference-first recommendations, blocks and reports.
alter table public.preferences
  add column if not exists same_school_only boolean not null default false,
  add column if not exists verified_only boolean not null default false,
  add column if not exists minimum_match_score smallint not null default 55 check(minimum_match_score between 50 and 95),
  add column if not exists recommendation_sort text not null default 'compatibility' check(recommendation_sort in('compatibility','newest','same_school'));

create table public.user_blocks(
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id), check(blocker_id<>blocked_id)
);
create table public.reports(
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_post_id uuid references public.posts(id) on delete set null,
  reason text not null check(char_length(reason) between 2 and 80),
  details text check(char_length(details)<=1000),
  status text not null default 'pending' check(status in('pending','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  check(target_user_id is not null or target_post_id is not null)
);
alter table public.user_blocks enable row level security;
alter table public.reports enable row level security;
create policy "Users read own blocks" on public.user_blocks for select to authenticated using((select auth.uid())=blocker_id);
create policy "Users create own blocks" on public.user_blocks for insert to authenticated with check((select auth.uid())=blocker_id);
create policy "Users remove own blocks" on public.user_blocks for delete to authenticated using((select auth.uid())=blocker_id);
create policy "Users create reports" on public.reports for insert to authenticated with check((select auth.uid())=reporter_id);
create policy "Users read own reports" on public.reports for select to authenticated using((select auth.uid())=reporter_id);

create or replace function public.get_preference_recommendations(page_size integer default 12,page_offset integer default 0)
returns table(user_id uuid,nickname text,avatar_url text,school text,major text,birth_year smallint,personality text,bio text,interests text[],lifestyle text[],relationship_values text[],verified boolean,overall_score integer,interest_score integer,value_score integer,lifestyle_score integer,reasons text[])
language sql stable security invoker set search_path='' as $$
 with me as(
  select p.*,pr.desired_traits,pr.preferred_genders,pr.preferred_interests,pr.preferred_values,pr.preferred_lifestyle,pr.age_min,pr.age_max,pr.same_school_only,pr.verified_only,pr.minimum_match_score,pr.recommendation_sort
  from public.profiles p join public.preferences pr on pr.user_id=p.id where p.id=auth.uid()
 ), scored as(
  select p.*,
   coalesce((select count(*) from unnest(p.interests)x where x=any(coalesce(nullif(me.preferred_interests,'{}'),me.interests))),0)::int ih,
   coalesce((select count(*) from unnest(p.relationship_values)x where x=any(coalesce(nullif(me.preferred_values,'{}'),me.desired_traits))),0)::int vh,
   coalesce((select count(*) from unnest(p.lifestyle)x where x=any(coalesce(nullif(me.preferred_lifestyle,'{}'),me.lifestyle))),0)::int lh,
   me.school me_school,me.minimum_match_score,me.recommendation_sort
  from public.profiles p cross join me
  where p.id<>me.id and p.profile_visible and p.onboarding_complete
   and(not me.same_school_only or p.school=me.school) and(not me.verified_only or p.verified)
   and(cardinality(me.preferred_genders)=0 or p.gender=any(me.preferred_genders))
   and(p.birth_year is null or extract(year from current_date)::int-p.birth_year between me.age_min and me.age_max)
   and not exists(select 1 from public.user_blocks b where(b.blocker_id=me.id and b.blocked_id=p.id)or(b.blocker_id=p.id and b.blocked_id=me.id))
 ), ranked as(
  select s.*,least(99,55+least(20,s.ih*7)+least(15,s.vh*6)+least(10,s.lh*5))::int score from scored s
 )
 select r.id,r.nickname,r.avatar_url,r.school,r.major,r.birth_year,r.personality,r.bio,r.interests,r.lifestyle,r.relationship_values,r.verified,r.score,
  least(100,45+r.ih*18)::int,least(100,50+r.vh*20)::int,least(100,50+r.lh*18)::int,
  array_remove(array[case when r.vh>0 then '符合你看重的关系品质' end,case when r.ih>0 then '命中你的偏好兴趣' end,case when r.lh>0 then '生活节奏与你更接近' end,case when r.school=r.me_school then '同校相遇，距离更近' end,case when r.verified then '已完成高校认证' end],null)
 from ranked r where r.score>=r.minimum_match_score
 order by case when r.recommendation_sort='same_school' and r.school=r.me_school then 0 else 1 end,
  case when r.recommendation_sort='newest' then extract(epoch from r.created_at) else r.score end desc,r.score desc
 limit greatest(1,least(page_size,24)) offset greatest(0,page_offset);
$$;
grant execute on function public.get_preference_recommendations(integer,integer) to authenticated;

create or replace function public.block_user(target_user uuid)
returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();begin
 if me is null then raise exception 'Authentication required';end if;
 if me=target_user then raise exception 'Cannot block yourself';end if;
 insert into public.user_blocks(blocker_id,blocked_id)values(me,target_user)on conflict do nothing;
 update public.matches set active=false where active and((user_a=me and user_b=target_user)or(user_a=target_user and user_b=me));
end;$$;
grant execute on function public.block_user(uuid) to authenticated;
