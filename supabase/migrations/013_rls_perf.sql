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

-- 010에서 만든 security_barrier, security_invoker = false 는 그대로 둔다.
create or replace view public.household_member_profiles as
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
