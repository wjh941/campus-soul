-- Atomically end a match for one of its participants.
create or replace function public.end_match(target_match uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.matches set active=false where id=target_match and auth.uid() in(user_a,user_b);
 if not found then raise exception 'Match unavailable'; end if;
end; $$;
revoke execute on function public.end_match(uuid) from public;
grant execute on function public.end_match(uuid) to authenticated;
