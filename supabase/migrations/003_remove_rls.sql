-- RLS 정책 제거 및 RLS 비활성화 (개발용)

-- public 테이블 정책 삭제
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

-- public 테이블 RLS 비활성화
alter table public.users disable row level security;
alter table public.dogs disable row level security;
alter table public.walks disable row level security;
alter table public.walk_locations disable row level security;
alter table public.walk_events disable row level security;
alter table public.walk_photos disable row level security;
alter table public.diaries disable row level security;
alter table public.share_cards disable row level security;

-- storage 정책 삭제
drop policy if exists "dog_profiles_own" on storage.objects;
drop policy if exists "walk_photos_storage_own" on storage.objects;
drop policy if exists "share_cards_storage_own" on storage.objects;

-- storage: 인증 없이 버킷 접근 허용 (RLS는 유지, 정책만 개방)
create policy "dog_profiles_allow_all" on storage.objects
  for all using (bucket_id = 'dog-profiles')
  with check (bucket_id = 'dog-profiles');

create policy "walk_photos_allow_all" on storage.objects
  for all using (bucket_id = 'walk-photos')
  with check (bucket_id = 'walk-photos');

create policy "share_cards_allow_all" on storage.objects
  for all using (bucket_id = 'share-cards')
  with check (bucket_id = 'share-cards');
