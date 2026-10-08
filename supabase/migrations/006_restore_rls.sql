-- 003_remove_rls(개발용)로 해제했던 RLS·Storage 정책을 001_initial 기준으로 복구

-- public 테이블 RLS 활성화
alter table public.users enable row level security;
alter table public.dogs enable row level security;
alter table public.walks enable row level security;
alter table public.walk_locations enable row level security;
alter table public.walk_events enable row level security;
alter table public.walk_photos enable row level security;
alter table public.diaries enable row level security;
alter table public.share_cards enable row level security;

-- public 테이블 정책 (본인 데이터만)
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "dogs_all_own" on public.dogs;
drop policy if exists "walks_all_own" on public.walks;
drop policy if exists "walk_locations_all_own" on public.walk_locations;
drop policy if exists "walk_events_all_own" on public.walk_events;
drop policy if exists "walk_photos_all_own" on public.walk_photos;
drop policy if exists "diaries_all_own" on public.diaries;
drop policy if exists "share_cards_all_own" on public.share_cards;

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

-- storage: 전체 개방 정책 제거 후 본인 폴더({userId}/...)만 허용
drop policy if exists "dog_profiles_allow_all" on storage.objects;
drop policy if exists "walk_photos_allow_all" on storage.objects;
drop policy if exists "share_cards_allow_all" on storage.objects;
drop policy if exists "dog_profiles_own" on storage.objects;
drop policy if exists "walk_photos_storage_own" on storage.objects;
drop policy if exists "share_cards_storage_own" on storage.objects;

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
