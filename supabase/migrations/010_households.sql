-- 가족: 집, 구성원, 초대 코드, 권한을 집 기준으로 바꾼다.
-- dogs.user_id는 "등록한 사람"으로 남긴다. 옛 앱은 user_id만 넣고, 트리거가 집을 채운다.
-- 사용자마다 가입 때 생긴 집이 하나 있다. 그 집은 그 사람의 household_members 중 joined_at이 가장 이른 행이다.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create unique index household_members_one_admin
  on public.household_members (household_id)
  where role = 'admin';

create index household_members_user_id on public.household_members (user_id);

-- 코드는 한 번 쓰면 다시 쓰지 않는다. 쓰지 않은 코드끼리 겹치지 않는 것보다 좁다.
create table public.household_invites (
  code text primary key check (code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.users(id) on delete set null
);

create index household_invites_household_id on public.household_invites (household_id);

create table public.household_invite_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  succeeded boolean not null
);

create index household_invite_attempts_user_time
  on public.household_invite_attempts (user_id, attempted_at desc);

-- 기존 사용자마다 집을 만들고 그 집의 관리자로 넣는다.
do $$
declare
  person record;
  new_household_id uuid;
begin
  for person in select id, created_at from public.users loop
    insert into public.households (created_at)
    values (person.created_at)
    returning id into new_household_id;

    insert into public.household_members (household_id, user_id, role, joined_at)
    values (new_household_id, person.id, 'admin', person.created_at);
  end loop;
end $$;

create or replace function public.tg_users_create_household()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
begin
  insert into public.households (created_at)
  values (new.created_at)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role, joined_at)
  values (new_household_id, new.id, 'admin', new.created_at);

  return new;
end;
$$;

create trigger users_create_household
after insert on public.users
for each row
execute function public.tg_users_create_household();

revoke all on function public.tg_users_create_household() from public, anon, authenticated;
grant execute on function public.tg_users_create_household() to service_role;

alter table public.dogs
  add column household_id uuid references public.households(id) on delete cascade;

update public.dogs as dog
set household_id = member.household_id
from (
  select distinct on (user_id) user_id, household_id
  from public.household_members
  order by user_id, joined_at asc
) as member
where member.user_id = dog.user_id
  and dog.household_id is null;

alter table public.dogs
  alter column household_id set not null;

create index idx_dogs_household_id on public.dogs (household_id);

-- 관리자가 탈퇴해도 강아지는 집에 남는다. 집째 지울 때는 Edge Function이 집을 지운다.
alter table public.dogs
  alter column user_id drop not null;

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'dogs'
    and con.contype = 'f'
    and exists (
      select 1
      from pg_attribute att
      where att.attrelid = rel.oid
        and att.attnum = any (con.conkey)
        and att.attname = 'user_id'
    );

  if constraint_name is null then
    raise exception 'dogs user_id foreign key not found';
  end if;

  execute format('alter table public.dogs drop constraint %I', constraint_name);
end $$;

alter table public.dogs
  add constraint dogs_user_id_fkey
  foreign key (user_id) references public.users(id) on delete set null;

-- 옛 앱은 household_id 없이 user_id만 넣는다. 그 사람의 집(가장 먼저 들어간 집)으로 채운다.
create or replace function public.tg_dogs_fill_household()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.household_id is null and new.user_id is not null then
    select member.household_id into new.household_id
    from public.household_members as member
    where member.user_id = new.user_id
    order by member.joined_at asc
    limit 1;
  end if;
  return new;
end;
$$;

create trigger dogs_fill_household
before insert on public.dogs
for each row
execute function public.tg_dogs_fill_household();

revoke all on function public.tg_dogs_fill_household() from public, anon;
grant execute on function public.tg_dogs_fill_household() to authenticated, service_role;

alter table public.walks
  add column recorded_by uuid references public.users(id) on delete set null;

update public.walks as walk
set recorded_by = dog.user_id
from public.dogs as dog
where dog.id = walk.dog_id
  and walk.recorded_by is null;

alter table public.walks
  alter column recorded_by set default auth.uid();

create index idx_walks_recorded_by on public.walks (recorded_by);

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members as member
    where member.household_id = target_household_id
      and member.user_id = auth.uid()
  );
$$;

create or replace function public.is_household_admin(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members as member
    where member.household_id = target_household_id
      and member.user_id = auth.uid()
      and member.role = 'admin'
  );
$$;

create or replace function public.walk_household_id(target_walk_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select dog.household_id
  from public.walks as walk
  join public.dogs as dog on dog.id = walk.dog_id
  where walk.id = target_walk_id;
$$;

-- 산책 사진 경로의 두 번째 칸({uid}/{walkId}/...)이 그 산책이고, 요청자가 그 집 관리자인지
create or replace function public.is_walk_photo_admin(walk_folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.walks as walk
    join public.dogs as dog on dog.id = walk.dog_id
    where walk.id::text = walk_folder
      and public.is_household_admin(dog.household_id)
  );
$$;

revoke all on function public.is_household_member(uuid) from public, anon;
revoke all on function public.is_household_admin(uuid) from public, anon;
revoke all on function public.walk_household_id(uuid) from public, anon;
revoke all on function public.is_walk_photo_admin(text) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated, service_role;
grant execute on function public.is_household_admin(uuid) to authenticated, service_role;
grant execute on function public.walk_household_id(uuid) to authenticated, service_role;
grant execute on function public.is_walk_photo_admin(text) to authenticated, service_role;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.household_invite_attempts enable row level security;

create policy "households_select_member" on public.households
for select using (public.is_household_member(id));

create policy "household_members_select_member" on public.household_members
for select using (public.is_household_member(household_id));

-- 같은 집 구성원에게는 호칭과 보호자 프로필 사진만 보인다.
-- 뷰 주인이 RLS를 우회하고, 아래 조건으로 같은 집만 거른다.
-- security invoker로 두면 users RLS 때문에 다른 가족의 행이 사라진다.
create view public.household_member_profiles
with (security_barrier = true, security_invoker = false) as
select
  member.household_id,
  member.user_id,
  member.role,
  member.joined_at,
  account.guardian_title,
  account.guardian_profile_image
from public.household_members as member
join public.users as account on account.id = member.user_id
where public.is_household_member(member.household_id);

grant select on public.households to authenticated, service_role;
grant select on public.household_members to authenticated, service_role;
grant select, insert, update, delete on public.households to service_role;
grant select, insert, update, delete on public.household_members to service_role;
grant select, insert, update, delete on public.household_invites to service_role;
grant select, insert, update, delete on public.household_invite_attempts to service_role;
grant usage, select on sequence public.household_invite_attempts_id_seq to service_role;
grant select on public.household_member_profiles to authenticated, service_role;

drop policy if exists "dogs_all_own" on public.dogs;
drop policy if exists "walks_all_own" on public.walks;
drop policy if exists "walk_locations_all_own" on public.walk_locations;
drop policy if exists "walk_events_all_own" on public.walk_events;
drop policy if exists "walk_photos_all_own" on public.walk_photos;
drop policy if exists "diaries_all_own" on public.diaries;
drop policy if exists "share_cards_all_own" on public.share_cards;
drop policy if exists "walk_dogs_all_own" on public.walk_dogs;

create policy "dogs_select_member" on public.dogs
for select using (public.is_household_member(household_id));

create policy "dogs_insert_admin" on public.dogs
for insert with check (
  public.is_household_admin(household_id)
  and user_id = auth.uid()
);

create policy "dogs_update_admin" on public.dogs
for update
using (public.is_household_admin(household_id))
with check (public.is_household_admin(household_id));

create policy "dogs_delete_admin" on public.dogs
for delete using (public.is_household_admin(household_id));

create policy "walks_select_member" on public.walks
for select using (public.is_household_member(public.walk_household_id(id)));

create policy "walks_insert_member" on public.walks
for insert with check (
  recorded_by = auth.uid()
  and exists (
    select 1
    from public.dogs as dog
    where dog.id = dog_id
      and public.is_household_member(dog.household_id)
  )
);

-- 로그인한 사용자는 기록한 사람을 바꾸지 못한다.
-- 계정 삭제는 사용자 JWT가 없는 세션에서 recorded_by를 비우므로, 그때는 그대로 둔다.
create or replace function public.tg_walks_keep_recorded_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.recorded_by := old.recorded_by;
  end if;
  return new;
end;
$$;

create trigger walks_keep_recorded_by
before update on public.walks
for each row
execute function public.tg_walks_keep_recorded_by();

revoke all on function public.tg_walks_keep_recorded_by() from public, anon, authenticated;

create policy "walks_update_member" on public.walks
for update
using (public.is_household_member(public.walk_household_id(id)))
with check (
  exists (
    select 1
    from public.dogs as dog
    where dog.id = dog_id
      and public.is_household_member(dog.household_id)
  )
);

create policy "walks_delete_admin_or_recorder" on public.walks
for delete using (
  recorded_by = auth.uid()
  or public.is_household_admin(public.walk_household_id(id))
);

-- 좌표는 기록한 사람만 읽고 쓴다.
-- 삭제는 산책을 지울 수 있는 사람(기록자·집 관리자)도 허용해 cascade가 막히지 않게 한다.
create policy "walk_locations_recorder" on public.walk_locations
for all
using (
  exists (
    select 1
    from public.walks as walk
    where walk.id = walk_id
      and walk.recorded_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.walks as walk
    where walk.id = walk_id
      and walk.recorded_by = auth.uid()
  )
);

create policy "walk_locations_delete_with_walk" on public.walk_locations
for delete
using (
  exists (
    select 1
    from public.walks as walk
    where walk.id = walk_id
      and (
        walk.recorded_by = auth.uid()
        or public.is_household_admin(public.walk_household_id(walk.id))
      )
  )
);

create policy "walk_events_member" on public.walk_events
for all
using (public.is_household_member(public.walk_household_id(walk_id)))
with check (public.is_household_member(public.walk_household_id(walk_id)));

create policy "walk_photos_member" on public.walk_photos
for all
using (public.is_household_member(public.walk_household_id(walk_id)))
with check (public.is_household_member(public.walk_household_id(walk_id)));

create policy "diaries_select_member" on public.diaries
for select using (public.is_household_member(public.walk_household_id(walk_id)));

create policy "diaries_insert_member" on public.diaries
for insert with check (
  exists (
    select 1
    from public.dogs as dog
    where dog.id = dog_id
      and public.is_household_member(dog.household_id)
  )
);

create policy "diaries_update_member" on public.diaries
for update
using (public.is_household_member(public.walk_household_id(walk_id)))
with check (public.is_household_member(public.walk_household_id(walk_id)));

create policy "diaries_delete_admin_or_recorder" on public.diaries
for delete using (
  exists (
    select 1
    from public.walks as walk
    where walk.id = walk_id
      and (
        walk.recorded_by = auth.uid()
        or public.is_household_admin(public.walk_household_id(walk.id))
      )
  )
);

create policy "share_cards_member" on public.share_cards
for all
using (
  exists (
    select 1
    from public.diaries as diary
    where diary.id = diary_id
      and public.is_household_member(public.walk_household_id(diary.walk_id))
  )
)
with check (
  exists (
    select 1
    from public.diaries as diary
    where diary.id = diary_id
      and public.is_household_member(public.walk_household_id(diary.walk_id))
  )
);

-- 한 산책의 강아지는 같은 집이어야 한다 (예전에는 같은 사람).
create policy "walk_dogs_member" on public.walk_dogs
for all
using (public.is_household_member(public.walk_household_id(walk_id)))
with check (
  exists (
    select 1
    from public.walks as walk
    join public.dogs as representative on representative.id = walk.dog_id
    join public.dogs as member_dog on member_dog.id = walk_dogs.dog_id
    where walk.id = walk_dogs.walk_id
      and representative.household_id = member_dog.household_id
      and public.is_household_member(representative.household_id)
  )
);

-- 산책 사진 파일: 올린 사람 폴더는 그대로 쓰고, 그 산책 집의 관리자도 지울 수 있다.
drop policy if exists "walk_photos_storage_own" on storage.objects;

create policy "walk_photos_storage_select" on storage.objects
for select using (
  bucket_id = 'walk-photos'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_walk_photo_admin((storage.foldername(name))[2])
  )
);

create policy "walk_photos_storage_insert" on storage.objects
for insert with check (
  bucket_id = 'walk-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "walk_photos_storage_update" on storage.objects
for update
using (
  bucket_id = 'walk-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'walk-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "walk_photos_storage_delete" on storage.objects
for delete using (
  bucket_id = 'walk-photos'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_walk_photo_admin((storage.foldername(name))[2])
  )
);

create or replace function public.normalize_invite_code(raw_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(replace(trim(coalesce(raw_code, '')), ' ', ''));
$$;

create or replace function public.invite_attempt_blocked(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) >= 10
  from public.household_invite_attempts as attempt
  where attempt.user_id = target_user
    and attempt.succeeded = false
    and attempt.attempted_at > now() - interval '1 hour';
$$;

create or replace function public.record_invite_attempt(target_user uuid, did_succeed boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.household_invite_attempts as attempt
  where attempt.user_id = target_user
    and attempt.attempted_at < now() - interval '1 hour';

  insert into public.household_invite_attempts (user_id, succeeded)
  values (target_user, did_succeed);
end;
$$;

revoke all on function public.normalize_invite_code(text) from public, anon, authenticated;
revoke all on function public.invite_attempt_blocked(uuid) from public, anon, authenticated;
revoke all on function public.record_invite_attempt(uuid, boolean) from public, anon, authenticated;
grant execute on function public.normalize_invite_code(text) to service_role;
grant execute on function public.invite_attempt_blocked(uuid) to service_role;
grant execute on function public.record_invite_attempt(uuid, boolean) to service_role;

create or replace function public.create_household_invite(target_household_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  generated text;
  attempt int;
  index int;
begin
  if me is null or not public.is_household_admin(target_household_id) then
    raise exception 'invite_not_admin';
  end if;

  for attempt in 1..8 loop
    generated := '';
    for index in 1..6 loop
      generated := generated || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;

    begin
      insert into public.household_invites (code, household_id, created_by, expires_at)
      values (generated, target_household_id, me, now() + interval '7 days');
      return generated;
    exception
      when unique_violation then
        null;
    end;
  end loop;

  raise exception 'invite_create_failed';
end;
$$;

create or replace function public.preview_household_invite(raw_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  normalized text := public.normalize_invite_code(raw_code);
  invite public.household_invites%rowtype;
  member_count int;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;

  if public.invite_attempt_blocked(me) then
    raise exception 'invite_rate_limited';
  end if;

  select * into invite
  from public.household_invites
  where code = normalized
    and used_at is null
    and expires_at > now();

  if not found then
    -- 예외를 던지면 방금 넣은 시도 기록까지 되돌아가 제한이 걸리지 않는다
    perform public.record_invite_attempt(me, false);
    return jsonb_build_object('error', 'invite_invalid');
  end if;

  if exists (
    select 1
    from public.household_members as member
    where member.household_id = invite.household_id
      and member.user_id = me
  ) then
    raise exception 'invite_already_member';
  end if;

  select count(*) into member_count
  from public.household_members as member
  where member.household_id = invite.household_id;

  if member_count >= 10 then
    raise exception 'invite_household_full';
  end if;

  return jsonb_build_object(
    'householdId', invite.household_id,
    'inviterTitle', (
      select account.guardian_title
      from public.users as account
      where account.id = invite.created_by
    ),
    'dogs', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', dog.name,
          'profileImageUrl', dog.profile_image_url,
          'createdAt', dog.created_at
        )
        order by dog.created_at asc
      )
      from public.dogs as dog
      where dog.household_id = invite.household_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.accept_household_invite(raw_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  normalized text := public.normalize_invite_code(raw_code);
  invite public.household_invites%rowtype;
  member_count int;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;

  if public.invite_attempt_blocked(me) then
    raise exception 'invite_rate_limited';
  end if;

  select * into invite
  from public.household_invites
  where code = normalized
  for update;

  if not found then
    perform public.record_invite_attempt(me, false);
    return jsonb_build_object('error', 'invite_invalid');
  end if;

  if invite.used_at is not null or invite.expires_at <= now() then
    perform public.record_invite_attempt(me, false);
    return jsonb_build_object('error', 'invite_invalid');
  end if;

  if exists (
    select 1
    from public.household_members as member
    where member.household_id = invite.household_id
      and member.user_id = me
  ) then
    raise exception 'invite_already_member';
  end if;

  -- 수락이 동시에 들어와도 10명을 넘기지 않는다
  perform 1
  from public.households
  where id = invite.household_id
  for update;

  select count(*) into member_count
  from public.household_members as member
  where member.household_id = invite.household_id;

  if member_count >= 10 then
    raise exception 'invite_household_full';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (invite.household_id, me, 'member');

  update public.household_invites
  set used_at = now(),
      used_by = me
  where code = invite.code;

  perform public.record_invite_attempt(me, true);
  return jsonb_build_object('householdId', invite.household_id);
end;
$$;

create or replace function public.remove_household_member(
  target_household_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or not public.is_household_admin(target_household_id) then
    raise exception 'not_household_admin';
  end if;

  if target_user_id = me then
    raise exception 'cannot_remove_self';
  end if;

  if not exists (
    select 1
    from public.household_members as member
    where member.household_id = target_household_id
      and member.user_id = target_user_id
      and member.role = 'member'
  ) then
    raise exception 'member_not_found';
  end if;

  delete from public.household_members as member
  where member.household_id = target_household_id
    and member.user_id = target_user_id;
end;
$$;

create or replace function public.leave_household(target_household_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  my_role text;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;

  select member.role into my_role
  from public.household_members as member
  where member.household_id = target_household_id
    and member.user_id = me;

  if my_role is null then
    raise exception 'not_household_member';
  end if;

  if my_role = 'admin' then
    raise exception 'admin_cannot_leave';
  end if;

  delete from public.household_members as member
  where member.household_id = target_household_id
    and member.user_id = me;
end;
$$;

-- 탈퇴 Edge Function만 호출한다. 가족이 있는 관리자 집은 새 관리자를 고르고,
-- 혼자인 집은 나중에 지울 id로 돌려준다. 파일은 이 함수가 지우지 않는다.
create or replace function public.transfer_household_admins(
  target_user uuid,
  successors jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership record;
  next_admin uuid;
  drop_ids uuid[] := '{}';
  keep_ids uuid[] := '{}';
begin
  if target_user is null then
    raise exception 'not_authenticated';
  end if;

  for membership in
    select member.household_id, member.role
    from public.household_members as member
    where member.user_id = target_user
  loop
    if exists (
      select 1
      from public.household_members as other_member
      where other_member.household_id = membership.household_id
        and other_member.user_id <> target_user
    ) then
      if membership.role = 'admin' then
        select (item.value ->> 'userId')::uuid into next_admin
        from jsonb_array_elements(coalesce(successors, '[]'::jsonb)) as item
        where (item.value ->> 'householdId')::uuid = membership.household_id
        limit 1;

        if next_admin is null or next_admin = target_user or not exists (
          select 1
          from public.household_members as other_member
          where other_member.household_id = membership.household_id
            and other_member.user_id = next_admin
        ) then
          raise exception 'successor_invalid';
        end if;

        update public.household_members
        set role = 'member'
        where household_id = membership.household_id
          and user_id = target_user;

        update public.household_members
        set role = 'admin'
        where household_id = membership.household_id
          and user_id = next_admin;
      end if;

      keep_ids := array_append(keep_ids, membership.household_id);
    else
      drop_ids := array_append(drop_ids, membership.household_id);
    end if;
  end loop;

  return jsonb_build_object(
    'dropHouseholdIds', to_jsonb(drop_ids),
    'keepHouseholdIds', to_jsonb(keep_ids)
  );
end;
$$;

revoke all on function public.create_household_invite(uuid) from public, anon;
revoke all on function public.preview_household_invite(text) from public, anon;
revoke all on function public.accept_household_invite(text) from public, anon;
revoke all on function public.remove_household_member(uuid, uuid) from public, anon;
revoke all on function public.leave_household(uuid) from public, anon;
revoke all on function public.transfer_household_admins(uuid, jsonb) from public, anon, authenticated;

grant execute on function public.create_household_invite(uuid) to authenticated;
grant execute on function public.preview_household_invite(text) to authenticated;
grant execute on function public.accept_household_invite(text) to authenticated;
grant execute on function public.remove_household_member(uuid, uuid) to authenticated;
grant execute on function public.leave_household(uuid) to authenticated;
grant execute on function public.transfer_household_admins(uuid, jsonb) to service_role;
