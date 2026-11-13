# 멍멍로그 구조 규칙 (Feature-Sliced Design)

[FSD 공식 문서](https://fsd.how/docs/get-started/overview/) 기준을 따른다.
규칙 대부분은 `eslint.config.js`가 강제하므로 **`npm run lint`가 통과해야 한다.**

## 레이어

위 레이어만 아래 레이어를 import할 수 있다.

```
src/
├─ app/        Expo Router 라우트 (FSD의 app 레이어 역할: 레이아웃·프로바이더·라우팅)
├─ pages/      화면 단위 slice
├─ features/   여러 화면에서 재사용하는 사용자 행동 (로그인, 산책 기록, 일기 생성 …)
├─ entities/   도메인 데이터 (dog, guardian, walk, diary): API·타입·조회 hook·표시용 UI
└─ shared/     도메인을 모르는 공용 코드 (ui, api, lib, config, session)
```

- `widgets`, `processes` 레이어는 쓰지 않는다 (공식 문서가 비권장/폐지). 새 레이어도 만들지 않는다.
- import 방향: `app → pages → features → entities → shared`

## slice와 세그먼트

`pages`, `features`, `entities`는 slice로 나눈다. slice 이름은 kebab-case로, 화면 위치가 아니라 **도메인이나 사용자 행동**으로 짓는다.

slice 안은 목적별 세그먼트로 나눈다. 필요한 것만 만든다.

| 세그먼트 | 내용 |
|---|---|
| `ui/` | 컴포넌트 |
| `model/` | 상태(store), 타입, 비즈니스 로직 hook |
| `api/` | 서버 호출, TanStack Query hook |
| `lib/` | slice 내부 유틸 |
| `config/` | 상수 |

`shared`는 slice 없이 세그먼트만 둔다: `shared/ui`, `shared/api`, `shared/lib`, `shared/config`, `shared/session`.

## import 규칙

1. **같은 레이어의 다른 slice는 import하지 않는다.**
   - 두 기능을 함께 써야 하면 **상위 레이어(pages, app)에서 조합**한다.
   - 예: 설정 드로어(`features/settings`)는 로그아웃(`features/auth`)을 직접 import하지 않고, `onLogout` props로 받는다. 화면이 `useConfirmLogout()`을 연결해서 넘긴다.
   - 공통 로직이 필요하면 아래 레이어(entities/shared)로 내린다.
2. **entities끼리는 `@x` 공개 API로만** 참조한다.
   - `entities/<대상>/@x/<사용하는 쪽>.ts`에 그 slice 전용 export를 둔다.
   - 예: `entities/walk/@x/diary.ts`를 `entities/diary`가 사용한다.
   - `@x`는 최후의 수단이다. 먼저 slice를 합치거나 shared로 내릴 수 있는지 검토한다.
3. **다른 slice는 public API(`index.ts`)로만 import한다.**
   - `import { useDogs } from '@/entities/dog'` ✅
   - `import { useDogs } from '@/entities/dog/api/dogQueries'` ❌
4. **같은 slice 안에서는 상대 경로**로 import한다. 자기 slice의 `index.ts`를 alias로 import하지 않는다(순환 import 방지).
5. `shared`는 내부 파일끼리 자유롭게 import할 수 있다. 경로는 `@/shared/<세그먼트>/<파일>`을 쓴다.
6. 화면·UI 코드(`app`, `pages`, `*/ui`)는 `shared/api/supabase`를 직접 import하지 않는다. 각 slice의 `api` 세그먼트를 거친다.

## public API (`index.ts`)

- 다른 slice가 실제로 쓰는 것만 **이름을 명시해서** re-export한다. `export *`는 쓰지 않는다.
- 타입은 `export type { … }`으로 분리한다.
- slice 내부 전용 함수·타입은 export하지 않는다.
- `features/walk-session/index.ts`는 백그라운드 위치 태스크를 등록하는 side-effect import를 포함한다. 루트 레이아웃(`app/_layout.tsx`)이 이 slice를 import해서 앱 시작 시 태스크를 등록한다.

## 라우트와 화면

- `src/app`의 라우트 파일은 화면을 re-export만 한다.
  ```ts
  // src/app/(tabs)/index.tsx
  export { HomeScreen as default } from '@/pages/home';
  ```
- 화면 컴포넌트는 `pages/<화면>/ui/<이름>Screen.tsx`에 두고 `pages/<화면>/index.ts`로 export한다.
- `_layout.tsx`(스택·탭 구성, 프로바이더)는 `src/app`에 둔다.
- 한 화면에서만 쓰는 조각은 그 page slice 안에 둔다. 여러 화면에서 쓰면 성격에 따라 features/entities/shared로 옮긴다.

## 새 코드 어디에 둘까

| 이런 코드라면 | 위치 |
|---|---|
| 도메인을 모르는 버튼·모달·포맷 함수 | `shared/ui`, `shared/lib` |
| 서버 테이블 하나에 대한 조회·타입·표시 컴포넌트 | `entities/<도메인>` |
| 사용자가 하는 행동(버튼 → 여러 단계 처리)이 여러 화면에서 쓰임 | `features/<행동>` |
| 한 화면에서만 쓰는 조합 | `pages/<화면>` |
| 로그인 사용자 id 등 전역 세션 | `shared/session` |

## 디자인 토큰

색·모서리·그림자는 [docs/design-tokens.md](design-tokens.md)의 3단계 토큰을 따른다. 화면 코드는 `@/shared/config/theme`의 의미(2단계) 토큰만 쓰고, 팔레트나 색 값을 직접 쓰지 않는다 (lint 에러).

## 플랫폼별 파일 (웹 지원 대비)

플랫폼마다 구현이 다르면 같은 세그먼트에 `.web.tsx` / `.native.tsx`로 나눈다(예: `features/walk-session/ui/WalkMap.web.tsx`). public API는 그대로 유지한다.

## 작업 체크리스트

- [ ] 새 파일이 위 표의 올바른 레이어·slice·세그먼트에 있다
- [ ] 다른 slice에서 쓰는 이름을 그 slice의 `index.ts`에 명시해서 추가했다
- [ ] 쓰지 않게 된 public API export를 지웠다
- [ ] 색·모서리·그림자는 `@/shared/config/theme`의 의미 토큰을 용도에 맞게 썼다
- [ ] `npx tsc --noEmit`, `npm run lint`가 통과한다
