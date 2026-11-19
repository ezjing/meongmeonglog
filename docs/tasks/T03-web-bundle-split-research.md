# T03. 웹 번들 나누기 가능 여부 조사 (코드 변경 없음)

## 배경

웹 번들이 한 파일(압축 전 약 2.9MB, gzip 약 716KB)이다. 로그인 없이 여는 공유 받는 페이지(`/s/[token]`)도 앱 전체를 내려받는다.
큰 의존성 (2026-11-19 `expo export` 기준, 압축 전 소스 크기):

| 패키지 | 크기 | 쓰는 곳 |
|---|---|---|
| expo-router | 1.16MB | 라우팅 |
| react-native-web | 720KB | 전체 |
| react-native-reanimated | 693KB | `shared/ui` 토스트 애니메이션, 사진 확대(`ZoomableImage`) |
| react-native-gesture-handler (+hammerjs) | 441KB | 제스처 |
| @supabase/realtime-js (+phoenix) | 143KB | 사용 안 함 |
| expo-symbols | 112KB | `StackAppBar`의 공유 아이콘 하나 |

## 조사할 것

1. **Expo Router 화면별 번들 나누기(async routes)**가 SDK 56에서 `web.output: "server"`(+middleware 사용)와 함께 되는지
   - 반드시 버전 문서를 본다: https://docs.expo.dev/versions/v56.0.0/ 와 Expo Router 문서
   - 설정 방법, 제약(서버 출력과의 호환, 프로덕션 빌드에서만 되는지 등)
2. **reanimated를 웹 첫 화면에서 빼는 방법**: 토스트를 `.web.tsx`로 CSS/`Animated`로 대체하면 reanimated가 사진 확대 화면에서만 로드되는지 (1번이 될 때만 의미 있음)
3. **expo-symbols**: `StackAppBar.web.tsx`로 아이콘을 대체하면 번들에서 빠지는지
4. **realtime-js**: supabase-js에서 realtime을 빼는 공식 방법이 있는지

## 결과물

코드는 바꾸지 않는다. 아래 "조사 결과"에 항목별로 적는다:
- 가능 여부 (근거 문서 링크)
- 바꿀 파일과 예상 효과 (가능하면 실험 브랜치에서 `npx expo export --platform web` 크기 비교, 실험 코드는 커밋하지 않음)
- 위험·주의점

Claude가 결과를 보고 구현 지시서(T04)를 쓴다.

## 조사 결과 (Cursor가 작성)

실험은 로컬에서만 하고 커밋하지 않았다. 설치본은 Expo SDK 56, `expo-router` 56.2.11. 기준은 `web.output: "server"` + `unstable_useServerMiddleware: true`인 지금 설정이다.

1. **가능. 서버 출력·middleware와 같이 된다.** 다만 SDK 56에서는 화면마다 따로 받는 것이 아니라, 여러 화면이 같이 쓰는 코드가 `__common` 한 파일로 모이고 **모든 HTML이 그 파일을 포함한다.** `/s/[token]` 첫 화면이 받는 양은 거의 줄지 않는다.
   - 근거: [SDK 56 Router 설정](https://docs.expo.dev/versions/v56.0.0/sdk/router/)의 `asyncRoutes` (`production`은 웹 전용, 네이티브 프로덕션에서는 꺼짐). [Async routes 가이드](https://docs.expo.dev/router/web/async-routes/)는 SDK 58부터 웹 기본값이고, 그 전(이 프로젝트)은 명시적으로 켜야 한다. 같은 가이드의 granular chunking(`experiments.chunking`)은 SDK 58 이상이라 56에는 없다.
   - 설치본 `babel-preset-expo`는 서버 번들과 네이티브 프로덕션에서 async routes를 끈다. 웹 클라이언트 번들만 `lazy`가 된다.
   - 설정: `app.config.ts`의 expo-router 플러그인에 `asyncRoutes: { web: 'production', default: false }`를 추가. 바꾼 뒤 `npx expo export --clear`.
   - 실험 (`npx expo export --platform web`, gzip은 최대 압축):
     - 끔: 클라이언트 JS 1개, 2873KB / gzip 700KB
     - 켬: JS 27개. `__common` 1713KB / gzip 396KB, `entry` 1060KB / gzip 279KB. middleware·정적 HTML은 그대로 생성됨
     - `/s/[token].html`이 로드하는 스크립트: runtime, 루트 layout, `[token]` 청크(4KB), `__common`, `entry`. 첫 다운로드 gzip 약 675KB. 전체 JS gzip은 702KB → 720KB로 오히려 조금 늘었다
   - 위험: 루트 `src/app/_layout.tsx`는 모든 페이지에 포함된다 (제스처 루트, 토스트, 인증, `features/walk-session` side-effect). 네이티브 프로덕션 번들은 나누지 않는다. 개발 모드에서 HTML과 JS가 어긋날 수 있다는 안내가 가이드에 있다.

2. **토스트만 웹용으로 바꿔도 reanimated는 사진 확대 화면으로 가지 않는다.** async routes를 켜도 `__common`에 남고, 공유 페이지 HTML이 그 파일을 받는다.
   - 웹 토스트(`Toast.web.tsx`, reanimated 없음) + 아래 3번의 앱 바를 같이 넣고 다시 export했다. `react-native-reanimated` 문자열은 여전히 `__common`에만 있고(10곳), `entry`와 `[token]` 청크에는 없다.
   - 이유: `ZoomableImage`는 경로가 아니라 `ImagePreviewModal` 안에 있다. 그 모달을 홈, 일기 본문(`DiaryContentView` → 공유 페이지), 산책 종료, 설정 드로어가 정적 import한다. SDK 56은 둘 이상의 화면이 쓰는 모듈을 `__common`에 넣는다.
   - 사진 확대를 열 때만 받게 하려면 모달을 `import()`로 늦춰야 하고, 그래도 다른 화면 두 곳이 쓰면 `__common`로 돌아가 공유 페이지가 받는다. 공유 페이지 첫 화면에서 빼려면 그 페이지의 import 자체도 끊어야 한다.
   - 제스처(`react-native-gesture-handler`, hammerjs)도 루트 layout과 확대가 같이 써서 `__common`에 남는다.

3. **빠진다.** `StackAppBar.web.tsx`에서 `expo-symbols`를 안 쓰면 웹 번들과 폰트가 빠진다. 네이티브 `StackAppBar.tsx`는 그대로다. `expo-symbols` import는 그 파일뿐이다.
   - 같은 실험에서 Material Symbols 폰트(956KB)가 export 결과에서 사라졌다. `__common`은 1713KB/gzip 396KB → 1608KB/gzip 357KB. reanimated는 그대로라 이 JS 감소(약 104KB, gzip 약 39KB)는 심볼 제거 쪽에 해당한다.
   - 주의: 웹 공유 아이콘을 뭘로 바꿀지는 구현 지시서에서 문구·아이콘을 정해야 한다. 이번 실험 파일은 지웠다.

4. **`createClient`에서 realtime만 빼는 공식 옵션은 없다.** 설치본 `@supabase/supabase-js` 2.108.2의 `dist/index.mjs`가 `@supabase/realtime-js`의 `RealtimeClient`를 직접 import하고 re-export한다. `realtime: { transport }`는 연결만 막을 뿐 코드는 남긴다 (지금 서버 렌더가 그렇게 한다).
   - 공식에 가까운 방법은 합친 패키지 대신 `@supabase/auth-js`, `postgrest-js`, `storage-js`, `functions-js`를 직접 쓰는 것이다. [supabase-js README](https://github.com/supabase/supabase-js/blob/HEAD/README.md)가 패키지를 나눠 두고, [tree-shaking 이슈](https://github.com/supabase/supabase-js/issues/151)는 2026년에도 열려 있다. 클라이언트 래퍼를 다시 짜는 일이라 이번 조사의 실험 범위에는 넣지 않았다.
   - 실험의 `__common`에 `realtime-js` 문자열이 남아 있다. async routes만으로는 빠지지 않는다.

- 커밋: 없음 (코드 변경 없음). 이 조사 기록만 문서 커밋
- 지시서와 달라진 점: 없음
- 확인하지 못한 것: 브라우저에서 청크가 실제로 순서대로 받아지는지. 크기 비교는 export 결과와 HTML의 script 태그까지다
