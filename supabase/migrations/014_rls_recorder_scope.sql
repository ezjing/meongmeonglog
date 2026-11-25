-- 산책 기록을 쓰는 권한을 그 산책을 시작한 사람(기록자) 또는 집 관리자로 맞춘다.
-- 보기(select)는 집 구성원 그대로다.
-- 이미 기록자·관리자만 허용하던 수정·삭제, 좌표, 같이 간 가족, 공유 링크, 사진 파일은 바꾸지 않는다.
-- 권한 판단은 011의 is_walk_recorder_or_admin을 쓴다.

drop policy if exists "walks_update_member" on public.walks;

create policy "walks_update_recorder_or_admin" on public.walks
for update
using (public.is_walk_recorder_or_admin(id))
with check (
  public.is_walk_recorder_or_admin(id)
  and exists (
    select 1
    from public.dogs as dog
    where dog.id = dog_id
      and public.is_household_member(dog.household_id)
  )
);

-- 강아지 연결: 보기는 집 구성원. 넣기·수정·삭제는 기록자 또는 관리자.
-- 대표 강아지와 같은 집 강아지만 연결할 수 있다 (010).
drop policy if exists "walk_dogs_member" on public.walk_dogs;

create policy "walk_dogs_select_member" on public.walk_dogs
for select using (public.is_household_member(public.walk_household_id(walk_id)));

create policy "walk_dogs_insert_recorder_or_admin" on public.walk_dogs
for insert with check (
  public.is_walk_recorder_or_admin(walk_id)
  and exists (
    select 1
    from public.walks as walk
    join public.dogs as representative on representative.id = walk.dog_id
    join public.dogs as member_dog on member_dog.id = walk_dogs.dog_id
    where walk.id = walk_dogs.walk_id
      and representative.household_id = member_dog.household_id
      and public.is_household_member(representative.household_id)
  )
);

create policy "walk_dogs_update_recorder_or_admin" on public.walk_dogs
for update
using (public.is_walk_recorder_or_admin(walk_id))
with check (
  public.is_walk_recorder_or_admin(walk_id)
  and exists (
    select 1
    from public.walks as walk
    join public.dogs as representative on representative.id = walk.dog_id
    join public.dogs as member_dog on member_dog.id = walk_dogs.dog_id
    where walk.id = walk_dogs.walk_id
      and representative.household_id = member_dog.household_id
      and public.is_household_member(representative.household_id)
  )
);

create policy "walk_dogs_delete_recorder_or_admin" on public.walk_dogs
for delete using (public.is_walk_recorder_or_admin(walk_id));

drop policy if exists "walk_events_insert_member" on public.walk_events;

create policy "walk_events_insert_recorder_or_admin" on public.walk_events
for insert with check (
  public.is_walk_recorder_or_admin(walk_id)
  and exists (
    select 1
    from public.walk_dogs as link
    where link.walk_id = walk_events.walk_id
      and link.dog_id = walk_events.dog_id
  )
);

drop policy if exists "walk_photos_insert_member" on public.walk_photos;

create policy "walk_photos_insert_recorder_or_admin" on public.walk_photos
for insert with check (public.is_walk_recorder_or_admin(walk_id));

drop policy if exists "diaries_insert_member" on public.diaries;

create policy "diaries_insert_recorder_or_admin" on public.diaries
for insert with check (
  public.is_walk_recorder_or_admin(walk_id)
  and exists (
    select 1
    from public.walk_dogs as link
    where link.walk_id = diaries.walk_id
      and link.dog_id = diaries.dog_id
  )
);
