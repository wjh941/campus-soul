-- Explainable v2 recommendations. Run after 202604010013.
drop function if exists public.get_intelligent_matches_v2(integer);
create or replace function public.get_intelligent_matches_v2(result_limit integer default 30)
returns table(user_id uuid,nickname text,avatar_url text,school text,major text,birth_year smallint,personality text,bio text,interests text[],verified boolean,overall_score integer,value_score integer,lifestyle_score integer,interest_score integer,communication_score integer,intent_score integer,reasons text[],topics text[],analysis jsonb)
language sql stable security definer set search_path='' as $func$
with me as (select p.id,pr.ideal_requirements,pr.match_weights from public.profiles p join public.preferences pr on pr.user_id=p.id where p.id=auth.uid()), candidates as (
 select p.id,p.nickname,p.avatar_url,p.school,p.major,p.birth_year,p.personality,p.bio,p.interests,p.verified,p.created_at,m.match_weights,
  least(100,50+coalesce((select count(*) from unnest(p.relationship_values) x where x=any(coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(m.ideal_requirements->'values','[]'::jsonb))), '{}'::text[]))),0)*10)::int val,
  least(100,45+coalesce((select count(*) from unnest(p.interests) x where x=any(coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(m.ideal_requirements->'interests','[]'::jsonb))), '{}'::text[]))),0)*12)::int interest,
  least(100,48+coalesce((select count(*) from unnest(p.lifestyle) x where x=any(coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(m.ideal_requirements->'lifestyle','[]'::jsonb))), '{}'::text[]))),0)*12)::int life,
  case when p.personality=m.ideal_requirements->>'personality' then 92 else 62 end::int communication,
  case when p.relationship_values&&coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(m.ideal_requirements->'values','[]'::jsonb))), '{}'::text[]) then 88 else 64 end::int intent
 from public.profiles p cross join me m
 where p.id<>m.id and p.profile_visible and p.onboarding_complete and p.assessment_completed and p.account_status='active'
 and not exists(select 1 from public.match_feedback f where f.user_id=m.id and f.target_user_id=p.id and f.feedback='not_fit')
)
select c.id,c.nickname,c.avatar_url,c.school,c.major,c.birth_year,c.personality,c.bio,c.interests,c.verified,
 round(c.val*coalesce((c.match_weights->>'values')::numeric,35)/100+c.life*coalesce((c.match_weights->>'lifestyle')::numeric,25)/100+c.interest*coalesce((c.match_weights->>'interests')::numeric,20)/100+c.communication*coalesce((c.match_weights->>'communication')::numeric,10)/100+c.intent*coalesce((c.match_weights->>'intent')::numeric,10)/100)::int,
 c.val,c.life,c.interest,c.communication,c.intent,
 array_remove(array[case when c.val>=75 then '关系价值观更接近' end,case when c.life>=70 then '生活节奏更容易相处' end,case when c.interest>=70 then '拥有可共同探索的兴趣' end,case when c.communication>=80 then '沟通方式可能更顺畅' end],null),
 array_remove(array[case when c.interest>=70 then '聊聊共同兴趣和第一次一起尝试的活动' end,case when c.life>=70 then '分享彼此理想的周末节奏' end,case when c.val>=75 then '聊聊关系中最看重的边界感' end],null),
 jsonb_build_object('values',c.val,'lifestyle',c.life,'interests',c.interest,'communication',c.communication,'intent',c.intent)
from candidates c order by 11 desc,c.created_at desc limit greatest(1,least(result_limit,50));
$func$;
grant execute on function public.get_intelligent_matches_v2(integer) to authenticated;
