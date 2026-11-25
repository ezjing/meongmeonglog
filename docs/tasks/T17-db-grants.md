# T17. 테이블 기본 권한(GRANT)을 마이그레이션에 적기 (DB)

## 왜

DB 접근은 두 단계로 허락된다.
1. **GRANT (출입증)**: 역할(`anon`, `authenticated`, `service_role`)이 테이블에 들어갈 수 있는지
2. **RLS (방 열쇠)**: 들어간 뒤 어떤 행을 보고 쓸 수 있는지

우리 마이그레이션은 RLS만 적고 GRANT는 적지 않았다. 운영 DB는 Supabase가 프로젝트를 만들 때 기본 권한을 자동으로 줘서 동작한다.
하지만 최신 Supabase로 새 DB를 만들면(로컬 `supabase db reset` 포함) 이 기본 권한이 없어 **앱이 모든 테이블에서 "permission denied"** 가 난다 (2026-11-25 T14 로컬 시험에서 확인).
→ 운영과 **똑같은** 권한을 마이그레이션에 적어, 어디서 DB를 새로 만들어도 같게 동작하게 한다. **운영 DB에는 아무 변화가 없어야 한다.**

## 운영 DB의 현재 권한 (2026-11-25 원격 조회)

- `public`의 모든 테이블·뷰(`users`, `dogs`, `walks`, `walk_locations`, `walk_events`, `walk_photos`, `walk_dogs`, `walk_companions`, `diaries`, `share_cards`, `households`, `household_members`, `household_invites`, `household_invite_attempts`, `household_member_profiles`): `anon`·`authenticated`·`service_role` 모두 `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER`
- 시퀀스 `household_invite_attempts_id_seq`: 세 역할 모두 `USAGE` (기본 권한상 `SELECT, UPDATE`도)
- 기본 권한(default privileges, 소유자 `postgres`): 새 테이블은 세 역할에 전부, 새 함수는 `EXECUTE`, 새 시퀀스는 `USAGE, SELECT, UPDATE`

## 할 일

1. 새 마이그레이션(그때의 다음 번호, 예: T15가 먼저면 그 뒤) `0NN_explicit_grants.sql`
   ```sql
   grant select, insert, update, delete, truncate, references, trigger
     on all tables in schema public to anon, authenticated, service_role;
   grant usage, select, update on all sequences in schema public to anon, authenticated, service_role;

   alter default privileges for role postgres in schema public
     grant select, insert, update, delete, truncate, references, trigger on tables to anon, authenticated, service_role;
   alter default privileges for role postgres in schema public
     grant usage, select, update on sequences to anon, authenticated, service_role;
   alter default privileges for role postgres in schema public
     grant execute on functions to anon, authenticated, service_role;
   ```
   - 파일 맨 위에 "운영 DB의 Supabase 기본 권한과 같게 맞춘다. 보안은 RLS가 맡는다" 주석
   - **이미 `revoke`로 막아 둔 함수 권한(예: `revoke ... from public, anon`)을 되살리지 않는다.** `grant ... on all functions`는 쓰지 않는다 (함수는 각 마이그레이션의 개별 grant/revoke가 기준)
2. 앱이 부르는 RPC 함수가 모두 개별 `grant execute ... to authenticated`(공유 일기 조회는 `anon`)를 갖고 있는지 확인하고, 빠진 것이 있으면 목록을 사용자에게 보여 주고 묻는다
   - 확인 방법: `grep -rn "\.rpc(" src supabase/functions`로 함수 이름을 모으고, 마이그레이션에서 각 함수의 grant를 찾는다
3. 시험 스크립트 `supabase/tests/rls_walk_write.sql`(T14 때 Claude가 만든 것) 맨 위 안내에 "T17 이후에는 권한을 손으로 줄 필요 없다"를 적는다

## 완료 조건

- [ ] `supabase db reset --local` 후 **손으로 권한을 주지 않고** `supabase/tests/rls_walk_write.sql`을 실행해 기대 결과가 모두 나온다 (결과를 "구현 결과"에 표로)
- [ ] 원격에 적용했을 때 바뀌는 권한이 없음을 확인할 방법을 "구현 결과"에 적는다 (예: 적용 전후 `information_schema.role_table_grants` 비교 쿼리). 원격 적용은 하지 않는다
- [ ] 앱 코드 변경 없음

## 하지 말 것

- 권한을 운영보다 좁히거나 넓히기 (예: `anon` 테이블 권한 회수는 별도 결정 사항)
- `storage`·`auth` 스키마 권한 변경 (Supabase가 관리)
- push·배포

## 배포 (사용자가 실행)

`supabase db push --linked --dry-run` → `supabase db push --linked`. 적용 후 권한 비교 쿼리로 변화 없음 확인. 앱·웹 배포 없음.

## 참고: 나중에 정할 수 있는 것 (이번 범위 아님)

운영 기본값은 로그인하지 않은 `anon`에게도 테이블 권한을 준다 (RLS가 막아서 지금 데이터가 새지는 않는다). 더 단단하게 하려면 `anon`의 테이블 권한을 회수하고 공유 일기 조회 함수만 열어 두는 방법이 있다. 원하면 별도 지시서로.

## 구현 결과 (Cursor가 작성)

- 커밋:
  - `0bace81` feat: 운영과 같은 테이블 기본 권한을 마이그레이션에 적는다
  - `4040678` docs: T17 이후 권한 시험은 손으로 주지 않는다고 적는다
- 지시서와 달라진 점 (각 항목에 `승인됨`/`미승인` 표시):
  - 없음. SQL은 지시서 그대로다. 함수 일괄 grant는 넣지 않았고, 그 이유를 주석 한 줄로만 적었다
- RPC 확인 (`grep -rn "\.rpc(" src supabase/functions`): 빠진 grant 없음. 사용자에게 묻지 않았다
  - 앱(로그인): `create_household_invite`, `preview_household_invite`, `accept_household_invite`, `remove_household_member`, `leave_household`, `walk_people`, `active_walks_for_dogs`, `ensure_diary_share_link`, `stop_diary_share_link` → `authenticated`
  - 공유 일기: `get_shared_diary` → `anon`, `authenticated`
  - Edge Function(service role): `find_auth_user_id_by_email`, `transfer_household_admins` → `service_role`만. `authenticated`는 원래 revoke라 그대로 두었다
- 로컬 시험 (`supabase db reset --local` 후 권한을 손으로 주지 않고 `supabase/tests/rls_walk_write.sql`):

  | 누가 | 무엇을 | 결과 |
  | --- | --- | --- |
  | 기록자 | 산책 시작, 강아지 추가, 종료, 이벤트 2마리, 사진 | 성공 |
  | 일반 가족 | 산책 보기, 산책 강아지 보기 | 1건, 2마리 |
  | 일반 가족 | 남의 산책 수정, 산책 강아지 삭제 | 0행 |
  | 일반 가족 | 산책 강아지·이벤트·사진·일기 추가 | RLS 오류 |
  | 관리자 | 딸의 산책 수정, 산책에 간 강아지 일기 | 성공 (1행) |
  | 기록자 | 산책에서 뺀 강아지로 이벤트·일기 | RLS 오류 |

  `permission denied`는 없었다. 테이블은 세 역할 모두 SELECT·INSERT·UPDATE·DELETE·TRUNCATE·REFERENCES·TRIGGER가 빠지지 않았다. 시퀀스 `household_invite_attempts_id_seq`는 `rwU`(SELECT, UPDATE, USAGE). 함수 execute는 위 개별 grant와 같고, revoke된 함수에 `anon`이 다시 붙지 않았다
- 원격 적용 전후 비교 (적용은 하지 않음). 적용 직전과 직후에 같은 쿼리를 실행해 결과가 같으면 권한 변화가 없다. `information_schema.usage_privileges`는 시퀀스 USAGE만 보여 주므로 시퀀스는 `relacl`로 본다

  ```sql
  select table_name, grantee, privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public'
    and grantee in ('anon', 'authenticated', 'service_role')
  order by 1, 2, 3;

  select c.relname, c.relacl::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'S'
  order by 1;

  select pg_get_userbyid(d.defaclrole) as owner, d.defaclobjtype, d.defaclacl::text
  from pg_default_acl d
  join pg_namespace n on n.oid = d.defaclnamespace
  where n.nspname = 'public' and pg_get_userbyid(d.defaclrole) = 'postgres'
  order by 2;

  select p.proname, r.rolname
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join lateral aclexplode(p.proacl) a on true
  join pg_roles r on r.oid = a.grantee
  where n.nspname = 'public'
    and a.privilege_type = 'EXECUTE'
    and r.rolname in ('anon', 'authenticated', 'service_role')
  order by 1, 2;
  ```

- 확인한 것:
  - 각 커밋 전에 `npm run verify` 통과. 앱 코드 변경 없음
- 확인하지 못한 것:
  - 원격 DB에 적용하지 않았다. 위 쿼리의 적용 전후 비교는 배포할 때 한다
