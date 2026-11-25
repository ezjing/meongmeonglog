-- 산책 기록 쓰기 권한(T14) 시험. 로컬 DB에서만 실행한다 (테스트 계정을 만든다).
-- 실행: supabase db reset --local 후
--   docker exec -i supabase_db_meongmeonglog psql -U postgres -d postgres -q < supabase/tests/rls_walk_write.sql
-- 기대 결과는 각 \echo 제목에 적혀 있다. "오류여야 함"은 RLS 오류가 나야 정상이다.
\set ON_ERROR_STOP off
\pset pager off
-- 준비: 관리자(엄마) A, 기록자(딸) R, 일반 가족(아빠) B. 모두 A의 집 H.
begin;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'r@test.local');
insert into public.users (id, provider) values
  ('00000000-0000-0000-0000-00000000000a', 'kakao'),
  ('00000000-0000-0000-0000-00000000000b', 'kakao'),
  ('00000000-0000-0000-0000-00000000000c', 'kakao');
-- B, R을 A의 집에 일반 구성원으로 넣는다
insert into public.household_members (household_id, user_id, role)
select m.household_id, x.id, 'member'
from public.household_members m,
     (values ('00000000-0000-0000-0000-00000000000b'::uuid), ('00000000-0000-0000-0000-00000000000c'::uuid)) as x(id)
where m.user_id = '00000000-0000-0000-0000-00000000000a';
insert into public.dogs (id, user_id, name, breed, birth_date, gender, household_id)
select v.id, '00000000-0000-0000-0000-00000000000a', v.name, 'MALTESE', '2020-01-01', 'MALE', m.household_id
from public.household_members m,
     (values ('00000000-0000-0000-0000-0000000000d1'::uuid, '하나'), ('00000000-0000-0000-0000-0000000000d2'::uuid, '두리')) as v(id, name)
where m.user_id = '00000000-0000-0000-0000-00000000000a' and m.role = 'admin';
commit;

\echo '===== 1. 기록자(딸) R: 산책 시작·강아지 추가·종료·이벤트·사진 (모두 성공해야 함)'
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
insert into public.walks (id, dog_id, started_at) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', now()) returning id as walk_insert;
insert into public.walk_dogs (walk_id, dog_id) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d2') returning dog_id as walk_dog_insert;
update public.walks set ended_at = now(), distance_meter = 1200, duration_sec = 900 where id = '00000000-0000-0000-0000-0000000000e1' returning id as walk_update;
insert into public.walk_events (walk_id, dog_id, pee_count) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', 1),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d2', 2)
  on conflict (walk_id, dog_id) do update set pee_count = excluded.pee_count returning dog_id as event_upsert;
insert into public.walk_photos (walk_id, image_url) values ('00000000-0000-0000-0000-0000000000e1', 'x/y/0.jpg') returning id is not null as photo_insert;
commit;

\echo '===== 2. 일반 가족(아빠) B: 보기는 되고, 쓰기는 모두 막혀야 함'
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select count(*) as b_can_see_walk from public.walks where id = '00000000-0000-0000-0000-0000000000e1';
select count(*) as b_can_see_walk_dogs from public.walk_dogs where walk_id = '00000000-0000-0000-0000-0000000000e1';
with u as (update public.walks set distance_meter = 1 where id = '00000000-0000-0000-0000-0000000000e1' returning id) select count(*) as b_walk_update_rows from u;
with d as (delete from public.walk_dogs where walk_id = '00000000-0000-0000-0000-0000000000e1' returning dog_id) select count(*) as b_walk_dogs_delete_rows from d;
rollback;
\echo '-- B walk_dogs insert (오류여야 함)'
begin; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
delete from public.walk_dogs where false;
insert into public.walk_dogs (walk_id, dog_id) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1');
rollback;
\echo '-- B walk_events insert (오류여야 함)'
begin; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
insert into public.walk_events (walk_id, dog_id, memo) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', 'b');
rollback;
\echo '-- B walk_photos insert (오류여야 함)'
begin; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
insert into public.walk_photos (walk_id, image_url) values ('00000000-0000-0000-0000-0000000000e1', 'b.jpg');
rollback;
\echo '-- B diaries insert (오류여야 함)'
begin; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
insert into public.diaries (walk_id, dog_id, diary_content, daily_quote) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', 'x', 'y');
rollback;

\echo '===== 3. 관리자(엄마) A: 딸의 산책 수정 가능, 산책에 없는 강아지 일기는 막힘'
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
with u as (update public.walks set weather_condition = 'sunny' where id = '00000000-0000-0000-0000-0000000000e1' returning id) select count(*) as a_walk_update_rows from u;
insert into public.diaries (walk_id, dog_id, diary_content, daily_quote) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', 'x', 'y') returning dog_id as a_diary_insert_ok;
rollback;

\echo '===== 4. 기록자 R: 산책에 없는 강아지로 일기·이벤트 (오류여야 함)'
begin; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
delete from public.walk_dogs where walk_id = '00000000-0000-0000-0000-0000000000e1' and dog_id = '00000000-0000-0000-0000-0000000000d2';
delete from public.walk_events where walk_id = '00000000-0000-0000-0000-0000000000e1' and dog_id = '00000000-0000-0000-0000-0000000000d2';
savepoint s1;
insert into public.walk_events (walk_id, dog_id, memo) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d2', 'not in walk');
rollback to savepoint s1;
select 'R removed d2 from walk, now insert diary for d2:' as step;
insert into public.diaries (walk_id, dog_id, diary_content, daily_quote) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d2', 'x', 'y');
rollback;
