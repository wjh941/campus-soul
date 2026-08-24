-- Campus Soul initial schema. Run with Supabase CLI migrations or paste into SQL Editor.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '新同学' check (char_length(nickname) between 1 and 30),
  avatar_url text,
  school text not null default '认证高校' check (char_length(school) <= 80),
  major text check (char_length(major) <= 80),
  grade text check (char_length(grade) <= 30),
  bio text check (char_length(bio) <= 500),
  interests text[] not null default '{}',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  desired_traits text[] not null default '{}',
  relationship_intent text not null default '认真了解',
  interaction_frequency smallint not null default 50 check (interaction_frequency between 0 and 100),
  age_min smallint not null default 18 check (age_min >= 18),
  age_max smallint not null default 28 check (age_max >= age_min and age_max <= 40),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  image_url text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_created_at_idx on public.posts(created_at desc);
create index posts_author_idx on public.posts(author_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments(post_id, created_at);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nickname, school, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nickname', ''), split_part(new.email, '@', 1), '新同学'),
    coalesce(nullif(new.raw_user_meta_data ->> 'school', ''), '认证高校'),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  insert into public.preferences (user_id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;

create policy "Authenticated users can read profiles" on public.profiles for select to authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users read own preferences" on public.preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users update own preferences" on public.preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Authenticated users read posts" on public.posts for select to authenticated using (true);
create policy "Users create own posts" on public.posts for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Users update own posts" on public.posts for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "Users delete own posts" on public.posts for delete to authenticated using ((select auth.uid()) = author_id);
create policy "Authenticated users read comments" on public.comments for select to authenticated using (true);
create policy "Users create own comments" on public.comments for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Users update own comments" on public.comments for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "Users delete own comments" on public.comments for delete to authenticated using ((select auth.uid()) = author_id);
create policy "Authenticated users read likes" on public.post_likes for select to authenticated using (true);
create policy "Users create own likes" on public.post_likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users delete own likes" on public.post_likes for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "Public post images are readable" on storage.objects for select using (bucket_id = 'post-images');
create policy "Users upload to own post folder" on storage.objects for insert to authenticated with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users update own post images" on storage.objects for update to authenticated using (bucket_id = 'post-images' and owner_id = (select auth.uid()::text));
create policy "Users delete own post images" on storage.objects for delete to authenticated using (bucket_id = 'post-images' and owner_id = (select auth.uid()::text));
