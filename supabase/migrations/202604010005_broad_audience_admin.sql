-- Expand Tongpin to a strictly 18+ audience across life stages.
alter table public.profiles drop constraint if exists profiles_birth_year_check;
alter table public.profiles add constraint profiles_birth_year_check check(birth_year between 1940 and extract(year from current_date)::int-18);
alter table public.profiles
 add column if not exists life_stage text not null default '大学' check(life_stage in('高中阶段（已满18岁）','大学','研究生','职场','自由职业','创业','其他')),
 add column if not exists city text check(char_length(city)<=80),
 add column if not exists occupation text check(char_length(occupation)<=100),
 add column if not exists industry text check(char_length(industry)<=100),
 add column if not exists organization text check(char_length(organization)<=120),
 add column if not exists verification_type text check(verification_type in('school','work','identity')),
 add column if not exists is_admin boolean not null default false;
alter table public.preferences
 add column if not exists preferred_life_stages text[] not null default '{}',
 add column if not exists same_city_only boolean not null default false;

create table public.verification_requests(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 verification_type text not null check(verification_type in('school','work','identity')),organization text not null check(char_length(organization) between 2 and 120),
 evidence_url text,contact_email text not null,status text not null default 'pending' check(status in('pending','reviewing','approved','rejected')),
 reviewer_note text check(char_length(reviewer_note)<=500),created_at timestamptz not null default now(),reviewed_at timestamptz
);
alter table public.verification_requests enable row level security;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$select coalesce((select is_admin from public.profiles where id=auth.uid()),false)$$;
grant execute on function public.is_admin() to authenticated;
create policy "Users submit verification" on public.verification_requests for insert to authenticated with check(auth.uid()=user_id);
create policy "Users read own verification" on public.verification_requests for select to authenticated using(auth.uid()=user_id or public.is_admin());
create policy "Admins update verification" on public.verification_requests for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "Admins read reports" on public.reports for select to authenticated using(public.is_admin() or auth.uid()=reporter_id);
create policy "Admins update reports" on public.reports for update to authenticated using(public.is_admin()) with check(public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('verification-evidence','verification-evidence',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;
create policy "Users upload own evidence" on storage.objects for insert to authenticated with check(bucket_id='verification-evidence' and(storage.foldername(name))[1]=auth.uid()::text);
create policy "Users read own evidence" on storage.objects for select to authenticated using(bucket_id='verification-evidence' and((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));

create or replace function public.review_verification(request_id uuid,decision text,note text default null)
returns void language plpgsql security definer set search_path='' as $$declare uid uuid;vtype text;begin
 if not public.is_admin() then raise exception 'Admin required';end if;if decision not in('approved','rejected')then raise exception 'Invalid decision';end if;
 update public.verification_requests set status=decision,reviewer_note=note,reviewed_at=now() where id=request_id returning user_id,verification_type into uid,vtype;
 if decision='approved'then update public.profiles set verified=true,verification_type=vtype where id=uid;end if;
end;$$;grant execute on function public.review_verification(uuid,text,text) to authenticated;
create or replace function public.end_match(target_match uuid) returns void language plpgsql security definer set search_path='' as $$begin update public.matches set active=false where id=target_match and(auth.uid()=user_a or auth.uid()=user_b);if not found then raise exception 'Match not found';end if;end;$$;grant execute on function public.end_match(uuid) to authenticated;

create or replace function public.get_preference_recommendations(page_size integer default 12,page_offset integer default 0)
returns table(user_id uuid,nickname text,avatar_url text,school text,major text,birth_year smallint,personality text,bio text,interests text[],lifestyle text[],relationship_values text[],verified boolean,overall_score integer,interest_score integer,value_score integer,lifestyle_score integer,reasons text[])
language sql stable security invoker set search_path='' as $$
 with me as(select p.*,pr.* from public.profiles p join public.preferences pr on pr.user_id=p.id where p.id=auth.uid()),s as(
 select p.*,coalesce((select count(*)from unnest(p.interests)x where x=any(coalesce(nullif(me.preferred_interests,'{}'),me.interests))),0)::int ih,coalesce((select count(*)from unnest(p.relationship_values)x where x=any(coalesce(nullif(me.preferred_values,'{}'),me.desired_traits))),0)::int vh,coalesce((select count(*)from unnest(p.lifestyle)x where x=any(coalesce(nullif(me.preferred_lifestyle,'{}'),me.lifestyle))),0)::int lh,me.city me_city,me.minimum_match_score,me.recommendation_sort
 from public.profiles p cross join me where p.id<>me.id and p.profile_visible and p.onboarding_complete and(extract(year from current_date)::int-p.birth_year)>=18
 and(cardinality(me.preferred_life_stages)=0 or p.life_stage=any(me.preferred_life_stages))and(not me.same_city_only or p.city=me.city)and(not me.same_school_only or p.school=me.school)and(not me.verified_only or p.verified)and(cardinality(me.preferred_genders)=0 or p.gender=any(me.preferred_genders))and(extract(year from current_date)::int-p.birth_year between me.age_min and me.age_max)and not exists(select 1 from public.user_blocks b where(b.blocker_id=me.id and b.blocked_id=p.id)or(b.blocker_id=p.id and b.blocked_id=me.id))),r as(select s.*,least(99,55+least(20,ih*7)+least(15,vh*6)+least(10,lh*5))::int score from s)
 select r.id,r.nickname,r.avatar_url,r.school,r.major,r.birth_year,r.personality,r.bio,r.interests,r.lifestyle,r.relationship_values,r.verified,r.score,least(100,45+r.ih*18)::int,least(100,50+r.vh*20)::int,least(100,50+r.lh*18)::int,array_remove(array[case when r.vh>0 then'符合你看重的关系品质'end,case when r.ih>0 then'命中你的偏好兴趣'end,case when r.city=r.me_city then'生活在同一座城市'end,case when r.verified then'身份已完成认证'end,('人生阶段：'||r.life_stage)],null)
 from r where r.score>=r.minimum_match_score order by r.score desc,r.created_at desc limit greatest(1,least(page_size,24))offset greatest(0,page_offset);
$$;grant execute on function public.get_preference_recommendations(integer,integer) to authenticated;
