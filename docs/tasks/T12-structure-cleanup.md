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

- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run format:check` 통과
- [ ] `npx expo export --platform web`, `--platform android` 통과
- [ ] 화면 문구·숫자 값·색 변경 없음 (B-4 아바타 배경, B-6 글자 간격은 승인된 변경)

## 하지 말 것

- 권한 범위·DB 변경 (이번 범위 아님)
- push·배포

## 배포 (사용자가 실행)

웹 배포 + Android OTA (`docs/handoff.md` 5장). 서버 함수(`_shared`의 '보호자' 함수)를 바꿨다면 그 함수를 쓰는 Edge Function(`diaries-generate` 등)도 배포한다.

## 구현 결과 (Cursor가 작성)

- 커밋:
- 지시서와 달라진 점 (각 항목에 `승인됨`/`미승인` 표시):
- 확인하지 못한 것:
