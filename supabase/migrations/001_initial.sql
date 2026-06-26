-- 멍멍로그 MVP initial schema

create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (provider in ('kakao', 'naver')),
  email text,
  nickname text,
  profile_image text,
  created_at timestamptz not null default now()
);

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  breed text not null,
  birth_date date not null,
  gender text not null check (gender in ('MALE', 'FEMALE')),
  personality jsonb not null default '[]'::jsonb,
  speech_style text,
  custom_personality text,
  custom_speech_style text,
  profile_image_url text,
  created_at timestamptz not null default now()
);

create table public.walks (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_sec integer,
  distance_meter integer,
  weather_condition text,
  weather_temp numeric,
  weather_icon text,
  created_at timestamptz not null default now()
);

create table public.walk_locations (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid not null references public.walks(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  recorded_at timestamptz not null default now()
);

create table public.walk_events (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid not null unique references public.walks(id) on delete cascade,
  pee_count integer not null default 0,
  poop_count integer not null default 0,
  dog_meeting_level text not null default 'NONE'
    check (dog_meeting_level in ('NONE', 'ONE_TO_TWO', 'THREE_OR_MORE')),
  memo text
);

create table public.walk_photos (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid not null references public.walks(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.diaries (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid not null unique references public.walks(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  diary_content text not null,
  daily_quote text not null,
  ai_model text,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.share_cards (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.diaries(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create index idx_dogs_user_id on public.dogs(user_id);
create index idx_walks_dog_id on public.walks(dog_id);
create index idx_walk_locations_walk_id on public.walk_locations(walk_id);
create index idx_walk_photos_walk_id on public.walk_photos(walk_id);
create index idx_diaries_dog_id on public.diaries(dog_id);
create index idx_diaries_created_at on public.diaries(created_at);

alter table public.users enable row level security;
alter table public.dogs enable row level security;
alter table public.walks enable row level security;
alter table public.walk_locations enable row level security;
alter table public.walk_events enable row level security;
alter table public.walk_photos enable row level security;
alter table public.diaries enable row level security;
alter table public.share_cards enable row level security;

create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

create policy "dogs_all_own" on public.dogs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "walks_all_own" on public.walks for all using (
  exists (select 1 from public.dogs d where d.id = dog_id and d.user_id = auth.uid())
) with check (
  exists (select 1 from public.dogs d where d.id = dog_id and d.user_id = auth.uid())
);

create policy "walk_locations_all_own" on public.walk_locations for all using (
  exists (
    select 1 from public.walks w
    join public.dogs d on d.id = w.dog_id
    where w.id = walk_id and d.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.walks w
    join public.dogs d on d.id = w.dog_id
    where w.id = walk_id and d.user_id = auth.uid()
  )
);

create policy "walk_events_all_own" on public.walk_events for all using (
  exists (
    select 1 from public.walks w
    join public.dogs d on d.id = w.dog_id
    where w.id = walk_id and d.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.walks w
    join public.dogs d on d.id = w.dog_id
    where w.id = walk_id and d.user_id = auth.uid()
  )
);

create policy "walk_photos_all_own" on public.walk_photos for all using (
  exists (
    select 1 from public.walks w
    join public.dogs d on d.id = w.dog_id
    where w.id = walk_id and d.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.walks w
    join public.dogs d on d.id = w.dog_id
    where w.id = walk_id and d.user_id = auth.uid()
  )
);

create policy "diaries_all_own" on public.diaries for all using (
  exists (select 1 from public.dogs d where d.id = dog_id and d.user_id = auth.uid())
) with check (
  exists (select 1 from public.dogs d where d.id = dog_id and d.user_id = auth.uid())
);

create policy "share_cards_all_own" on public.share_cards for all using (
  exists (
    select 1 from public.diaries di
    join public.dogs d on d.id = di.dog_id
    where di.id = diary_id and d.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.diaries di
    join public.dogs d on d.id = di.dog_id
    where di.id = diary_id and d.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public) values
  ('dog-profiles', 'dog-profiles', true),
  ('walk-photos', 'walk-photos', true),
  ('share-cards', 'share-cards', true)
on conflict (id) do nothing;

create policy "dog_profiles_own" on storage.objects for all using (
  bucket_id = 'dog-profiles' and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'dog-profiles' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "walk_photos_storage_own" on storage.objects for all using (
  bucket_id = 'walk-photos' and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'walk-photos' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "share_cards_storage_own" on storage.objects for all using (
  bucket_id = 'share-cards' and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'share-cards' and auth.uid()::text = (storage.foldername(name))[1]
);
