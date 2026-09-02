-- Let a sender remove their own message; participants may clear their own view of a conversation.
alter table public.messages add column if not exists deleted_at timestamptz;
create or replace function public.delete_my_message(target_message uuid) returns void language plpgsql security definer set search_path='' as $$ begin update public.messages set deleted_at=now(),content='[消息已删除]' where id=target_message and sender_id=auth.uid(); if not found then raise exception 'Message unavailable'; end if; end; $$;
grant execute on function public.delete_my_message(uuid) to authenticated;
