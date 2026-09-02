-- Safe public profile projection for authenticated social surfaces.
create or replace view public.public_profiles with (security_invoker=true) as
select id,nickname,school,major,avatar_url,verified,city,life_stage
from public.profiles
where profile_visible and account_status='active' and onboarding_complete;
grant select on public.public_profiles to authenticated;

-- Allow authenticated users to read only visible profile-media objects.
drop policy if exists "Users read visible profile media" on storage.objects;
create policy "Users read visible profile media" on storage.objects for select to authenticated
using (
 bucket_id='profile-media' and exists (
   select 1 from public.profiles p
   where p.id=(storage.foldername(name))[1]::uuid
     and p.profile_visible and p.account_status='active' and p.onboarding_complete
 )
);
