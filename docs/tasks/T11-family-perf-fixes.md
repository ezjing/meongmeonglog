# T11. 가족 기능 성능·새로 고침 버그 고치기 (급함)

2026-11-25 코드 점검(T06~T10 이후)에서 나온 문제 중 **사용자가 늘면 느려지거나, 지금도 잘못 보이는 것**만 모았다. 동작 규칙(권한 범위)은 바꾸지 않는다.
항목마다 따로 커밋한다 (`.cursor/rules/taskWorkflow.mdc`).

## A. 강아지·가족 목록 조회가 전체 사용자 데이터를 훑지 않게 (DB)

문제
- `src/entities/dog/api/dogApi.ts` `fetchDogs`는 필터 없이 `dogs` 전체를 select하고 RLS(`dogs_select_member` = `is_household_member(household_id)`)에 맡긴다
- `is_household_member`는 `security definer` 함수라 Postgres가 펼치지 못해 **모든 행마다 함수를 호출**한다. 뷰 `household_member_profiles`(010)도 같은 방식이다
- 지금은 빠르지만 전체 사용자 수에 비례해 느려진다 (`useDogs`는 앱 시작과 대부분의 화면에서 쓰인다)

할 일 (새 마이그레이션 `013_rls_perf.sql`)
1. 내가 속한 집 id들을 돌려주는 함수 `public.my_household_ids()`를 만든다
   - `returns setof uuid`, `language sql`, `stable`, `security definer`, `set search_path = ''`
   - `select household_id from public.household_members where user_id = auth.uid()`
   - 실행 권한은 `is_household_member`와 같게(010:245-249 참고: anon 회수, authenticated·service_role 허용)
2. `dogs_select_member` 정책을 `household_id in (select public.my_household_ids())`로 다시 만든다
3. 뷰 `household_member_profiles`의 where를 `member.household_id in (select public.my_household_ids())`로 바꾼다 (컬럼·순서 그대로, `create or replace view`)
4. `households_select_member`, `household_members_select_member`도 같은 방식으로 바꾼다
5. **다른 정책(walks·diaries 등)은 바꾸지 않는다.** 그 조회들은 `dog_id`·`id`로 먼저 걸러져 지금 방식도 괜찮다

완료 조건
- 로컬 DB(`supabase start` 또는 dry-run)에서 마이그레이션 적용 확인. 가능하면 `explain`으로 `dogs` 조회가 전체 스캔이 아님을 확인하고 결과를 "구현 결과"에 적는다
- 앱에서 강아지·가족 목록이 전과 같게 보인다 (내 집 강아지만, 가족 화면 구성원 그대로)

## B. 산책 시작 검사용 인덱스 (DB)

문제: 산책 시작 트리거 `tg_reject_walk_in_progress`(011:62-77)와 `active_walks_for_dogs`가 "끝나지 않은 산책"을 찾을 때 쓸 인덱스가 없다.

할 일: 같은 `013` 마이그레이션에 추가
```sql
create index if not exists walks_in_progress_started_at
  on public.walks (started_at) where ended_at is null;
```
트리거 함수 자체는 바꾸지 않는다.

## C. 산책 기록이 많으면 탈퇴가 실패하는 문제 (Edge Function)

문제: `supabase/functions/delete-account/index.ts`의 `loadHouseholdFiles`가 산책 id 전체를 `.in('walk_id', walkIds)`로 요청 주소에 넣는다. 산책이 수백 개면 주소 길이 제한을 넘어 탈퇴가 실패한다.

할 일
- 산책 id 목록을 주소에 넣지 않는다. **결정 (사용자 승인, 2026-11-25): embed 조인 방식**
  - `walk_photos`에서 `walks!inner(dog_id)` 같은 embed 조인으로 강아지 id(최대 10개) 기준으로 한 번에 조회
  - supabase-js embed 필터 문법은 공식 문서로 확인한다. 의도대로 안 되면 멈추고 사용자에게 묻는다
- 탈퇴 동작(무엇을 지우는지, 순서, 실패 시 중단)은 바꾸지 않는다

완료 조건: 산책 수와 상관없이 요청 주소 길이가 일정하다 (코드로 확인). Deno가 없으면 문법을 꼼꼼히 본다

## D. 가족 변경 뒤 새로 고침 빠짐 (클라이언트)

문제
- `src/entities/household/api/householdQueries.ts`의 초대 수락·내보내기·나가기 hook이 `householdKeys.all`만 새로 고친다
- 나가거나 내보낸 뒤에도 그 집 강아지가 `dogKeys` 캐시에 남는다 → 최대 30초 동안 볼 수 없는 강아지가 홈에 보이고 산책 시작이 실패한다
- 수락만 화면(`src/pages/invite-accept/ui/InviteAcceptScreen.tsx`)이 직접 `dogKeys.all`을 새로 고친다
- `householdKeys.all`이 `householdKeys.preview(code)`까지 새로 고쳐서, **초대 수락 직후 이미 쓴 코드를 다시 미리보기하며 실패 시도가 1번 기록된다** (차단 한도 10회/시간을 씀)

할 일
1. 새 feature slice `src/features/family/`를 만든다 (entities끼리는 서로의 query key를 import할 수 없어서)
   - `model/useFamilyMutations.ts`(이름은 자유)에 `useAcceptInvite`, `useLeaveHousehold`, `useRemoveMember`
   - 내부에서 `entities/household`의 API 함수를 부르고, 성공하면 **가족 목록(`householdKeys.list`)·강아지(`dogKeys.all`)·일기·진행 중 산책 조회**를 새로 고친다
   - 일기·산책 key가 public API에 없으면 `entities/diary`·`entities/walk`의 `index.ts`에 key(또는 "목록 새로 고침" 함수)를 export한다
   - 초대 미리보기(`householdKeys.preview`)는 새로 고치지 않는다. 수락 성공 시에는 `removeQueries`로 지운다
2. `entities/household`의 mutation hook 3개는 지우고, 사용처(가족 관리·초대 수락 화면 등)를 새 hook으로 바꾼다. 화면의 `queryClient` 직접 호출을 지운다
3. `features/family/index.ts`에 export, `docs/architecture.md`의 features 예시에 `family` 추가

완료 조건
- 가족에서 나가거나 구성원을 내보낸 직후 홈·설정에 그 집 강아지가 남지 않는다
- 초대 수락 직후 미리보기 요청이 다시 나가지 않는다 (코드로 확인)

## E. 초대 코드 오류 안내

문제: `src/entities/household/api/householdApi.ts`의 미리보기·수락이 모르는 오류(네트워크 등)를 모두 `invite_invalid`로 바꿔서 **"코드가 맞지 않아요" 안내가 뜬다.**

할 일
- 서버가 알려 준 코드(만료, 없음, 가득 참 등)만 그 안내로 바꾸고, 나머지는 일반 실패 코드(예: `invite_failed`)로 둔다
- 일반 실패 문구 (사용자 승인, 2026-11-25): `초대 코드를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.` (토스트 `error`)

## 공통 완료 조건

- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run format:check` 통과
- [ ] `npx expo export --platform web`, `--platform android` 통과
- [ ] 화면 문구 변경 없음 (E의 승인된 문구 제외)

## 하지 말 것

- 권한 범위(누가 무엇을 수정·삭제할 수 있는지) 변경 — 별도 결정 대기
- push·배포

## 배포 (사용자가 실행, 순서 중요)

1. 마이그레이션: `supabase db push --linked --dry-run` → 확인 후 `supabase db push --linked`
2. Edge Function: `supabase functions deploy delete-account --project-ref ansjpqdsujostrhukygy`
3. 웹 배포 → Android OTA (`docs/handoff.md` 5장)

## 구현 결과 (Cursor가 작성)

- 커밋:
  - `1195a1e` perf: 가족 목록 조회가 모든 행의 권한 함수를 타지 않게 한다
  - `ab29d94` perf: 끝나지 않은 산책 조회에 부분 인덱스를 둔다
  - `ad2d81d` fix: 산책이 많아도 탈퇴할 때 사진 조회가 실패하지 않게 한다
  - `d119517` fix: 가족을 바꾸면 강아지·일기·진행 중 산책 캐시를 새로 고친다
  - `78de7be` fix: 초대 코드를 확인하지 못한 오류를 코드 오류로 안내하지 않는다
- 지시서와 달라진 점 (각 항목에 `승인됨`/`미승인` 표시):
  - 초대 수락 화면은 수락이 진행 중이거나 끝난 동안 미리보기 조회를 끈다. 화면이 떠 있는 상태에서 그 조회를 지우면 바로 다시 요청하기 때문이다. `미승인`
- 확인한 것:
  - `supabase db push --linked --dry-run`: `013_rls_perf.sql`만 원격에 올라갈 마이그레이션으로 나왔다. 적용은 하지 않았다
  - 탈퇴 사진 조회는 `walk_photos`에 `walks!inner(dog_id)`를 넣고 `.in('walks.dog_id', dogIds)`로 거른다. 산책 id는 주소에 없다. 문법은 Supabase 조인 문서의 `!inner` + 조인된 컬럼 필터와 같다
  - 수락 성공 시 `householdKeys.preview(code)`만 `removeQueries`하고, 가족 목록은 `householdKeys.list`만 새로 고친다
  - `npx tsc --noEmit`, `npm run lint` 통과. `npx expo export --platform web`, `--platform android` 번들 생성 통과
- 확인하지 못한 것:
  - 로컬 DB에 마이그레이션을 넣고 `explain`으로 `dogs` 조회가 전체 스캔이 아닌지. Docker가 꺼져 있어 `supabase start`를 하지 못했다
  - 뷰 `household_member_profiles`의 `security_barrier`, `security_invoker = false`가 `create or replace view` 뒤에도 남는지. 옵션은 바꾸지 않았고, 적용된 DB에서 다시 읽지는 못했다
  - 앱에서 강아지·가족 목록이 내 집만 보이는지, 나가거나 내보낸 직후 그 집 강아지가 홈에 남지 않는지
  - 산책이 많은 계정으로 탈퇴할 때 사진 조회가 성공하는지
  - `npm run format:check`. 이 작업 밖 파일 4개(`DiaryDetailScreen`, `DiaryGenerateScreen`, `SettingsScreen`, `WelcomeScreen`)가 어긋나 있다. 서식만 맞추는 작업은 T12 F다

## 검토 (Claude, 2026-11-25)

결과: **수정 필요 (1건).** 나머지는 통과. `tsc`·`lint` 통과 확인. 마이그레이션은 아직 원격에 적용되지 않았다(dry-run만) — **수정 전에 `db push` 하지 않는다.**

통과
- A: `my_household_ids()`(security definer, `search_path=''`, 실행 권한 010과 같음) + `dogs`·`households`·`household_members` 정책을 `in (select …)`로 바꿈. 지시서대로
- B: 부분 인덱스 `walks_in_progress_started_at`
- C: `walk_photos`에 `walks!inner(dog_id)` + `.in('walks.dog_id', dogIds)`. 산책 id가 주소에 없다. 탈퇴 동작은 그대로
- D: `features/family`에 수락·나가기·내보내기 hook, 가족 목록·강아지·일기·진행 중 산책을 새로 고침. 수락 성공 시 미리보기 조회는 지움. 화면의 `queryClient` 직접 호출 제거
- E: 모르는 오류는 `invite_failed` + 승인된 문구. 서버가 알려 준 이유는 기존 안내 그대로

### 수정 지시 1 (필수, 높음): 뷰 보안 옵션이 사라진다

- `013_rls_perf.sql`의 `create or replace view public.household_member_profiles`에 `with (...)`가 없다
- Postgres는 `create or replace view`에서 **옵션을 새로 적은 것으로 통째로 바꾼다 (안 적으면 비운다).** 그래서 010에서 둔 `security_barrier = true`가 꺼진다 (주석 "그대로 둔다"와 반대로 동작)
- 이 뷰는 주인 권한으로 RLS를 우회하고 where 조건으로만 다른 집을 거르므로, `security_barrier`가 꺼지면 조건보다 먼저 실행되는 함수로 다른 집 행이 새어 나갈 수 있다
- 고칠 것: `create or replace view public.household_member_profiles with (security_barrier = true, security_invoker = false) as ...`로 010과 같은 옵션을 명시. 013 상단 주석도 맞게 고친다
- 확인: 가능하면 로컬 DB에서 적용 후 `select reloptions from pg_class where relname = 'household_member_profiles';`에 두 옵션이 있는지

### 지시서와 다른 점 (사용자 결정 필요)

- 초대 수락 화면이 수락 중·수락 후 미리보기 조회를 끈다(`useInvitePreview(code, enabled)`). Cursor 표시 `미승인`
- Claude 의견: **유지 권장.** 켜 둔 채 지우면 화면에 붙어 있는 조회가 바로 다시 나가서, 지시서 목표("수락 직후 미리보기 다시 요청 안 함")를 지키려면 필요하다. 다른 동작 변화 없음

### 수정 지시 1 결과 (Claude가 직접 반영, 2026-11-25)

- `013_rls_perf.sql`의 뷰를 `with (security_barrier = true, security_invoker = false)`로 다시 만들도록 고치고 주석을 맞췄다
- `supabase db push --linked --dry-run`: 올라갈 마이그레이션은 `013_rls_perf.sql` 하나
- 확인하지 못한 것: 로컬 DB(Docker 꺼짐)에서 적용 후 `pg_class.reloptions` 확인. 원격 적용 후 아래로 확인한다
  `select reloptions from pg_class where relname = 'household_member_profiles';` → `{security_barrier=true,security_invoker=false}`

- 2026-11-25 사용자: 현재 코드(초대 수락 중·후 미리보기 조회 끄기 포함)로 커밋·배포 승인
