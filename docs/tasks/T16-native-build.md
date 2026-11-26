# T16. 다음 네이티브 빌드 (스토어 업데이트)

OTA로는 못 바꾸는 네이티브 변경을 한 번에 모아 새 빌드(스토어 업데이트)로 낸다.
**이 작업의 코드는 새 빌드가 나간 뒤에만 OTA로 보낼 수 있다.** 새 네이티브 모듈을 쓰는 JS가 옛 앱에 OTA로 가면 앱이 죽는다. 그래서 다른 지시서(T11·T12 등)와 섞지 않고 따로 커밋한다.

## A. `expo-clipboard`로 클립보드 바꾸기

문제
- `src/pages/family-manage/ui/FamilyManageScreen.tsx`가 React Native 코어 `Clipboard`(곧 없어질 예정, deprecated)를 쓰고, 웹은 `navigator.clipboard`로 따로 분기한다
- 일기 링크 복사(`src/features/share-link/lib/shareDiaryUrl.ts`)도 따로 구현돼 있다

할 일
1. `npx expo install expo-clipboard` (SDK 56 버전 문서 확인: https://docs.expo.dev/versions/v56.0.0/sdk/clipboard/)
2. `src/shared/lib/copyText.ts`에 `copyText(text): Promise<void>` 하나를 만들고 `expo-clipboard`의 `setStringAsync`를 쓴다 (웹도 같은 패키지로 동작하는지 문서로 확인. 안 되면 `.web.ts`로 나눈다)
3. 가족 초대 코드 복사를 `copyText`로 바꾼다
4. 일기 링크 복사 중 **Safari 탭 직후 복사 예약(`copyDiaryUrlWhenReady`, ClipboardItem에 Promise 전달)** 은 iPhone 웹 제약 때문에 만든 것이라 그대로 둔다. 바로 복사하는 경로만 `copyText`로 바꿀 수 있으면 바꾼다
5. 문구·동작 변경 없음

## B. 쓰지 않는 네이티브 설정 정리

- `@react-native-seoul/naver-login`: 앱이 브라우저 로그인으로 바뀌어 쓰지 않는다 → `package.json`과 `app.config.ts` 플러그인에서 제거. `EXPO_PUBLIC_NAVER_CLIENT_ID`를 이 플러그인 때문에만 쓰는지 확인하고, 다른 곳에서 안 쓰면 사용자에게 알린다
- `expo-secure-store`: `src`에서 import하지 않는다 → `app.json` 플러그인과 `package.json`에서 제거 (제거 전 grep으로 한 번 더 확인)

## C. 패키지 버전 맞추기

`npx expo install --check`가 알려 주는 버전으로 맞춘다 (현재 `react-native-screens`, `react-native-svg`). 다른 경고가 있으면 목록을 사용자에게 보여 주고 같이 맞출지 묻는다.

## 완료 조건

- [x] `npm run verify`(T13 이후) 또는 `npx tsc --noEmit`, `npm run lint`, `npm run format:check` 통과
- [ ] `npx expo prebuild --clean` 후 Android 개발 빌드(`npx expo run:android`)가 뜨고, 가족 초대 코드 복사·일기 링크 공유·카카오/네이버 로그인이 된다 (가능한 만큼, 못 한 것은 "확인하지 못한 것"에)
- [ ] 웹 빌드 `npx expo export --platform web` 통과, 웹에서 초대 코드 복사 동작

## 하지 말 것

- 이 작업의 커밋을 OTA로 내보내지 않는다 (새 빌드가 스토어에 나간 뒤 사용자 판단)
- push·배포

## 배포 (사용자가 실행)

1. `app.json`의 `version`을 올릴지(예: 1.2.0) 사용자가 정한다. runtimeVersion 정책이 `appVersion`이라 버전을 올리면 새 빌드부터 새 OTA 채널 버전이 된다
2. `.env`를 불러온 셸에서 **로컬 빌드**(`eas build --local`) → `eas submit --path`로 스토어 제출. 명령은 `README.md`의 "2. 빌드 (Android, 내 컴퓨터에서)"
3. 스토어 배포 뒤부터 이 코드가 들어간 OTA 가능

## 구현 결과 (Cursor가 작성)

- 커밋:
  - `e04606e` feat: 클립보드 복사를 expo-clipboard로 통일한다
  - `33299d7` chore: 쓰지 않는 네이버 로그인 SDK와 secure-store를 뺀다
  - `0d17dd9` chore: react-native-screens와 react-native-svg를 SDK 56 버전에 맞춘다
  - `eff7dd9` chore: 나머지 Expo 패키지를 SDK 56 권장 버전에 맞춘다
- 지시서와 달라진 점 (각 항목에 `승인됨`/`미승인` 표시):
  - `expo install --check`에 screens·svg 외 패키지 16개가 더 있어, 맞춘 뒤에 커밋했다. `승인됨` (`@expo/ui`, `expo`, `expo-constants`, `expo-dev-client`, `expo-file-system`, `expo-image`, `expo-image-manipulator`, `expo-image-picker`, `expo-linking`, `expo-location`, `expo-router`, `expo-sharing`, `expo-splash-screen`, `expo-symbols`, `expo-task-manager`, `expo-web-browser`)
  - README 네이버 절: `EXPO_PUBLIC_NAVER_CLIENT_ID`는 플러그인을 뺀 뒤 앱에서 쓰지 않는다고 고쳤다. `승인됨`
  - `expo-constants`·`expo-file-system`의 package.json 범위는 그대로다(`~56.0.18`, `~56.0.8`). 그 범위가 권장 버전을 포함하고, 잠금 파일은 `56.0.27`·`56.0.11`이다. `npx expo install --check`는 최신이라고 했다
  - `expo install --fix`가 `expo-image`, `expo-web-browser` 플러그인을 `app.config.ts`에 넣으려다 동적 설정이라 실패했다. 넣지 않았다. `미승인` (`expo-web-browser` 플러그인은 옵션 없이 호출하면 아무 것도 하지 않고, `expo-image` 플러그인은 iOS Pod에 기본값 `disableLibdav1d=false`만 적는다)
- 확인한 것:
  - 각 커밋 전에 `npm run verify` 통과
  - SDK 56 문서: `expo-clipboard` `setStringAsync`는 Android·iOS·웹. 웹은 Async Clipboard라 `.web.ts`로 나누지 않았다. Safari에서 주소를 나중에 채우는 `copyDiaryUrlWhenReady`는 그대로 두었다
  - `src`에 `expo-secure-store`, `@react-native-seoul/naver-login` import 없음. `EXPO_PUBLIC_NAVER_CLIENT_ID`는 빼기 전 플러그인 설정에만 있었다
  - `npx expo export --platform web` 통과. 웹 번들에 `copyText`와 `setStringAsync`가 들어 있다. `http://localhost:8082/login`이 로그인 화면까지 열렸다
  - `npx expo prebuild --clean --platform android` 후 Gradle 빌드 성공(6분 32초). 네이티브 모듈 목록에 `expo-clipboard` 56.0.4가 있고 `naver-login`·`expo-secure-store`는 없다
  - 에뮬레이터 저장 공간이 부족해 첫 설치는 실패했다. 예전 앱을 지운 뒤 APK 설치에 성공하고, 개발 빌드가 로그인 화면(카카오·네이버 버튼)까지 떴다. Android 번들도 Metro에서 만들어졌다
- 확인하지 못한 것:
  - 가족 초대 코드 복사, 일기 링크 공유. 로그인된 계정이 없어 그 화면까지 가지 못했다
  - 카카오·네이버 로그인. 버튼만 보였고 로그인은 누르지 않았다
  - 웹에서 초대 코드 복사. 개발용 로그인이 꺼져 있고, 자동화 브라우저는 문서 포커스가 없어 클립보드 쓰기가 `NotAllowedError`로 거절됐다
  - iOS 빌드·실기기
  - `.env`의 `EXPO_PUBLIC_NAVER_CLIENT_ID`는 지우지 않았다. 앱은 더 이상 읽지 않는다
- push·OTA·스토어 배포는 하지 않았다. 이 커밋은 새 스토어 빌드 전에 OTA로 보내면 안 된다

## 검토 (Claude, 2026-11-26)

결과: **통과.** 수정 지시 없음.

- `copyText`(`shared/lib`)가 `setStringAsync`의 실패(`false`)를 오류로 바꿔, 초대 코드 복사 실패 처리가 예전과 같다. Safari 예약 복사(`copyDiaryUrlWhenReady`)는 그대로다
- `src`·`app.config.ts`·`app.json`에 `naver-login`, `expo-secure-store`, RN `Clipboard`, `EXPO_PUBLIC_NAVER_CLIENT_ID` 사용이 남지 않았다
- Claude가 직접 다시 확인: `npm run verify` 통과, `npx expo install --check` → "Dependencies are up to date"
- `expo-image`·`expo-web-browser` 플러그인을 넣지 않은 것(`미승인`): 둘 다 옵션 없이는 바뀌는 네이티브 설정이 사실상 없어 그대로 둔다
- 함께 처리 (Claude): 앱 버전 `1.1.0` → `1.2.0`(`app.json`, `package.json`), `EXPO_PUBLIC_NAVER_CLIENT_ID`를 로컬 `.env`와 EAS 환경 변수(production·preview)에서 삭제

`expo-doctor` 경고 (이번 작업 전부터 있던 것, 이번 빌드를 막지 않음):
- `assets/images/icon.png`의 실제 형식이 JPG다 (확장자는 png). iOS 스토어 빌드 전에 PNG로 다시 저장하는 것이 좋다
- `eas-cli`가 프로젝트 의존성에 있다
- Expo SDK 56(React Native 0.85)의 Hermes에 알려진 메모리 문제가 있다. SDK 57 업그레이드에서 고쳐진다 (별도 작업)
