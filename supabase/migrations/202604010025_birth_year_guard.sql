-- Keep the derived year immutable for client updates; exact birth_date is the source of truth.
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
    new.birth_date := old.birth_date;
    new.birth_year := old.birth_year;
  end if;
  return new;
end; $$;
