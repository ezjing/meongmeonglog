# T12. 구조 정리·공통화 (T11 다음)

2026-11-25 코드 점검에서 나온 구조 문제. **동작·화면 문구·숫자 값은 바꾸지 않는다** (옮기고 묶기만). 항목별로 나눠 커밋한다.
T11에서 만든 `features/family`를 그대로 쓴다.

## A. 화면에 있는 처리를 features/entities로 옮기기

1. **탈퇴 시 강아지 맡을 가족 고르기** — `src/pages/settings/ui/SettingsScreen.tsx`
   - "넘겨줄 가족이 필요한 집" 판단 → `entities/household/lib`의 함수(예: `householdsNeedingSuccessor(groups, userId)`)
   - 집별로 차례로 고르는 상태·확인 흐름·`deleteAccount(successors)` 호출 → `features/family` 또는 `features/auth`의 hook(예: `useDeleteAccountFlow`)과 시트 컴포넌트
   - 판단 규칙이 SQL(010의 탈퇴 함수)과 같다는 동기화 주석을 단다
2. **"강아지 정보는 집 관리자만" 확인** — `src/features/settings/ui/SettingsDrawer.tsx`와 `SettingsScreen.tsx`에 같은 코드·문구가 두 번 있다 → 하나의 함수/hook으로 합친다 (features끼리 import할 수 없으면 화면이 props로 넘긴다)
3. **기록 삭제 권한 판단** — `src/pages/diary-detail/ui/DiaryDetailScreen.tsx`의 "기록한 사람이거나 관리자" → `entities/household/lib`의 `canManageRecord(...)` (SQL `is_walk_recorder_or_admin`과 같다는 주석)
4. **같이 갈 강아지 고르기** — `src/pages/home/ui/HomeScreen.tsx`의 같은 집 강아지 거르기·선택 상태·정렬 → `features/walk-session/model`. 산책 시작 결과별 안내 문구 선택과 위치 권한 문구(홈과 `useWalkTracker.ts`에 거의 같은 3갈래)는 한 곳에서 고른다. **문구 자체는 바꾸지 않는다**

## B. 반복 코드 묶기

1. 호칭이 없을 때 쓰는 `'보호자'` — 클라이언트 여러 곳(`grep -rn "'보호자'" src`) → 하나의 함수(예: `guardianTitleOrDefault`). 위치는 `entities/guardian/lib` + 필요한 entity에 `@x`, 또는 `shared/lib` 중 구조 규칙에 맞는 쪽. 서버(`supabase/functions`)는 `_shared`에 같은 함수 하나로
2. 집 표시 — 관리자 찾기 → 집 이름, 집의 강아지 거르기·정렬, 강아지 이름 묶기가 가족 관리·설정·초대 수락 화면에 반복 → `entities/household/lib`(`householdTitle`, `findHousehold`, `otherMembers`)와 `entities/dog/lib`(`dogsOfHousehold`, 이름 묶기)
3. 일기 목록 새로 고침 — `entities/diary/api/useDiaryMutations.ts`와 `pages/diary-detail/model/useDeleteDiaryRecord.ts`에 같은 4줄, key를 손으로 조립 → `diaryKeys`에 prefix 함수(`recentAll(userId)` 등)를 추가하고 `invalidateDiaryLists(queryClient, userId)` 하나로
4. 사람 아바타 — `FamilyManageScreen.tsx`의 `MemberPhoto`와 `entities/dog/ui/DogAvatar.tsx`가 같은 구조 → `shared/ui/Avatar`(사진 없을 때 이모지 prop)로 묶고 둘이 감싼다
   - 사진이 없을 때 배경은 `docs/design-tokens.md`대로 `surfacePlaceholder`로 바꾼다 (사용자 승인, 2026-11-25. 지금 `DogAvatar`는 `primary`). 사람·강아지 아바타 모두 같은 토큰
5. 지도 "내 위치" 버튼 — `WalkMap.tsx`와 `WalkMap.web.tsx`에 버튼·스타일이 똑같이 있음 → 공통 컴포넌트 또는 `shared/ui/IconButton`
6. 초대 코드 글자 간격 — `InviteCodeScreen.tsx`(2)와 `FamilyManageScreen.tsx`(4)가 다르다. 글자 간격은 토큰이 없어서 화면마다 숫자를 직접 썼다
   - `src/shared/config/theme.ts`에 기본 스케일 `letterSpacing`을 추가한다 (`spacing`·`fontSize`처럼 단계만 있는 값): `{ none: 0, wide: 2, wider: 4 }`
   - 초대 코드는 두 화면 모두 `letterSpacing.wider`(4)로 맞춘다 (사용자 승인, 2026-11-25)
   - `docs/design-tokens.md`의 "기본 스케일" 목록에 `letterSpacing`을 추가한다

## C. 앱·서버에 같이 있는 숫자를 상수로

`entities/household/config`(또는 해당 slice config)로 모으고, 각 상수에 "SQL `010_households.sql`의 ○○과 맞춘다" 주석을 단다. 값은 바꾸지 않는다.
- 초대 코드 길이 6 (`InviteCodeScreen.tsx`)
- 초대 만료 7일 (`household.ts`, `FamilyManageScreen.tsx`)
- 시도 차단 1시간 (`household.ts`)
- 가족 최대 10명 (문구 안)
- 강아지 최대 10마리: `SettingsDrawer.tsx` 문구가 `MAX_DOG_COUNT`를 쓰지 않고 숫자를 직접 씀 → 상수로
- 산책 사진 최대 장수 `MAX_WALK_PHOTOS`(`WalkFinishScreen.tsx`) → `entities/walk/config`
- 강아지 친구 만남 단계 라벨(`WalkFinishScreen.tsx`)과 서버 `_shared/speechStyle.ts`의 같은 라벨에 서로 동기화 주석

## D. 로그인 오류 안내 하나로

`LoginScreen.tsx`와 `AuthCallbackScreen.tsx`가 오류 문구를 각자 고른다 (`AuthCallbackScreen`은 일반 `Error.message`까지 그대로 보여 줌). `features/auth`에 `loginErrorMessage(error, provider)` 하나를 두고 같이 쓴다. 문구는 기존 것만 쓴다.

## E. 파일 이름·위치 통일

- `entities/walk/api/useWalkMutations.ts`에 조회 hook까지 있다 → `walkQueries.ts`(조회 + `walkKeys`) + `useWalkMutations.ts`(변경)로 나누고 `walkKeys`를 export (T11에서 이미 했으면 생략)
- `entities/guardian/api/useGuardianProfile.ts`에 `guardianKeys`가 있다 → 다른 entity처럼 `guardianQueries.ts`
- `shared/lib/formatDistance.ts`에 날짜·나이 계산까지 있다 → `format.ts`(표시)와 `geo.ts`(거리 계산)로 나눔
- `features/auth/model/useAuthSession.ts`의 `['accountEmail', userId]` → key 객체로

## F. 서식

`npm run format`을 실행해 Prettier 기준으로 맞춘다 (현재 11개 파일이 어긋남). 서식만 바꾸는 커밋은 따로 둔다.

## 공통 완료 조건

- [x] `npx tsc --noEmit`, `npm run lint`, `npm run format:check` 통과
- [x] `npx expo export --platform web`, `--platform android` 통과
- [x] 화면 문구·숫자 값·색 변경 없음 (B-4 아바타 배경, B-6 글자 간격은 승인된 변경)

## 하지 말 것

- 권한 범위·DB 변경 (이번 범위 아님)
- push·배포

## 배포 (사용자가 실행)

웹 배포 + Android OTA (`docs/handoff.md` 5장). 서버 함수(`_shared`의 '보호자' 함수)를 바꿨다면 그 함수를 쓰는 Edge Function(`diaries-generate` 등)도 배포한다.

## 구현 결과 (Cursor가 작성)

- 커밋:
  - `fdfee62` refactor: 탈퇴할 때 맡을 가족을 고르는 흐름을 auth로 옮긴다
  - `cb0500c` refactor: 강아지 정보 수정 권한 확인을 한곳으로 모은다
  - `9dad14f` refactor: 기록 삭제 권한 판단을 집 entity로 옮긴다
  - `cd4e37c` refactor: 같이 산책할 강아지 선택과 시작 안내를 한곳으로 모은다
  - `9f0af7d` refactor: 호칭이 없을 때 보호자로 부르는 처리를 한 함수로 모은다
  - `59fb076` refactor: 집 이름과 강아지 목록 표시를 공통 함수로 묶는다
  - `16d5392` refactor: 일기 목록 새로 고침을 한 함수로 묶는다
  - `2c43458` refactor: 사람·강아지 사진을 공통 아바타로 묶는다
  - `67b0726` refactor: 지도의 내 위치 버튼을 공통 컴포넌트로 뺀다
  - `337fe04` refactor: 지도 화면의 import 순서를 맞춘다
  - `d7858e2` refactor: 글자 간격 스케일을 두고 초대 코드에 맞춘다
  - `3f98d1a` refactor: 앱과 서버가 같이 쓰는 숫자를 상수로 모은다
  - `b0aeda3` refactor: 로그인 실패 안내를 한 함수로 고른다
  - `320d125` refactor: 조회 hook과 거리·표시 함수 파일 이름을 맞춘다
  - `a0ce96a` style: Prettier 서식을 맞춘다
- 지시서와 달라진 점 (각 항목에 `승인됨`/`미승인` 표시):
  - 탈퇴 흐름은 `features/auth`에 둠. 지시서가 family 또는 auth를 허용하고, 탈퇴 호출이 auth에 있어서 auth를 씀
  - 호칭 기본값은 `entities/guardian`과 집·산책용 `@x`. 서버는 `_shared/guardianTitle.ts`
  - 지도 내 위치 버튼은 `features/walk-session`의 공통 컴포넌트. 지시서가 공통 컴포넌트 또는 `shared/ui/IconButton`을 허용
  - 사람 아바타 글자 크기는 예전 기본값(`fontSize.base`)을 유지하고, 사진이 없을 때 배경만 `surfacePlaceholder`로 바꿈 (B-4, 승인됨)
  - 초대 코드 글자 간격은 두 화면 모두 `letterSpacing.wider`(4). 입력 화면은 2에서 4로 바뀜 (B-6, 승인됨)
  - 강아지 최대 10마리는 SQL에 같은 제한이 없어 기존 `MAX_DOG_COUNT`를 문구에 넣음. 산책 사진 5장도 서버 상수가 없어 `entities/walk/config`로만 옮기고 SQL 주석은 달지 않음
  - `.cursor/rules/stateManagement.mdc`의 예시 파일 이름을 `guardianQueries.ts`, `walkQueries.ts`로 바꿈. 지운 파일을 가리키지 않게 한 것. `미승인`
- 확인하지 못한 것:
  - 화면을 눌러 탈퇴·가족·산책 시작·로그인 실패 문구를 다시 확인하지 않음. `tsc`, `lint`, `format:check`, 웹·안드로이드 번들 생성만 통과
  - `diaries-generate`는 배포하지 않음. `_shared`의 보호자 함수를 쓰므로 배포할 때 그 Edge Function도 올려야 함

## 검토 (Claude, 2026-11-25)

결과: **통과.** 수정 지시 없음. `tsc`·`lint`·`format:check`(어긋난 파일 0) 통과 확인.

동작이 바뀔 수 있는 곳은 예전 코드와 줄 단위로 대조했다
- 탈퇴(`useDeleteAccountFlow`·`SuccessorPickSheet`): 맡을 가족 판단·차례로 고르기·확인 문구·실패 안내가 예전 `SettingsScreen`과 같다
- 산책 시작(`useWalkPartyPicker`·`walkMessages`): 같은 집 강아지 거르기, 1마리면 바로 시작, 선택 0마리 안내, 대표 강아지 순서, 권한·진행 중·실패 문구가 예전 홈과 같다
- 일기 새로 고침(`invalidateDiaryLists`): 같은 4개 key, prefix 함수로 바뀜
- 아바타: 구조 같고 배경만 `surfacePlaceholder` (B-4 승인)
- 로그인 안내(`loginErrorMessage`): 웹 콜백 화면이 이제 일반 `Error` 원문 대신 "○○ 로그인에 실패했습니다."를 보여 준다 — D의 의도대로
- 화면 문구: 바뀐 한국어 문자열을 모두 뽑아 봤고, 숫자를 상수로 바꾼 것(`7일`→`${INVITE_EXPIRES_DAYS}일` 등)뿐이다
- 서버 `guardianTitleOrDefault`: 빈 호칭이 들어갈 수 없는 경로라 결과가 같다. **`diaries-generate` 재배포 필요**

지시서와 다른 점
- `.cursor/rules/stateManagement.mdc` 예시 파일 이름을 새 이름(`guardianQueries.ts`, `walkQueries.ts`)으로 바꿈 (`미승인`) — Claude 의견: 지운 파일을 가리키지 않게 한 것이라 유지 권장 (T13에서 다룰 내용을 미리 한 것)
- 나머지 "달라진 점"은 지시서가 허용한 선택지 안이거나 승인된 것

- 2026-11-25 사용자: 미승인 1건(규칙 예시 파일 이름) 유지, 커밋·배포 승인

### 배포 (2026-11-25)

- Edge Function `diaries-generate` 배포
- 웹 미리보기·정식 배포, Android OTA `483496d8-742f-4b6e-b808-0d6702c1f059`
