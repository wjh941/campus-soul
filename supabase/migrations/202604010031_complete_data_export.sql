-- Expand account export while keeping all records scoped to the authenticated user.
create or replace function public.export_my_data() returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object(
 'schema_version',2,'exported_at',now(),
 'profile',(select to_jsonb(p) from public.profiles p where p.id=auth.uid()),
 'preferences',(select to_jsonb(x) from public.preferences x where x.user_id=auth.uid()),
 'posts',coalesce((select jsonb_agg(to_jsonb(x)) from public.posts x where x.author_id=auth.uid()),'[]'::jsonb),
 'comments',coalesce((select jsonb_agg(to_jsonb(x)) from public.comments x where x.author_id=auth.uid()),'[]'::jsonb),
 'matches',coalesce((select jsonb_agg(to_jsonb(x)) from public.matches x where auth.uid() in(x.user_a,x.user_b)),'[]'::jsonb),
 'messages',coalesce((select jsonb_agg(to_jsonb(x)) from public.messages x where exists(select 1 from public.matches m where m.id=x.match_id and auth.uid() in(m.user_a,m.user_b))),'[]'::jsonb),
 'heart_signals',coalesce((select jsonb_agg(to_jsonb(x)) from public.heart_signals x where x.sender_id=auth.uid() or x.receiver_id=auth.uid()),'[]'::jsonb),
 'blocks',coalesce((select jsonb_agg(to_jsonb(x)) from public.user_blocks x where x.blocker_id=auth.uid() or x.blocked_id=auth.uid()),'[]'::jsonb),
 'reports',coalesce((select jsonb_agg(to_jsonb(x)) from public.reports x where x.reporter_id=auth.uid()),'[]'::jsonb),
 'notifications',coalesce((select jsonb_agg(to_jsonb(x)) from public.notifications x where x.user_id=auth.uid()),'[]'::jsonb),
 'conversation_reads',coalesce((select jsonb_agg(to_jsonb(x)) from public.conversation_reads x where x.user_id=auth.uid()),'[]'::jsonb),
 'anonymous_sessions',coalesce((select jsonb_agg(to_jsonb(x)) from public.anonymous_sessions x where auth.uid() in(x.user_a,x.user_b)),'[]'::jsonb),
 'anonymous_messages',coalesce((select jsonb_agg(to_jsonb(x)) from public.anonymous_messages x where x.sender_id=auth.uid()),'[]'::jsonb),
 'anonymous_games',coalesce((select jsonb_agg(to_jsonb(x)) from public.anonymous_games x where x.created_by=auth.uid()),'[]'::jsonb),
 'locations',coalesce((select jsonb_agg(to_jsonb(x)) from public.user_locations x where x.user_id=auth.uid()),'[]'::jsonb)
);
$$;
grant execute on function public.export_my_data() to authenticated;
