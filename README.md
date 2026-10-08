# 멍멍로그 (Meongmeonglog)

강아지 AI 산책 일기 앱 — React Native (Expo 56) + Supabase + Groq

## 시작하기

```bash
npm install
cp .env.example .env
npm start
```

`.env`에 Supabase URL/Anon Key를 설정하지 않으면 `EXPO_PUBLIC_DEV_AUTH=true` 모드로 로컬 mock 데이터로 동작합니다.

## 개발 명령어

이 프로젝트는 **Expo Go가 아닌 Dev Client** + 네이티브 모듈(카카오, 네이버, 지도)을 사용합니다. `android/`, `ios/` 폴더는 git에 없고 `prebuild`로 생성됩니다.

| 명령어                    | 하는 일                               | 언제 쓰나                                  |
| ------------------------- | ------------------------------------- | ------------------------------------------ |
| `npm start`               | Metro 개발 서버 실행 (`--dev-client`) | **평소 개발** — JS/화면만 수정할 때        |
| `npm run prebuild`        | `android/`, `ios/` 네이티브 폴더 생성 | 네이티브 패키지·플러그인·`.env` 키 변경 시 |
| `npm run prebuild:clean`  | 네이티브 폴더를 지우고 다시 생성      | 앱이 완전히 꼬였을 때만                    |
| `npm run android`         | Android 앱 **빌드 + 실기기 설치**     | Dev Client 최초 설치, 네이티브 변경 후     |
| `npm run ios`             | iOS 앱 **빌드 + 실기기 설치**         | Dev Client 최초 설치, 네이티브 변경 후     |
| `npm run android:release` | Android Release 빌드·설치             | 성능/배포 테스트 (가끔)                    |
| `npm run ios:release`     | iOS Release 빌드·설치                 | 성능/배포 테스트 (가끔)                    |

### 평소 개발 (90%)

```bash
npm start
# 터미널에서 a (Android) 또는 i (iOS) — 이미 설치된 Dev Client 앱을 연다
```

`npm start` 후 `a`를 누르는 것은 **`npm run android`와 다릅니다.**

- `npm start` + `a` → 이미 깔린 앱을 열고 Metro에 연결 (네이티브 빌드 없음)
- `npm run android` → Gradle로 앱을 새로 빌드해서 실기기에 설치

### 네이티브가 바뀐 날 (10%)

`package.json`에 패키지 추가, `app.config.ts` 플러그인 변경, 카카오/네이버/지도 키 변경 시:

```bash
npm run prebuild
npm run android   # 또는 npm run ios
```

### 완전 초기화 (앱이 망가졌을 때)

```bash
rm -rf ios android node_modules .expo
npm install
npm run prebuild:clean
npm run android   # 또는 npm run ios
```

iOS만 꼬였을 때: `cd ios && pod install --repo-update && cd ..` 후 `npm run ios`  
Android만 꼬였을 때: `cd android && ./gradlew clean && cd ..` 후 `npm run android`

## Supabase 설정

```bash
# Supabase CLI 설치 후
supabase db push
supabase functions deploy auth-kakao
supabase functions deploy auth-naver
supabase functions deploy diaries-generate
supabase functions deploy welcome-greeting
supabase functions deploy share-card
supabase functions deploy delete-account
```

Edge Function secrets: `GROQ_API_KEY`, `DEV_AUTH`, `SUPABASE_SERVICE_ROLE_KEY`

```bash
# console.groq.com 에서 API Key 발급 후 (카드 불필요)
supabase secrets set GROQ_API_KEY=your-groq-api-key --project-ref ansjpqdsujostrhukygy
```

### 카카오 실연동 (Dev Client 필수)

Expo Go에서는 동작하지 않습니다. 네이티브 빌드 후 테스트하세요.

```bash
# 1) 환경 변수
# .env → EXPO_PUBLIC_DEV_AUTH=false, EXPO_PUBLIC_KAKAO_APP_KEY=네이티브앱키

# 2) Supabase secret
supabase secrets set DEV_AUTH=false --project-ref ansjpqdsujostrhukygy

# 3) Dev Client 빌드
npm run prebuild:clean
npm run ios   # 또는 npm run android
```

#### Android 추가 설정

`.env`에 Android SDK 경로를 등록하세요 (`.env.example` 참고):

```bash
ANDROID_SDK_PATH=$HOME/Library/Android/sdk
```

`npx expo prebuild` 실행 시 `plugins/withAndroidLocalProperties.js`가 `android/local.properties`를 자동 생성합니다.

Android Studio에서 에뮬레이터를 켠 뒤:

```bash
npm run android   # 최초 1회: Dev Client 빌드·설치
npm start         # 이후 개발 시 Metro 실행 후 a
```

카카오 SDK Maven 저장소는 `plugins/withKakaoMaven.js` config plugin으로 prebuild 시 자동 추가됩니다.

#### 산책 지도 (react-native-maps)

- **iOS**: Apple Maps (별도 API 키 불필요)
- **Android Dev Client**: Google Maps API 키 필요

```bash
# .env — Google Cloud Console > Maps SDK for Android 활성화 후 API 키 발급
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=발급받은_API_키
```

Android 키 제한: 앱 패키지 `com.ezjing.meongmeonglog` + SHA-1 지문 등록.  
설정 후 `npm run prebuild:clean` → `npm run android` 로 다시 빌드하세요.

Expo Go에서는 Android/iOS 모두 추가 설정 없이 지도가 표시됩니다.

### 소셜 로그인 콘솔 설정

#### 카카오 개발자 콘솔

- Android 패키지 / iOS 번들 ID: `com.ezjing.meongmeonglog`
- 동의항목(필수 동의): 닉네임, 프로필 사진, 카카오계정(이메일) — 이메일은 비즈 앱(개인 개발자) 전환 필요
- 별도 운영 전환 검수 없음 (카카오 로그인 ON이면 모든 사용자 사용 가능)
- **Android 키 해시는 서명 키별로 모두 등록해야 한다.** 누락 시 해당 빌드에서만 카카오 로그인이 실패한다.

| 서명 키         | 사용처                        | SHA-1 확인 위치                                       |
| --------------- | ----------------------------- | ----------------------------------------------------- |
| 디버그 키       | 로컬 `npm run android`        | `android/app/debug.keystore`                          |
| 업로드 키       | EAS 빌드 산출물 직접 설치     | Play Console > 앱 서명 > 업로드 키 인증서             |
| Play 앱 서명 키 | **Play 스토어에서 설치한 앱** | Play Console > 앱 서명 > 앱 서명 키 (SHA-1 복사 버튼) |

SHA-1 → 카카오 키 해시 변환:

```bash
echo "AA:BB:...(SHA-1)" | tr -d ':' | xxd -r -p | openssl base64
```

#### 네이버 개발자센터

- Android 패키지 / iOS Bundle ID: `com.ezjing.meongmeonglog`
- iOS URL Scheme: `navergCz8w9XGrHS81JnOoJB6`
- `.env`에 `EXPO_PUBLIC_NAVER_CLIENT_SECRET` (Client Secret) 추가 필요
- 제공 정보: **이메일 주소만** 사용 (계정 식별 + 설정 > 로그인 계정에 표시)
- "개발 중" 상태에서는 등록자·멤버관리 테스터만 로그인 가능 → 출시 전 **검수상태 탭에서 검수 요청** 필요
  - 검수 첨부용 캡처: `store-assets/screenshots/naver-review/` (개인정보 마스킹 완료)

#### 회원 탈퇴 시 연동 해제

`deleteAccount()`(`src/lib/api/authApi.ts`)는 서버 계정 삭제 성공 후 로그인 수단에 맞춰 연동을 해제한다.

- 네이버: `NaverLogin.deleteToken()` / 카카오: `unlink()`
- 기기에 저장된 SDK 토큰으로 요청하므로, 앱 재설치 등으로 토큰이 없으면 해제되지 않는다 (탈퇴 자체는 정상 진행)

콘솔 설정(키·스킴) 변경 후에는 다시 빌드한다:

```bash
npm run prebuild:clean
npm run ios   # 또는 npm run android
```

## 배포 (Android)

서버 로직(LLM 모델/프롬프트 등)만 바뀐 경우와 클라이언트 코드가 바뀐 경우를 구분한다.

### 1. Supabase Edge Functions (서버 로직 변경 시, 필수)

```bash
supabase functions deploy diaries-generate
supabase functions deploy welcome-greeting
# 그 외 변경된 함수만 선택 배포
```

### 클라이언트 변경: OTA 업데이트 vs 스토어 빌드

| 변경 내용                                                                                    | 배포 방법                                      |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| JS/TS·화면·스타일·이미지 (`src/`, `assets/`)                                                 | **EAS Update (OTA)** — 스토어 심사 없이 반영   |
| 네이티브 패키지 추가·제거, 권한, `app.json`/`app.config.ts` 플러그인·키, Expo SDK 업그레이드 | **`version` 올리고** 2~3번(EAS Build + Submit) |

#### EAS Update (OTA)

`runtimeVersion` 정책은 `appVersion`이다. 업데이트는 **같은 `version`으로 빌드된 앱에만** 내려간다.

```bash
set -a && source .env && set +a
# 1) preview 채널로 먼저 확인 (preview 프로필 빌드에서 수신)
npx eas update --channel preview --environment preview --message "변경 내용"
# 2) 운영 배포
npx eas update --channel production --environment production --message "변경 내용"
```

- 앱은 실행 시 업데이트를 확인·다운로드하고 **다음 실행 때** 적용한다.
- 번들의 `EXPO_PUBLIC_*` 값은 `--environment`로 지정한 **EAS 환경변수**에서 가져온다 (로컬 `.env`와 값을 맞춰 둘 것).
  - EAS 환경변수는 production·preview 두 환경에 같은 `EXPO_PUBLIC_*` 값이 등록되어 있다. `.env` 값을 바꾸면 두 환경 모두 갱신한다 (`npx eas env:update`).
- **네이티브를 바꿨다면 반드시 `app.json`의 `version`을 올린다** (예: 1.0.0 → 1.1.0). 올리지 않으면 이전 네이티브 앱에 맞지 않는 JS가 내려가 앱이 깨질 수 있다.
- 문제가 생긴 업데이트는 `npx eas update:rollback`으로 되돌린다.

### 2. EAS Build (Android)

```bash
set -a && source .env && set +a   # eas-cli가 dynamic config(app.config.ts) 평가 시 .env를 못 읽는 버그 우회
npx eas build --platform android --profile production --non-interactive --no-wait
```

- `eas.json`의 `build.production.autoIncrement: true`로 `versionCode`가 매번 자동 증가한다.
- 빌드 상태 확인: `npx eas build:view <BUILD_ID> --json` (역시 `.env` source 필요)

### 3. EAS Submit (Play 프로덕션 트랙)

```bash
set -a && source .env && set +a
npx eas submit --platform android --id <BUILD_ID> --non-interactive
```

- `eas.json`의 `submit.production.android.track: "production"`으로 Play 정식 출시 트랙에 제출한다 (alpha는 "비공개 테스트", internal은 "내부 테스트"). 제출 후 Google 검토가 끝나면 자동 공개된다.
- 인증은 `submit.production.android.serviceAccountKeyPath: "./google-play-service-account.json"` (로컬 파일, git에는 커밋하지 않음 — `.gitignore` 등록됨)로 처리한다.
  - 이 키는 Google Cloud 서비스 계정(Play Android Developer API 사용 설정 필요) + Play Console "사용자 및 권한"에서 해당 서비스 계정 이메일을 출시 권한으로 초대해야 동작한다. 프로덕션 트랙 제출에는 프로덕션 출시 권한도 필요하다.
- **같은 versionCode는 재제출 불가** — "You've already submitted this version" 에러가 나면 2번(EAS Build)부터 다시 실행해 versionCode를 올린 뒤 그 빌드로 제출한다.
- 제출 자체(스토어에 실제로 반영되는 단계)는 자동화 권한 정책상 에이전트가 직접 실행하지 못할 수 있다 — 이 경우 명령을 직접 터미널에서 실행한다.

## 프로젝트 구조

- `src/app/` — Expo Router 화면 (SC-01~SC-12)
- `src/components/` — 공통 UI
- `src/hooks/` — React Query / 커스텀 훅
- `src/lib/` — Supabase, API, utils
- `src/stores/` — Zustand (산책 세션)
- `supabase/` — DB 마이그레이션, Edge Functions

## MVP 화면

| ID       | 화면          | 라우트                     |
| -------- | ------------- | -------------------------- |
| SC-01    | 로그인        | `/(auth)/login`            |
| SC-02~04 | 온보딩        | `/(onboarding)/*`          |
| SC-05    | 홈            | `/(tabs)`                  |
| SC-06~07 | 산책          | `/walk/*`                  |
| SC-08    | AI 일기       | `/diary/generate`          |
| SC-09~10 | 캘린더/리스트 | `/(tabs)/calendar`, `list` |
| SC-11    | 상세          | `/diary/[id]`              |
| SC-12    | 공유          | `/share/[diaryId]`         |

## 문서

- [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/)
- Cursor Rules: `.cursor/rules/`

## 참고

Dev mock: lib/api/\*에 in-memory fallback — Supabase 미설정 시 E2E 테스트 가능
실제 OAuth: Edge Function + Kakao/Naver SDK 연동은 Supabase 배포 후 키 설정 필요
공유 카드: MVP는 react-native-view-shot + expo-sharing (서버 렌더는 placeholder URL)
