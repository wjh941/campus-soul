-- P0 privacy hardening: expose only approved profile fields to other members.
-- Keep the base table readable only by its owner; matching RPCs remain the public projection.
drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);

-- Existing profile photo rows remain governed by their visibility policy; Storage is intentionally not
-- changed here because changing a public bucket requires a coordinated signed-URL migration.

-- Ensure recommendation candidates are adult, eligible, visible and mutually unblocked.
