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

| 명령어 | 하는 일 | 언제 쓰나 |
| --- | --- | --- |
| `npm start` | Metro 개발 서버 실행 (`--dev-client`) | **평소 개발** — JS/화면만 수정할 때 |
| `npm run prebuild` | `android/`, `ios/` 네이티브 폴더 생성 | 네이티브 패키지·플러그인·`.env` 키 변경 시 |
| `npm run prebuild:clean` | 네이티브 폴더를 지우고 다시 생성 | 앱이 완전히 꼬였을 때만 |
| `npm run android` | Android 앱 **빌드 + 실기기 설치** | Dev Client 최초 설치, 네이티브 변경 후 |
| `npm run ios` | iOS 앱 **빌드 + 실기기 설치** | Dev Client 최초 설치, 네이티브 변경 후 |
| `npm run android:release` | Android Release 빌드·설치 | 성능/배포 테스트 (가끔) |
| `npm run ios:release` | iOS Release 빌드·설치 | 성능/배포 테스트 (가끔) |

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

카카오 개발자 콘솔 등록:

- Android 패키지: `com.ezjing.meongmeonglog` + 키 해시
- iOS 번들 ID: `com.ezjing.meongmeonglog`
- 동의항목: 닉네임, 카카오계정(이메일)

네이버 개발자센터 iOS 등록:

- Bundle ID: `com.ezjing.meongmeonglog`
- URL Scheme: `navergCz8w9XGrHS81JnOoJB6`
- Android 패키지: `com.ezjing.meongmeonglog`
- `.env`에 `EXPO_PUBLIC_NAVER_CLIENT_SECRET` (Client Secret) 추가 필요

```bash
npm run prebuild:clean
npm run ios   # 또는 npm run android
```

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
