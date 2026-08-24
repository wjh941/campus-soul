-- Step 2B: feedback RPCs. Run after 202604010013_match_feedback_functions.sql.
create or replace function public.save_match_weights(weights jsonb) returns void language plpgsql security definer set search_path='' as $rpc$
declare total numeric;
begin
 if not public.can_interact(auth.uid()) then raise exception 'Account is not eligible to interact'; end if;
 total:=coalesce((weights->>'values')::numeric,0)+coalesce((weights->>'lifestyle')::numeric,0)+coalesce((weights->>'interests')::numeric,0)+coalesce((weights->>'communication')::numeric,0)+coalesce((weights->>'intent')::numeric,0);
 if total<>100 then raise exception 'Weights must total 100'; end if;
 update public.preferences set match_weights=weights,updated_at=now() where user_id=auth.uid();
end;
$rpc$;
grant execute on function public.save_match_weights(jsonb) to authenticated;
create or replace function public.save_match_feedback(target uuid,feedback_type text) returns void language plpgsql security definer set search_path='' as $rpc$
begin
 if feedback_type not in ('interested','not_now','not_fit') then raise exception 'Invalid feedback'; end if;
 insert into public.match_feedback(user_id,target_user_id,feedback) values(auth.uid(),target,feedback_type) on conflict(user_id,target_user_id) do update set feedback=excluded.feedback,created_at=now();
end;
$rpc$;
grant execute on function public.save_match_feedback(uuid,text) to authenticated;
