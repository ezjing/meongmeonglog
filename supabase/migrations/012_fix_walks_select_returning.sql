-- 010의 walks 읽기 정책은 walk_household_id(id)로 산책 행을 다시 조회했다.
-- insert ... returning(앱의 산책 시작)에서는 방금 넣은 행이 그 함수에 보이지 않아
-- "new row violates row-level security policy"로 산책 시작이 모두 실패했다.
-- 같은 뜻(강아지의 집 구성원)을 행의 dog_id로 직접 확인한다.

drop policy if exists "walks_select_member" on public.walks;

create policy "walks_select_member" on public.walks
for select using (
  exists (
    select 1
    from public.dogs as dog
    where dog.id = walks.dog_id
      and public.is_household_member(dog.household_id)
  )
);
