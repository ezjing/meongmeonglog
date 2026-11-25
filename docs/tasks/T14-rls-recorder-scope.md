# T14. 산책 기록 쓰기 권한을 "기록자 또는 관리자"로 통일 (DB)

## 결정 (사용자 승인, 2026-11-25)

보기는 지금처럼 **가족 전체**. 산책 기록을 **쓰는(추가·수정·삭제) 권한은 그 산책을 시작한 사람(기록자) 또는 집 관리자**로 통일한다.
지금 수정·삭제는 대부분 이미 이렇게 돼 있고, 아래 몇 군데만 "가족 누구나"로 열려 있다. 앱 화면에는 이런 동작을 하는 버튼이 없어서 사용자에게 보이는 변화는 없어야 한다.

## 지금 상태와 바꿀 것

T11의 `013` 다음 번호로 새 마이그레이션 `014_rls_recorder_scope.sql`을 만든다. 정책 이름은 바뀐 의미가 드러나게 짓고, 기존 정책은 `drop policy if exists`로 지운다.
권한 판단은 이미 있는 `public.is_walk_recorder_or_admin(walk_id)`(011)를 쓴다.

| 테이블 | 동작 | 지금 | 바꾼 뒤 |
|---|---|---|---|
| `walks` | update | 가족 누구나 (`walks_update_member`, 010) | 기록자 또는 관리자. `with check`의 "강아지가 내 집 강아지" 조건은 유지 |
| `walk_dogs` | insert·update·delete | 가족 누구나 (`walk_dogs_member` for all, 010) | select는 가족 그대로, 쓰기는 기록자 또는 관리자. "대표 강아지와 같은 집 강아지만" 조건(010:470-479)은 유지 |
| `walk_events` | insert | 가족 누구나 (`walk_events_insert_member`, 011) | 기록자 또는 관리자 + 그 강아지가 그 산책의 `walk_dogs`에 있을 것 |
| `walk_photos` | insert | 가족 누구나 (`walk_photos_insert_member`, 011) | 기록자 또는 관리자 |
| `diaries` | insert | 강아지가 내 집이면 누구나, 산책과 연결 확인 없음 (`diaries_insert_member`, 010) | 기록자 또는 관리자 + 그 강아지가 그 산책의 `walk_dogs`에 있을 것 |

바꾸지 않는 것
- 모든 select(보기) 정책
- 이미 "기록자 또는 관리자"인 수정·삭제 정책, 좌표(`walk_locations`) 정책, 같이 간 가족(`walk_companions`), 공유 링크(`share_cards`), 사진 파일(storage) 정책
- 서버(Edge Function)는 service role로 동작해 RLS를 거치지 않는다. 일기 생성·탈퇴는 영향 없음

## 구현 전 확인 (반드시)

앱에서 위 테이블에 쓰는 곳이 모두 기록자 기기에서 일어나는지 코드로 확인하고, 결과를 "구현 결과"에 적는다. 하나라도 기록자가 아닌 사람이 쓰는 흐름이 있으면 **멈추고 사용자에게 묻는다.**
- `src/entities/walk/api/walkApi.ts`: 산책 시작(`walks` insert, `walk_dogs` insert), 종료·날씨(`walks` update), 이벤트 upsert, 사진 insert·delete
- 산책 시작 시 대표 강아지 `walk_dogs` 행은 009의 트리거(security definer)가 넣는다 → 영향 없는지 확인
- 다른 가족이 진행 중 산책 화면·같이 산책(T09)에서 쓰기 요청을 보내는지

## 완료 조건

- [ ] 로컬 DB(`supabase start`)에서 마이그레이션 적용 후, 기록자 계정으로 산책 시작 → 종료 → 이벤트·사진 저장이 되는지 SQL 또는 앱으로 확인. 가능하면 같은 집 비관리자 계정으로 남의 산책 `walks` update가 막히는지도 확인 (못 하면 "확인하지 못한 것"에)
- [x] `npx tsc --noEmit`, `npm run lint` 통과 (앱 코드 변경이 없으면 그대로)

## 하지 말 것

- 위 표 밖의 정책 변경, 앱 화면 변경
- push·배포

## 배포 (사용자가 실행)

`supabase db push --linked --dry-run`으로 014만 적용되는지 확인 → `supabase db push --linked`. 앱·웹 배포 필요 없음.

## 구현 결과 (Cursor가 작성)

- 커밋:
  - `7022c36` fix: 산책 기록 쓰기를 기록한 사람과 집 관리자로 제한한다
- 지시서와 달라진 점 (각 항목에 `승인됨`/`미승인` 표시):
  - 없음
- 앱에서 쓰는 곳 (구현 전 확인):
  - 산책 시작·날씨·종료·배변·사진 저장은 이 기기의 진행 중 산책(`activeWalk`)에서만 나간다. 그 산책은 `startWalk`가 넣고, `recorded_by` 기본값이 로그인한 사용자라 쓰는 사람이 기록자다
  - 대표 강아지 `walk_dogs` 행은 009 트리거(`security definer`)가 넣는다. 정책과 무관하다. 나머지 강아지는 산책을 만든 직후 같은 요청에서 넣는다
  - 다른 가족이 진행 중 산책을 볼 때는 `active_walks_for_dogs` 조회만 한다. 같이 간 가족 저장은 `walk_companions`이고 이번 변경 밖이다
  - 일기 행을 넣는 곳은 `diaries-generate`뿐이고 service role이라 RLS를 타지 않는다. 앱의 `diaries` 접근은 조회와 삭제뿐이다
- 확인한 것:
  - `npx tsc --noEmit`, `npm run lint` 통과 (앱 코드 변경 없음)
  - `supabase db push --linked --dry-run`: 올라갈 마이그레이션은 `014_rls_recorder_scope.sql` 하나. 적용은 하지 않았다
- 확인하지 못한 것:
  - 로컬 DB에서 마이그레이션을 적용한 뒤, 기록자 계정으로 산책 시작·종료·이벤트·사진 저장이 되는지, 같은 집 비관리자가 남의 산책 `walks` update를 못 하는지. Docker Desktop이 기동 직후 종료되어 `supabase start`를 하지 못했다

## 검토 (Claude, 2026-11-25)

결과: **통과.** 수정 지시 없음. 지시서와 다른 점 없음. 커밋은 마이그레이션 파일 하나(`014_rls_recorder_scope.sql`), 앱 코드 변경 없음. dry-run에서 올라갈 마이그레이션은 014 하나.

- 표의 5개(`walks` update, `walk_dogs` 쓰기, `walk_events`·`walk_photos`·`diaries` insert)가 모두 `is_walk_recorder_or_admin`으로 바뀌었고, 기존 조건(강아지가 내 집 강아지, 대표 강아지와 같은 집 강아지)은 그대로 남았다. 이벤트·일기 insert는 그 강아지가 그 산책의 `walk_dogs`에 있는지도 본다
- 보기 정책, 이미 기록자·관리자이던 수정·삭제, 좌표·같이 간 가족·공유 링크·사진 파일 정책은 건드리지 않았다
- 앱 흐름 확인이 맞다: 산책 시작(`walks` insert 뒤 별도 요청으로 나머지 `walk_dogs` insert — 이때 산책 행이 이미 있어 기록자 판단이 된다), 날씨·종료 update, 이벤트 upsert(수정 쪽은 원래 기록자·관리자), 사진 insert 모두 기록자 기기에서 나간다. 대표 강아지 행은 009 트리거(security definer)라 정책과 무관. 일기 insert는 서버(service role)
- 종료 시 `update ... select()`의 돌려받기는 012에서 고친 `walks` select 정책을 타므로 영향 없음
- 남은 확인 (배포 후): 실기기에서 산책 시작 → 종료 → 사진·메모 저장 → 일기 생성이 전처럼 되는지. 강아지 2마리 산책도 한 번

### 로컬 DB 실행 확인 (Claude, 2026-11-25)

`supabase db reset --local`로 001~014를 새로 적용하고, 관리자(엄마)·기록자(딸)·일반 가족(아빠) 계정으로 SQL을 실행했다.

| 누가 | 무엇을 | 결과 |
|---|---|---|
| 기록자 | 산책 시작, 강아지 추가, 종료(update), 이벤트 upsert(2마리), 사진 insert | ✅ 모두 성공 |
| 일반 가족 | 산책·산책 강아지 보기 | ✅ 보임 (1건, 2마리) |
| 일반 가족 | 남의 산책 update, 산책 강아지 delete | ✅ 0행 (막힘) |
| 일반 가족 | 산책 강아지·이벤트·사진·일기 insert | ✅ RLS 오류 (막힘) |
| 관리자 | 딸의 산책 update, 산책에 간 강아지 일기 insert | ✅ 성공 |
| 기록자 | 산책에서 뺀 강아지로 이벤트·일기 insert | ✅ RLS 오류 (막힘) |

참고: 로컬 DB는 `authenticated` 역할에 테이블 기본 권한(GRANT select·insert·update·delete)이 없어, 시험할 때만 원격과 같은 권한을 줬다. 원격(운영)은 Supabase 플랫폼 기본값으로 권한이 있다. 마이그레이션에 이 GRANT가 없어서, 프로젝트를 새로 만들면 앱이 테이블에 접근하지 못한다 → 별도 작업 후보(마이그레이션에 GRANT 명시).

### 배포 (2026-11-25)

- 마이그레이션 `014` 원격 적용. 확인: 새 정책 5종(`walks` update, `walk_dogs` insert·update·delete, `walk_events`·`walk_photos`·`diaries` insert)이 있고, 이전 정책 5개는 남아 있지 않다
