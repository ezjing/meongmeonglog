# T02. 작은 정리

코드 점검(2026-11-19)에서 남긴 항목. **동작·문구·숫자 값은 바꾸지 않는다** (아래에 적힌 것 외). 항목마다 따로 커밋한다.

## A. 웹 위치: 정확도 낮은 좌표가 좋은 좌표를 가리지 않게

파일: `src/features/walk-session/lib/walkLocationService.web.ts`, `src/features/walk-session/lib/webWalkGeolocation.web.ts`

문제
- 웹은 정밀(`enableHighAccuracy: true`)·대략(`false`) `watchPosition` 두 개를 산책 내내 켠다
- `walkLocationService.web.ts`에서 `shouldEmit` → `rememberEmitted` 순서로 거른 뒤 처리기로 넘기는데, 처리기(`walkLocationProcessor.ts`)가 정확도 30m 초과 좌표를 버린다
- 그래서 대략 좌표가 `rememberEmitted`에 기록되면 5초·5m 안에 들어온 정밀 좌표가 `shouldEmit`에서 걸러질 수 있다

할 일
1. `walkLocationService.web.ts`: `shouldEmit` **전에** 정확도가 30m를 넘는 좌표는 산책 경로 처리로 보내지 않는다
   - 30m는 `walkLocationProcessor.ts`의 `MAX_ACCURACY_M`과 같은 값이어야 한다. 상수를 한 곳에서 export해서 같이 쓴다 (같은 slice 안, 상대 경로)
   - 지도·날씨 구독(`subscribeWebWalkGeolocation`)은 그대로 모든 좌표를 받는다 (지도가 빨리 뜨는 데 대략 위치가 필요)
2. 대략 위치 watch를 끄는 것은 **하지 않는다** (지도 첫 위치가 늦어질 수 있어 이번 범위에서 제외)

완료 조건: 산책 중 웹에서 정밀 좌표가 대략 좌표 때문에 버려지지 않는다 (코드상 확인)

## B. 일기 생성 후 새로 고침 범위 줄이기

파일: `src/features/diary-generate/model/useGenerateDiary.ts` (C에서 옮긴 뒤에는 새 위치)

문제: `invalidateQueries({ queryKey: diaryKeys.all })`가 화면에 떠 있는 모든 일기 조회를 다시 불러온다. 많이 스크롤한 일기 목록은 불러온 페이지 수만큼 요청이 나간다.

할 일
- `src/entities/diary/api/diaryQueries.ts`의 `diaryKeys`를 확인하고, 새 일기가 영향을 주는 조회만 새로 고친다: 최근 일기, 날짜별(오늘), 캘린더, 목록(pages)
- 목록(pages)은 **첫 페이지만 다시 받도록** 한다. 방법이 여러 개면(예: `resetQueries`, `refetchType`) 구현 전에 사용자에게 어떤 방법인지 알리고 진행한다
- 일기 상세(`detail`)는 새 일기라 새로 고칠 필요 없음

완료 조건: 일기 생성 뒤 홈·목록·캘린더에 새 일기가 보인다. 목록이 여러 페이지여도 요청이 1번이다

## C. `features/diary-generate` slice 정리

`features/diary-generate`에는 16줄 hook(`useGenerateDiary`) 하나뿐이고 사용처도 한 화면이다. 산책 mutation hook들은 `entities/walk/api/useWalkMutations.ts`에 있다.

할 일
- `useGenerateDiary`를 `src/entities/diary/api/`의 mutation hook으로 옮기고(`diaryQueries.ts` 또는 새 파일 `useDiaryMutations.ts`), `entities/diary/index.ts`에서 export
- `src/pages/diary-generate/ui/DiaryGenerateScreen.tsx` import 변경
- `src/features/diary-generate/` 폴더 삭제
- `trackEvent`는 `@/shared/lib/analytics`라 entities에서 써도 된다 (walk mutation도 그렇게 함)
- `docs/architecture.md`·`.cursor/rules`에 `diary-generate` 예시가 있으면 함께 고친다

## D. 앱·웹 쌍 파일의 중복 상수·타입

할 일: `src/features/walk-session/config/walkTracking.ts`를 만들고 아래를 옮긴다. 값은 바꾸지 않는다.
- `LOCATION_INTERVAL_MS`, `LOCATION_DISTANCE_INTERVAL_M` (`lib/walkLocationService.ts`와 `.web.ts`에 각각 있음)
- `WebGeoFix` 인터페이스 (`lib/webWalkGeolocation.ts`와 `.web.ts`)
- 지도 기본 중심(서울시청 좌표), 경로 선 두께 (`ui/WalkMap.tsx`와 `.web.tsx`). 스타일 객체는 옮기지 않는다

## E. 조회 hook 세그먼트 맞추기

- `src/features/share-link/model/useSharedDiary.ts`, `useDiaryShareLink.ts`는 TanStack Query hook이다. `docs/architecture.md` 기준(`api/`: 서버 호출, TanStack Query hook)에 맞게 `api/`로 옮긴다
- `src/entities/walk/model/walkStore.ts`가 `../api/walkApi`에서 `WalkWeatherPayload` 타입을 가져온다 → 타입을 `model/types.ts`로 옮기고 `api`가 model을 참조하게 한다

## 공통 완료 조건

- [ ] 항목별 커밋, 각 커밋에서 `npx tsc --noEmit`, `npm run lint` 통과
- [ ] 마지막에 `npx expo export --platform web`, `npx expo export --platform android` 번들 생성 확인
- [ ] 화면 문구·숫자 값 변경 없음

## 배포 (사용자가 실행)

웹 배포 + Android OTA (`docs/handoff.md` 5장). 서버 변경 없음.

## 구현 결과 (Cursor가 작성)

- 커밋:
- 지시서와 달라진 점 (승인받은 것):
- 확인하지 못한 것:
