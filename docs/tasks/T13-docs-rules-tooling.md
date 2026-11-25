# T13. 문서·Cursor 규칙·서식 검사 맞추기 (T12 다음)

가족·다견 기능(T06~T10) 뒤 문서와 규칙이 코드와 어긋났다. 코드 동작은 바꾸지 않는다.

## A. 구조 문서

`docs/architecture.md`
- entities 도메인 목록에 `household` 추가 (`dog, guardian, walk, diary` → 지금 slice 기준)
- features 예시에 `family`(T11) 반영
- `@x` 예시에 실제로 있는 것(`entities/walk/@x/diary.ts`, `entities/dog/@x/diary.ts` 등)을 확인해 맞춘다
- "새 코드 어디에 둘까" 표에 "앱·서버에 같이 있는 값은 config 상수 + SQL 동기화 주석" 한 줄 추가

## B. Cursor 규칙 (`.cursor/rules/`)

1. `stateManagement.mdc`
   - 조회 파일 표에 `householdQueries.ts`, 선택한 강아지 store(`useSelectedDogStore`, AsyncStorage) 추가
   - `diaryKeys` 예시를 실제(`src/entities/diary/api/diaryApi.ts`의 `diaryKeys`, T12에서 바뀌었으면 그 기준)와 같게
   - "가족·강아지가 바뀌는 변경은 `features/family`의 hook으로 하고 관련 조회를 한 번에 새로 고친다" 추가
2. `supabasePatterns.mdc`
   - entity 목록에 `household` 추가
   - `startWalk` 예시를 지금 코드(`startWalk(dogIds: string[])`, 대표 강아지는 트리거)로 바꾼다
   - RLS 작성 규칙 추가: "집 단위 조회 정책은 `household_id in (select public.my_household_ids())` 형태로 (행마다 함수 호출 금지)" (T11 A 기준)
3. `namingConventions.mdc`: query key 목록을 실제 export(`diaryKeys`, `dogKeys`, `guardianKeys`, `householdKeys`, `walkKeys`, `shareLinkKeys`)에 맞춘다
4. `taskWorkflow.mdc`: 완료 조건에 `npm run format:check`를 넣는다 (아래 C)

## C. 서식 검사를 빠뜨리지 않게

지금 `npm run lint`는 서식(Prettier)을 검사하지 않아 서식이 어긋난 채로 들어왔다.
- `package.json`에 `"verify": "tsc --noEmit && eslint . && prettier --check \"src/**/*.{ts,tsx}\" \"*.{ts,js}\" \"plugins/**/*.js\""` 같은 스크립트를 추가한다 (새 패키지 없이)
- `AGENTS.md`, `docs/architecture.md` 체크리스트, `.cursor/rules/taskWorkflow.mdc`의 "통과해야 하는 검사"를 `npm run verify` 하나로 바꾼다
- `supabase/functions`도 Prettier 대상에 넣는다 (사용자 승인, 2026-11-25): `.prettierignore`에서 빼고, `format`·`format:check`·`verify` 경로에 `supabase/functions/**/*.ts`를 더하고, 한 번 서식을 맞춘다 (서식만 바꾸는 커밋은 따로)

## D. 인계·작업 문서

- `docs/handoff.md`: "다음은 T06(다견) — Cursor 구현 준비됨" 같은 지난 문장을 지우고 현재 상태(T01~T13, 결정 대기)로 정리
- `docs/tasks/README.md`: T11~T13 상태, 결정 대기 표 갱신
- `README.md`: 네이버 로그인 설정 절의 `EXPO_PUBLIC_NAVER_CLIENT_SECRET` 안내 등 지금과 다른 내용 정리 (앱은 브라우저 로그인, secret은 서버만)

## 완료 조건

- [x] 문서·규칙에 적힌 파일 경로·이름이 실제로 있다 (grep으로 확인)
- [x] `npm run verify` 통과

## 하지 말 것

- 코드 동작 변경, push·배포

## 배포

없음 (문서만). `docs/`는 push하면 GitHub Pages에 반영된다.

## 구현 결과 (Cursor가 작성)

- 커밋:
  - `e07ac2b` docs: 구조 문서에 household·@x·공유 상수를 반영한다
  - `1d0f7a9` docs: Cursor 규칙에 가족 조회·RLS·query key를 반영한다
  - `97680c4` chore: supabase/functions 서식을 맞춘다
  - `cfea6c8` chore: npm run verify로 타입·lint·서식 검사를 묶는다
  - `0075a1b` docs: 인계 문서와 네이버 로그인 안내를 현재에 맞춘다
- 지시서와 달라진 점 (각 항목에 `승인됨`/`미승인` 표시):
  - B.4의 `npm run format:check`는 C가 정한 `npm run verify` 안에 넣었다. 지시서의 "(아래 C)"대로라 완료 조건에 format:check를 따로 적지 않음
  - `docs/handoff.md` 5장 검증 명령을 `npm run verify`로 바꿈. 지시서 D는 지난 문장과 작업 상태만 적음. 채팅 승인 없음 → `미승인`
  - features 예시는 폴더 이름(`auth`, `onboarding`, `walk-session`, `settings`, `share-link`, `family`)으로 맞춤. `family`는 원래 적혀 있었음
  - 네이버 절에서 탈퇴 연동 해제 문단도 지금 코드에 맞춤 (`src/features/auth/api/authApi.ts`, 네이버는 앱에서 해제하지 않음)
- 확인하지 못한 것:
  - `.cursor/rules/projectOverview.mdc`, `docs/tasks/README.md` 진행 방식 2번, `docs/architecture.md` 맨 위 "lint가 통과해야 한다"는 지시서 목록에 없어 그대로 둠. 아직 `npx tsc --noEmit`, `npm run lint`
  - 화면 동작은 바꾸지 않음. `npm run verify`만 통과 확인

## 검토 (Claude, 2026-11-25)

결과: **통과.** `npm run verify` 통과 확인.

- A·B: 구조 문서와 Cursor 규칙 4개에 household·`features/family`·`my_household_ids()` RLS 규칙·실제 query key·`npm run verify`가 반영됐다. 문서에 적힌 `src/`·`supabase/`·`docs/` 경로를 모두 확인했고 없는 파일을 가리키지 않는다 (아래 README 제외)
- C: `verify`·`format`·`format:check`에 `supabase/functions` 포함, `.prettierignore`에서 제외. 서버 함수 서식 커밋(`97680c4`)은 따옴표·줄바꿈·쉼표만 바뀐 것을 파일별로 비교해 확인 (동작 변화 없음, 재배포 불필요)
- D: handoff·README 네이버 안내가 지금과 맞다
- 미승인 1건(handoff 5장 검증 명령을 `npm run verify`로): 유지 권장 — C의 의도와 같다

검토하며 Claude가 직접 마무리한 것 (Cursor가 "목록에 없어 그대로 둠"이라 적은 곳)
- `.cursor/rules/projectOverview.mdc`, `docs/tasks/README.md` 진행 방식, `docs/architecture.md` 맨 위의 검사 명령을 `npm run verify`로
- `README.md` "프로젝트 구조"가 옛 폴더(`src/components` 등)를 적고 있어 FSD 구조로 바꿈

- 2026-11-25 사용자: 미승인 1건(handoff 검증 명령) 유지
