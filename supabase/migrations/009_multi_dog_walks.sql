-- 다견 산책. walks.dog_id는 대표 강아지로 남긴다 (옛 앱·기존 RLS).
-- 공유 링크 함수(get_shared_diary 등)는 일기 id로 산책에 붙으므로
-- 산책당 일기가 여러 개여도 바꾸지 않는다.

create table public.walk_dogs (
  walk_id uuid not null references public.walks(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  primary key (walk_id, dog_id)
);

insert into public.walk_dogs (walk_id, dog_id)
select id, dog_id from public.walks;

create index idx_walk_dogs_dog_id on public.walk_dogs (dog_id);

-- 산책이 생기면 대표 강아지를 연결 테이블에 넣는다. 옛 앱은 walk_dogs를 직접 쓰지 않는다.
create or replace function public.tg_walk_insert_representative_dog()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.walk_dogs (walk_id, dog_id)
  values (new.id, new.dog_id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger walks_insert_representative_dog
after insert on public.walks
for each row
execute function public.tg_walk_insert_representative_dog();

revoke all on function public.tg_walk_insert_representative_dog() from public, anon;
grant execute on function public.tg_walk_insert_representative_dog() to authenticated, service_role;

-- 배변·친구 만남은 강아지마다. 메모 칸은 그대로 두고, 앱이 같은 메모를 각 행에 넣는다.
alter table public.walk_events
  add column dog_id uuid references public.dogs(id) on delete cascade;

update public.walk_events as event
set dog_id = walk.dog_id
from public.walks as walk
where walk.id = event.walk_id
  and event.dog_id is null;

alter table public.walk_events
  alter column dog_id set not null;

-- 옛 앱은 dog_id 없이 넣는다. 대표 강아지로 채운 뒤 not null을 검사한다.
create or replace function public.tg_walk_events_fill_dog_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.dog_id is null then
    select walk.dog_id into new.dog_id
    from public.walks as walk
    where walk.id = new.walk_id;
  end if;
  return new;
end;
$$;

create trigger walk_events_fill_dog_id
before insert on public.walk_events
for each row
execute function public.tg_walk_events_fill_dog_id();

revoke all on function public.tg_walk_events_fill_dog_id() from public, anon;
grant execute on function public.tg_walk_events_fill_dog_id() to authenticated, service_role;

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'walk_events'
    and con.contype = 'u'
    and array_length(con.conkey, 1) = 1
    and exists (
      select 1
      from pg_attribute att
      where att.attrelid = rel.oid
        and att.attnum = con.conkey[1]
        and att.attname = 'walk_id'
    );

  if constraint_name is null then
    raise exception 'walk_events walk_id unique constraint not found';
  end if;

  execute format('alter table public.walk_events drop constraint %I', constraint_name);
end $$;

alter table public.walk_events
  add constraint walk_events_walk_id_dog_id_key unique (walk_id, dog_id);

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'diaries'
    and con.contype = 'u'
    and array_length(con.conkey, 1) = 1
    and exists (
      select 1
      from pg_attribute att
      where att.attrelid = rel.oid
        and att.attnum = con.conkey[1]
        and att.attname = 'walk_id'
    );

  if constraint_name is null then
    raise exception 'diaries walk_id unique constraint not found';
  end if;

  execute format('alter table public.diaries drop constraint %I', constraint_name);
end $$;

alter table public.diaries
  add constraint diaries_walk_id_dog_id_key unique (walk_id, dog_id);

alter table public.walk_dogs enable row level security;

-- 강아지 주인만 보고, 넣는 강아지는 그 산책 대표 강아지와 같은 사람의 것이어야 한다.
create policy "walk_dogs_all_own" on public.walk_dogs
for all
using (
  exists (
    select 1 from public.dogs as dog
    where dog.id = walk_dogs.dog_id and dog.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.walks as walk
    join public.dogs as owner_dog on owner_dog.id = walk.dog_id
    join public.dogs as member_dog on member_dog.id = walk_dogs.dog_id
    where walk.id = walk_dogs.walk_id
      and owner_dog.user_id = auth.uid()
      and member_dog.user_id = owner_dog.user_id
  )
);

grant select, insert, update, delete on public.walk_dogs to authenticated, service_role;
