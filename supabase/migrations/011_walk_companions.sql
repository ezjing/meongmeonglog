-- 같이 산책: 같이 간 가족, 같은 강아지의 동시 산책 금지, 기록 수정 권한.

create table public.walk_companions (
  walk_id uuid not null references public.walks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key (walk_id, user_id)
);

create index walk_companions_user_id on public.walk_companions (user_id);

alter table public.walk_companions enable row level security;

-- 읽기는 그 산책 집의 구성원. 넣기는 기록한 사람만, 대상은 그 집 구성원(기록한 사람 제외).
-- 저장 후 수정은 없다. 행 삭제는 산책·계정 삭제의 cascade로만 한다.
create policy "walk_companions_select_member" on public.walk_companions
for select using (public.is_household_member(public.walk_household_id(walk_id)));

create policy "walk_companions_insert_recorder" on public.walk_companions
for insert with check (
  user_id <> auth.uid()
  and exists (
    select 1
    from public.walks as walk
    where walk.id = walk_id
      and walk.recorded_by = auth.uid()
  )
  and exists (
    select 1
    from public.household_members as member
    where member.household_id = public.walk_household_id(walk_id)
      and member.user_id = walk_companions.user_id
  )
);

grant select, insert on public.walk_companions to authenticated;
grant select, insert, update, delete on public.walk_companions to service_role;

-- 다른 사람의 끝나지 않은 산책(시작 후 6시간 이내)에 그 강아지가 있으면 막는다.
-- 내가 끝내지 않은 산책은 막지 않는다. 옛 앱의 walks insert도 이 트리거를 탄다.
create or replace function public.tg_reject_walk_in_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_dog uuid := new.dog_id;
  current_walk uuid;
begin
  if tg_table_name = 'walk_dogs' then
    current_walk := new.walk_id;
  else
    current_walk := new.id;
  end if;

  -- 구성원은 강아지 행을 수정할 수 없어, 잠금은 이 함수(소유자 권한)에서 한다.
  perform 1
  from public.dogs as dog
  where dog.id = target_dog
  for update;

  if exists (
    select 1
    from public.walks as walk
    where walk.ended_at is null
      and walk.started_at > now() - interval '6 hours'
      and walk.recorded_by is distinct from auth.uid()
      -- 방금 만든 산책(대표 강아지를 연결하는 트리거)은 자기 자신과 겹치지 않는다
      and walk.id is distinct from current_walk
      and (
        walk.dog_id = target_dog
        or exists (
          select 1
          from public.walk_dogs as link
          where link.walk_id = walk.id
            and link.dog_id = target_dog
        )
      )
  ) then
    raise exception 'walk_in_progress';
  end if;

  return new;
end;
$$;

create trigger walks_reject_in_progress
before insert on public.walks
for each row
execute function public.tg_reject_walk_in_progress();

create trigger walk_dogs_reject_in_progress
before insert on public.walk_dogs
for each row
execute function public.tg_reject_walk_in_progress();

revoke all on function public.tg_reject_walk_in_progress() from public, anon, authenticated;

-- 요청자가 그 산책을 볼 수 있으면 기록한 사람, 이어서 같이 간 가족의 호칭.
-- 집을 나간 사람의 호칭도 포함한다. 탈퇴해 계정이 없으면 userId·title이 비어 있다.
create or replace function public.walk_people(walk_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'userId', person.user_id,
        'title', person.title,
        'isRecorder', person.is_recorder
      )
      order by person.sort_key, person.user_id
    ),
    '[]'::jsonb
  )
  from (
    select
      walk.recorded_by as user_id,
      account.guardian_title as title,
      true as is_recorder,
      0 as sort_key
    from public.walks as walk
    left join public.users as account on account.id = walk.recorded_by
    where walk.id = $1
      and public.is_household_member(public.walk_household_id(walk.id))
    union all
    select
      companion.user_id,
      account.guardian_title,
      false,
      1
    from public.walk_companions as companion
    left join public.users as account on account.id = companion.user_id
    where companion.walk_id = $1
      and public.is_household_member(public.walk_household_id(companion.walk_id))
  ) as person;
$$;

-- 집 구성원이 볼 수 있는 강아지 중, 다른 가족이 6시간 안에 시작한 끝나지 않은 산책.
create or replace function public.active_walks_for_dogs(dog_ids uuid[])
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'dogId', picked.dog_id,
        'dogName', picked.dog_name,
        'recorderTitle', picked.recorder_title
      )
      order by picked.dog_id
    ),
    '[]'::jsonb
  )
  from (
    select distinct on (dog.id)
      dog.id as dog_id,
      dog.name as dog_name,
      account.guardian_title as recorder_title
    from public.dogs as dog
    join public.walk_dogs as link on link.dog_id = dog.id
    join public.walks as walk on walk.id = link.walk_id
    left join public.users as account on account.id = walk.recorded_by
    where dog.id = any (coalesce($1, '{}'::uuid[]))
      and public.is_household_member(dog.household_id)
      and walk.ended_at is null
      and walk.started_at > now() - interval '6 hours'
      and walk.recorded_by is distinct from auth.uid()
    order by dog.id, walk.started_at desc
  ) as picked;
$$;

revoke all on function public.walk_people(uuid) from public, anon;
revoke all on function public.active_walks_for_dogs(uuid[]) from public, anon;
grant execute on function public.walk_people(uuid) to authenticated, service_role;
grant execute on function public.active_walks_for_dogs(uuid[]) to authenticated, service_role;

-- 배변 기록·사진 행·일기 내용의 수정·삭제는 기록한 사람과 집 관리자만.
-- 읽기·넣기는 지금처럼 집 구성원. 일기 삭제와 공유 링크는 기존 정책을 유지한다.
create or replace function public.is_walk_recorder_or_admin(target_walk_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.walks as walk
    where walk.id = target_walk_id
      and (
        walk.recorded_by = auth.uid()
        or public.is_household_admin(public.walk_household_id(walk.id))
      )
  );
$$;

revoke all on function public.is_walk_recorder_or_admin(uuid) from public, anon;
grant execute on function public.is_walk_recorder_or_admin(uuid) to authenticated, service_role;

drop policy if exists "walk_events_member" on public.walk_events;
drop policy if exists "walk_photos_member" on public.walk_photos;
drop policy if exists "diaries_update_member" on public.diaries;

create policy "walk_events_select_member" on public.walk_events
for select using (public.is_household_member(public.walk_household_id(walk_id)));

create policy "walk_events_insert_member" on public.walk_events
for insert with check (public.is_household_member(public.walk_household_id(walk_id)));

create policy "walk_events_update_recorder_or_admin" on public.walk_events
for update
using (public.is_walk_recorder_or_admin(walk_id))
with check (public.is_walk_recorder_or_admin(walk_id));

create policy "walk_events_delete_recorder_or_admin" on public.walk_events
for delete using (public.is_walk_recorder_or_admin(walk_id));

create policy "walk_photos_select_member" on public.walk_photos
for select using (public.is_household_member(public.walk_household_id(walk_id)));

create policy "walk_photos_insert_member" on public.walk_photos
for insert with check (public.is_household_member(public.walk_household_id(walk_id)));

create policy "walk_photos_update_recorder_or_admin" on public.walk_photos
for update
using (public.is_walk_recorder_or_admin(walk_id))
with check (public.is_walk_recorder_or_admin(walk_id));

create policy "walk_photos_delete_recorder_or_admin" on public.walk_photos
for delete using (public.is_walk_recorder_or_admin(walk_id));

create policy "diaries_update_recorder_or_admin" on public.diaries
for update
using (public.is_walk_recorder_or_admin(walk_id))
with check (public.is_walk_recorder_or_admin(walk_id));
