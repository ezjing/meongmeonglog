# T05. 산책 기록 삭제

가족·다견 계획([docs/family-plan.md](../family-plan.md))의 1단계. 지금은 산책 도중 "산책 취소"만 있고, 끝난 기록은 지울 방법이 없다.

## 목표

일기 상세 화면에서 산책 기록 하나를 지운다. 일기·사진(DB 행과 저장소 파일)·공유 링크가 함께 사라진다.

## 현재 구조 (확인한 것)

- `walks`를 지우면 `walk_locations`, `walk_events`, `walk_photos`, `diaries`, `share_cards`가 `on delete cascade`로 함께 지워진다 (`001_initial.sql`)
- 사진 파일은 `walk-photos` 버킷의 `{uid}/{walkId}/{i}.jpg`에 있다 (`walkApi.ts` `uploadWalkPhotos`). 버킷이 **public**이라 DB 행만 지우면 파일 주소가 계속 열린다
- 저장소 정책은 자기 uid 폴더 파일을 지울 수 있다 (`006_restore_rls.sql`)
- 지금 `cancelWalk`는 DB 행만 지운다. 이번 작업 범위에서 `cancelWalk`는 바꾸지 않는다
- 일기 상세: `src/pages/diary-detail/ui/DiaryDetailScreen.tsx`. `Diary` 타입에 `walkId`가 있다
- 확인 다이얼로그 예: `src/pages/walk-active/ui/WalkActiveScreen.tsx`의 산책 취소 (`showAlert` + `destructive: true`)

## 단계

### 1. walk entity에 삭제 API 추가
파일: `src/entities/walk/api/walkApi.ts`, `useWalkMutations.ts`, `index.ts`

- `deleteWalk(walkId)`:
  1. `walk-photos` 버킷에서 `{uid}/{walkId}/` 폴더의 파일 목록을 받아 모두 지운다 (파일이 없으면 건너뜀)
  2. 그다음 `walks` 행을 지운다
  - 파일을 먼저 지우는 이유: 행 삭제가 실패해도 다시 시도하면 끝까지 지워진다. 반대 순서면 실패 시 주소가 열린 파일이 남는다
  - uid는 `uploadWalkPhotos`와 같은 방법으로 얻는다
  - 오류는 `AppError`로 던진다 (코드 이름은 기존 `walk_cancel_failed`와 같은 형식으로)
  - Supabase 미설정(mock) 분기는 `cancelWalk`와 같게 처리한다
- `useDeleteWalk()` mutation hook을 만들고 `index.ts`에서 이름을 명시해 export한다
- walk 쪽 캐시(`walkKeys.detail`, `walkKeys.photos`)는 성공 시 지운다

### 2. 일기 상세 화면에 삭제 연결
파일: `src/pages/diary-detail/ui/DiaryDetailScreen.tsx`, 새 파일 `src/pages/diary-detail/model/useDeleteDiaryRecord.ts`

- `useDeleteDiaryRecord`: `useDeleteWalk`를 부르고, 성공하면 diary 캐시를 정리한다
  - 이 화면에서만 쓰므로 page slice에 둔다 (entities끼리 import 금지 규칙 때문에 walk mutation이 diary 캐시를 직접 만지지 않는다)
  - 지운 일기의 `detail` 조회는 `removeQueries`
  - 최근·날짜별·캘린더는 `invalidateQueries`, 목록(`pages`)은 `resetQueries` (T02 `useGenerateDiary`와 같은 방식). 키는 `diaryKeys`를 쓴다
- 화면: 본문(`DiaryContentView`) 아래에 `Button variant="danger"`로 "기록 삭제"를 둔다
- 누르면 `showAlert`(`destructive: true`)로 확인 → 확인하면 삭제 → 성공 토스트 → `goBackOrHome()`
- 삭제 중에는 버튼에 `loading`
- 실패하면 오류 토스트, 화면은 그대로

### 문구 (2026-11-23 사용자 승인됨)

| 위치 | 문구 |
|---|---|
| 버튼 | `기록 삭제` |
| 다이얼로그 아이콘·제목 | `🐾` / `이 산책 기록을 삭제할까요?` |
| 다이얼로그 내용 | `일기와 사진, 공유 링크가 함께 삭제되고 되돌릴 수 없어요.` |
| 다이얼로그 버튼 | 취소 `취소` / 확인 `삭제하기` |
| 성공 토스트 (`success`) | `기록을 삭제했어요` |
| 실패 토스트 (`error`) | `기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.` |

## 완료 조건

- [ ] 일기 상세에서 삭제하면 홈·캘린더·리스트에서 그 일기가 사라진다
- [ ] Supabase 저장소에서 그 산책의 사진 파일이 사라진다 (사진 있는 기록으로 확인)
- [ ] 그 일기의 공유 링크(`/s/{token}`)가 "공유가 중지되었거나 없는 일기예요"를 보여 준다
- [ ] 실패 시 기록과 화면이 그대로다
- [x] `npx tsc --noEmit`, `npm run lint` 통과, `npx expo export --platform web`·`--platform android` 번들 생성

## 하지 말 것

- `cancelWalk`(산책 중 취소) 동작 변경
- 일기만 지우고 산책은 남기는 기능 (산책 전체를 지운다)
- 위 표에 없는 문구, 분석 이벤트 추가
- DB 마이그레이션·Edge Function 변경 (필요해 보이면 멈추고 묻는다)

## 배포 (사용자가 실행)

웹 배포 + Android OTA (`docs/handoff.md` 5장). 서버 변경 없음.

## 구현 결과 (Cursor가 작성)

- 커밋:
  - `676ff60` feat: 끝난 산책을 사진 파일과 함께 지우는 API를 추가한다
  - `ef58184` feat: 일기 상세에서 산책 기록을 삭제한다
  - `fb5c916` fix: 산책 사진 폴더의 파일을 빠짐없이 지운다
- 지시서와 달라진 점 (각 항목에 `승인됨`/`미승인` 표시):
  - 날짜별 목록·캘린더는 지운 일기의 로컬 날짜·그 달만 `invalidateQueries` 한다. T02 `useGenerateDiary`는 오늘·이번 달이다. 과거 기록을 지워도 그 날짜·달에서 빠지게 하려고 이렇게 했다. `승인됨` (2026-11-23)
- 확인하지 못한 것:
  - 로그인된 일기 상세에서 실제 삭제(홈·캘린더·리스트에서 사라짐, 저장소 사진 삭제, 공유 링크, 실패 시 화면 유지)는 계정으로 확인하지 않음. 코드상 `walks` 삭제 cascade와 공유 조회가 행이 없으면 "공유가 중지되었거나 없는 일기예요"로 가는 것까지 확인
  - `npx tsc --noEmit`, `npm run lint` 통과. `npx expo export --platform web`, `--platform android` 번들 생성 통과

## 검토 (Claude, 2026-11-23)

결과: **통과.** `tsc`·`lint` 통과 확인. 검토 시점에 구현 커밋은 `847ab83`으로 되돌려져 있어 작업 트리의 변경을 검토했다.

- 삭제 순서(사진 파일 목록 → 파일 삭제 → `walks` 행 삭제)와 mock 분기가 지시서대로다. 다시 눌러도 끝까지 지워진다
- 일기 목록 조회는 모두 일기 `created_at` 기준이라, 지운 일기의 로컬 날짜·달로 새로 고치는 키가 맞다
- FSD: walk mutation은 walk 캐시만, diary 캐시는 page slice가 정리한다. 확인 다이얼로그·`loading`·문구가 승인본과 같다

사용자 결정 필요
1. "구현 결과"의 `미승인` 1건: 날짜별 목록·캘린더를 오늘이 아니라 **지운 일기의 날짜·달**로 새로 고친 것. 과거 기록을 지울 때 그 날짜에서 사라지려면 이 방식이 맞다 (권장: 승인)

참고 (선택, 고치지 않아도 됨)
- `deleteWalk`의 로그인 없음 오류 메시지가 업로드 문구(`사진 업로드를 위해…`)를 그대로 썼다. 화면에는 공통 실패 토스트만 나가서 사용자에게는 보이지 않는다
- 상세 캐시를 `removeQueries`한 뒤 화면을 떠나서, 아주 잠깐 "일기를 찾을 수 없어요"가 보일 수 있다. 실기기에서 보이면 화면 이동 뒤에 상세 캐시를 지우도록 순서를 바꾼다

남은 확인: 실기기·계정으로 삭제 → 홈·캘린더·리스트에서 사라짐, 저장소 사진 삭제, 공유 링크 페이지, 실패 시 화면 유지
- 2026-11-23 사용자 결정: 지운 일기의 날짜·달 기준 새로 고침 **승인됨**. 남은 것은 실기기 확인
