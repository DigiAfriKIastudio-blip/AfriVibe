-- =============================================================================
-- AfriVibe — schéma Supabase proposé (NON exécuté par l'application)
--
-- Ce fichier prépare le branchement futur du backend. Il n'est pas utilisé par
-- la version actuelle (source de données locale). À exécuter dans l'éditeur SQL
-- de Supabase lors de la mise en place du projet.
--
-- Sécurité : RLS activé partout ; la clé `anon` étant publique, seules les
-- politiques ci-dessous autorisent les opérations.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Profils (1-1 avec auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 30),
  display_name text not null check (char_length(display_name) between 1 and 40),
  bio text default '' check (char_length(bio) <= 160),
  avatar_url text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Vidéos
-- ---------------------------------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  description text not null check (char_length(description) <= 300),
  video_url text not null,
  poster_url text,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  sound_name text not null default 'Son original',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists videos_created_at_idx on public.videos (created_at desc);
create index if not exists videos_author_idx on public.videos (author_id, created_at desc);
create index if not exists videos_tags_idx on public.videos using gin (tags);

-- ---------------------------------------------------------------------------
-- Commentaires
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid not null references public.videos (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists comments_video_idx on public.comments (video_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Interactions
-- ---------------------------------------------------------------------------
create table if not exists public.video_likes (
  video_id uuid not null references public.videos (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (video_id, profile_id)
);

create table if not exists public.video_saves (
  video_id uuid not null references public.videos (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (video_id, profile_id)
);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, profile_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('like', 'comment', 'follow', 'mention')),
  video_id uuid references public.videos (id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.comments enable row level security;
alter table public.video_likes enable row level security;
alter table public.video_saves enable row level security;
alter table public.comment_likes enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;

-- Lecture publique des profils et vidéos
create policy "profiles are readable" on public.profiles
  for select using (true);

create policy "users update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "videos are readable" on public.videos
  for select using (true);

create policy "users create their own videos" on public.videos
  for insert with check (auth.uid() = author_id);

create policy "users update their own videos" on public.videos
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "users delete their own videos" on public.videos
  for delete using (auth.uid() = author_id);

create policy "comments are readable" on public.comments
  for select using (true);

create policy "users create their own comments" on public.comments
  for insert with check (auth.uid() = author_id);

create policy "users delete their own comments" on public.comments
  for delete using (auth.uid() = author_id);

create policy "likes are readable" on public.video_likes
  for select using (true);

create policy "users manage their own likes" on public.video_likes
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "saves are private to their owner" on public.video_saves
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "comment likes are readable" on public.comment_likes
  for select using (true);

create policy "users manage their own comment likes" on public.comment_likes
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "follows are readable" on public.follows
  for select using (true);

create policy "users manage their own follows" on public.follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

create policy "users read their notifications" on public.notifications
  for select using (auth.uid() = recipient_id);

create policy "users update their notifications" on public.notifications
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- =============================================================================
-- Vue de statistiques (facilite les compteurs côté application)
-- =============================================================================
create or replace view public.video_stats as
select
  v.id as video_id,
  (select count(*) from public.video_likes l where l.video_id = v.id) as likes,
  (select count(*) from public.comments c where c.video_id = v.id) as comments,
  (select count(*) from public.video_saves s where s.video_id = v.id) as saves
from public.videos v;
