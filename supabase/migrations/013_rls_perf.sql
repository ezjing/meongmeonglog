-- 가족 구성 확인을 행마다 호출하지 않는다.
-- security definer 함수를 정책에서 바로 부르면 모든 행마다 실행된다.
-- 내 집 id를 한 번 구한 뒤 in으로 걸러 인덱스(idx_dogs_household_id 등)를 타게 한다.

create or replace function public.my_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id
  from public.household_members
  where user_id = auth.uid();
$$;

revoke all on function public.my_household_ids() from public, anon;
grant execute on function public.my_household_ids() to authenticated, service_role;

drop policy if exists "dogs_select_member" on public.dogs;
create policy "dogs_select_member" on public.dogs
for select using (household_id in (select public.my_household_ids()));

-- create or replace view는 적지 않은 옵션을 지우므로 010과 같은 옵션을 다시 적는다.
-- security_barrier: 아래 where(내 집만)가 다른 함수보다 먼저 적용되게 한다 (뷰 주인 권한으로 RLS를 우회하므로 필수).
create or replace view public.household_member_profiles
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
where member.household_id in (select public.my_household_ids());

drop policy if exists "households_select_member" on public.households;
create policy "households_select_member" on public.households
for select using (id in (select public.my_household_ids()));

drop policy if exists "household_members_select_member" on public.household_members;
create policy "household_members_select_member" on public.household_members
for select using (household_id in (select public.my_household_ids()));

-- 끝나지 않은 산책(시작 트리거, active_walks_for_dogs)을 started_at으로 찾는다.
create index if not exists walks_in_progress_started_at
  on public.walks (started_at) where ended_at is null;
