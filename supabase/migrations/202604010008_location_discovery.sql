-- Privacy-preserving approximate location and nearby compatibility discovery.
create table public.user_locations(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 latitude numeric(5,2) not null check(latitude between -90 and 90),
 longitude numeric(6,2) not null check(longitude between -180 and 180),
 accuracy_m integer,
 enabled boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.user_locations enable row level security;
create policy "Users read own location" on public.user_locations for select to authenticated using(auth.uid()=user_id);
create policy "Users insert own location" on public.user_locations for insert to authenticated with check(auth.uid()=user_id);
create policy "Users update own location" on public.user_locations for update to authenticated using(auth.uid()=user_id)with check(auth.uid()=user_id);
create policy "Users delete own location" on public.user_locations for delete to authenticated using(auth.uid()=user_id);

create or replace function public.save_approximate_location(lat double precision,lng double precision,accuracy integer default null)
returns void language plpgsql security definer set search_path='' as $$begin
 if not public.can_interact(auth.uid())then raise exception'Account is not eligible to interact';end if;
 if lat not between -90 and 90 or lng not between -180 and 180 then raise exception'Invalid coordinates';end if;
 insert into public.user_locations(user_id,latitude,longitude,accuracy_m,enabled,updated_at)
 values(auth.uid(),round(lat::numeric,2),round(lng::numeric,2),greatest(0,accuracy),true,now())
 on conflict(user_id)do update set latitude=excluded.latitude,longitude=excluded.longitude,accuracy_m=excluded.accuracy_m,enabled=true,updated_at=now();
end;$$;grant execute on function public.save_approximate_location(double precision,double precision,integer)to authenticated;

create or replace function public.disable_location()
returns void language sql security definer set search_path='' as $$update public.user_locations set enabled=false,updated_at=now()where user_id=auth.uid()$$;
grant execute on function public.disable_location()to authenticated;

create or replace function public.get_nearby_discovery(result_limit integer default 20,max_distance_km integer default 100)
returns table(user_id uuid,nickname text,avatar_url text,school text,major text,birth_year smallint,personality text,bio text,interests text[],verified boolean,overall_score integer,interest_score integer,value_score integer,lifestyle_score integer,reasons text[],distance_km numeric,bearing_degrees numeric)
language sql stable security definer set search_path='' as $$
with me as(
 select p.*,pref.desired_traits,pref.preferred_interests,pref.preferred_values,pref.preferred_lifestyle,l.latitude lat,l.longitude lng
 from public.profiles p join public.preferences pref on pref.user_id=p.id join public.user_locations l on l.user_id=p.id and l.enabled where p.id=auth.uid()
), scored as(
 select p.*,l.latitude lat,l.longitude lng,
  6371*2*asin(sqrt(power(sin(radians((l.latitude-me.lat)::double precision)/2),2)+cos(radians(me.lat::double precision))*cos(radians(l.latitude::double precision))*power(sin(radians((l.longitude-me.lng)::double precision)/2),2))) distance,
  degrees(atan2(sin(radians((l.longitude-me.lng)::double precision))*cos(radians(l.latitude::double precision)),cos(radians(me.lat::double precision))*sin(radians(l.latitude::double precision))-sin(radians(me.lat::double precision))*cos(radians(l.latitude::double precision))*cos(radians((l.longitude-me.lng)::double precision)))) bearing,
  coalesce((select count(*)from unnest(p.interests)x where x=any(coalesce(nullif(me.preferred_interests,'{}'),me.interests))),0)::int ih,
  coalesce((select count(*)from unnest(p.relationship_values)x where x=any(coalesce(nullif(me.preferred_values,'{}'),me.desired_traits))),0)::int vh,
  coalesce((select count(*)from unnest(p.lifestyle)x where x=any(coalesce(nullif(me.preferred_lifestyle,'{}'),me.lifestyle))),0)::int lh
 from public.profiles p join public.user_locations l on l.user_id=p.id and l.enabled cross join me
 where p.id<>me.id and p.profile_visible and p.onboarding_complete and p.account_status='active'
), final as(select *,least(99,55+least(20,ih*7)+least(15,vh*6)+least(10,lh*5))::int score from scored)
select id,nickname,avatar_url,school,major,birth_year,personality,bio,interests,verified,score,least(100,45+ih*18)::int,least(100,50+vh*20)::int,least(100,50+lh*18)::int,
 array_remove(array[case when vh>0 then'价值观彼此呼应'end,case when ih>0 then'拥有共同兴趣'end,case when lh>0 then'生活节奏相近'end,case when distance<10 then'就在你附近'end],null),round(distance::numeric,1),round(((bearing+360)::numeric%360),1)
from final where distance<=greatest(1,least(max_distance_km,500))order by score desc,distance asc limit greatest(1,least(result_limit,50));
$$;grant execute on function public.get_nearby_discovery(integer,integer)to authenticated;
