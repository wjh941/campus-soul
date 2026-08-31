-- P0: prevent clients from changing privileged profile fields through direct table updates.
-- The frontend currently sends only profile-editable fields; this trigger is defense in depth.
create or replace function public.guard_profile_sensitive_fields()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() = old.id and not public.is_admin() and coalesce(current_setting('app.allow_profile_sensitive_update', true),'off') <> 'on' then
    new.id := old.id;
    new.is_admin := old.is_admin;
    new.verified := old.verified;
    new.verification_type := old.verification_type;
    new.account_status := old.account_status;
    new.muted_until := old.muted_until;
    new.accepted_terms_at := old.accepted_terms_at;
    new.accepted_privacy_at := old.accepted_privacy_at;
    if old.birth_date is not null or new.birth_date is null or new.birth_date > current_date - interval '18 years' then new.birth_date := old.birth_date; end if;
  end if;
  return new;
end; $$;
drop trigger if exists guard_profile_sensitive_fields on public.profiles;
create trigger guard_profile_sensitive_fields before update on public.profiles for each row execute function public.guard_profile_sensitive_fields();

-- The dedicated legal RPC is the only non-admin path allowed to set birth date and consent.
create or replace function public.accept_legal(birthday date)
returns void language plpgsql security definer set search_path='' as $$
begin
  if birthday is null or birthday > current_date - interval '18 years' then raise exception 'You must be 18 or older'; end if;
  perform set_config('app.allow_profile_sensitive_update','on',true);
  update public.profiles set birth_date=birthday,birth_year=extract(year from birthday)::int,accepted_terms_at=now(),accepted_privacy_at=now() where id=auth.uid();
end; $$;
grant execute on function public.accept_legal(date) to authenticated;
