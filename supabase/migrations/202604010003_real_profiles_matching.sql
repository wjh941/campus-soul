-- Real profiles, compatibility scoring and profile media.
alter table public.profiles
  add column if not exists birth_year smallint check (birth_year between 1985 and 2010),
  add column if not exists gender text check (gender in ('女','男','非二元','不公开')),
  add column if not exists personality text check (char_length(personality) <= 20),
  add column if not exists lifestyle text[] not null default '{}',
  add column if not exists relationship_values text[] not null default '{}',
  add column if not exists hometown text check (char_length(hometown) <= 80),
  add column if not exists ideal_date text check (char_length(ideal_date) <= 160),
  add column if not exists profile_visible boolean not null default true,
  add column if not exists onboarding_complete boolean not null default false;

alter table public.preferences
  add column if not exists preferred_genders text[] not null default '{}',
  add column if not exists preferred_interests text[] not null default '{}',
  add column if not exists preferred_values text[] not null default '{}',
  add column if not exists preferred_lifestyle text[] not null default '{}';

create table public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  position smallint not null default 0 check (position between 0 and 8),
  created_at timestamptz not null default now(),
  unique(user_id, position)
);
create index profile_photos_user_idx on public.profile_photos(user_id, position);
alter table public.profile_photos enable row level security;
create policy "Authenticated users read visible profile photos" on public.profile_photos for select to authenticated
using (exists(select 1 from public.profiles p where p.id = user_id and (p.profile_visible or p.id = (select auth.uid()))));
create policy "Users add own profile photos" on public.profile_photos for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own profile photos" on public.profile_photos for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own profile photos" on public.profile_photos for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-media','profile-media',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Public profile media is readable" on storage.objects for select using(bucket_id='profile-media');
create policy "Users upload own profile media" on storage.objects for insert to authenticated
with check(bucket_id='profile-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users update own profile media" on storage.objects for update to authenticated
using(bucket_id='profile-media' and owner_id=(select auth.uid())::text);
create policy "Users delete own profile media" on storage.objects for delete to authenticated
using(bucket_id='profile-media' and owner_id=(select auth.uid())::text);

-- Returns only public, completed profiles and computes transparent compatibility dimensions.
create or replace function public.get_match_recommendations(result_limit integer default 30)
returns table(
  user_id uuid, nickname text, avatar_url text, school text, major text, birth_year smallint,
  personality text, bio text, interests text[], lifestyle text[], relationship_values text[],
  verified boolean, overall_score integer, interest_score integer, value_score integer,
  lifestyle_score integer, reasons text[]
)
language sql stable security invoker set search_path='' as $$
  with me as (
    select p.*, pref.desired_traits, pref.preferred_interests, pref.preferred_values,
           pref.preferred_lifestyle, pref.age_min, pref.age_max
    from public.profiles p join public.preferences pref on pref.user_id=p.id
    where p.id=auth.uid()
  ), candidates as (
    select p.*,
      coalesce((select count(*) from unnest(p.interests) x where x=any(coalesce(nullif(me.preferred_interests,'{}'),me.interests))),0)::int as interest_hits,
      coalesce((select count(*) from unnest(p.relationship_values) x where x=any(coalesce(nullif(me.preferred_values,'{}'),me.desired_traits))),0)::int as value_hits,
      coalesce((select count(*) from unnest(p.lifestyle) x where x=any(coalesce(nullif(me.preferred_lifestyle,'{}'),me.lifestyle))),0)::int as lifestyle_hits
    from public.profiles p cross join me
    where p.id<>me.id and p.profile_visible and p.onboarding_complete
      and (p.birth_year is null or extract(year from current_date)::int-p.birth_year between me.age_min and me.age_max)
  )
  select c.id,c.nickname,c.avatar_url,c.school,c.major,c.birth_year,c.personality,c.bio,c.interests,c.lifestyle,c.relationship_values,c.verified,
    least(99,55 + least(20,c.interest_hits*7)+least(15,c.value_hits*6)+least(10,c.lifestyle_hits*5))::int,
    least(100,45+c.interest_hits*18)::int,least(100,50+c.value_hits*20)::int,least(100,50+c.lifestyle_hits*18)::int,
    array_remove(array[
      case when c.value_hits>0 then '你们看重相似的关系品质' end,
      case when c.interest_hits>0 then '拥有可以一起探索的共同兴趣' end,
      case when c.lifestyle_hits>0 then '日常节奏更容易彼此适应' end,
      case when c.school=(select school from me) then '来自同一所校园' end
    ],null)
  from candidates c order by 13 desc,c.created_at desc limit greatest(1,least(result_limit,50));
$$;
grant execute on function public.get_match_recommendations(integer) to authenticated;
