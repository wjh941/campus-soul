-- Restrict notification creation to server-authorized relationship events.
-- The client never needs to notify an arbitrary account directly.
create or replace function public.notify_user(target uuid,event_type text,event_title text,event_body text,event_link text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target is null or target = auth.uid() or not exists (
    select 1 from public.matches m
    where m.active and ((m.user_a=auth.uid() and m.user_b=target) or (m.user_b=auth.uid() and m.user_a=target))
  ) then raise exception 'Notification target is not authorized'; end if;
  if length(coalesce(event_type,''))>40 or length(coalesce(event_title,''))>160 or length(coalesce(event_body,''))>1000 or length(coalesce(event_link,''))>200 then raise exception 'Notification payload too large'; end if;
  insert into public.notifications(user_id,type,title,body,link) values(target,event_type,event_title,event_body,event_link);
end; $$;
revoke execute on function public.notify_user(uuid,text,text,text,text) from public;
grant execute on function public.notify_user(uuid,text,text,text,text) to authenticated;
