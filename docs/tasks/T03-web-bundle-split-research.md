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

1.
2.
3.
4.
