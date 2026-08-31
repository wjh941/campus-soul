-- P0 privacy and matching hardening.
-- Keep profile media private; signed URLs must be issued by an authenticated server path.
update storage.buckets set public=false where id='profile-media';
drop policy if exists "Public profile media is readable" on storage.objects;
drop policy if exists "Authenticated users read visible profile media" on storage.objects;
create policy "Users read own profile media" on storage.objects for select to authenticated
using(bucket_id='profile-media' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Serialize opposite heart writes by locking both profile rows in deterministic order.
create or replace function public.send_heart(target_user uuid)
returns table(matched boolean,match_id uuid) language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); low_user uuid; high_user uuid; created_match uuid;
begin
 if me is null or not public.can_interact(me) then raise exception 'Account is not eligible to interact'; end if;
 if target_user is null or me=target_user then raise exception 'Invalid target user'; end if;
 low_user:=least(me,target_user); high_user:=greatest(me,target_user);
 perform 1 from public.profiles where id in (low_user,high_user) order by id for update;
 if exists(select 1 from public.user_blocks b where (b.blocker_id=me and b.blocked_id=target_user) or (b.blocker_id=target_user and b.blocked_id=me)) then raise exception 'Profile unavailable'; end if;
 if not exists(select 1 from public.profiles where id=target_user and profile_visible and account_status='active' and birth_date is not null and birth_date<=current_date-interval '18 years' and accepted_terms_at is not null and accepted_privacy_at is not null) then raise exception 'Profile unavailable'; end if;
 insert into public.heart_signals(sender_id,receiver_id) values(me,target_user) on conflict do nothing;
 if exists(select 1 from public.heart_signals where sender_id=target_user and receiver_id=me) then
  insert into public.matches(user_a,user_b) values(low_user,high_user) on conflict(user_a,user_b) do update set active=true returning id into created_match;
  insert into public.conversation_reads(match_id,user_id) values(created_match,me),(created_match,target_user) on conflict do nothing;
  insert into public.notifications(user_id,type,title,body,link) values(target_user,'match','新的双向心动','你们已经互相心动，现在可以开始对话。','messages'),(me,'match','新的双向心动','你们已经互相心动，现在可以开始对话。','messages');
  return query select true,created_match;
 else return query select false,null::uuid; end if;
end; $$;
revoke execute on function public.send_heart(uuid) from public;
grant execute on function public.send_heart(uuid) to authenticated;
