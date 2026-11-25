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

- [ ] `npm run verify`(T13 이후) 또는 `npx tsc --noEmit`, `npm run lint`, `npm run format:check` 통과
- [ ] `npx expo prebuild --clean` 후 Android 개발 빌드(`npx expo run:android`)가 뜨고, 가족 초대 코드 복사·일기 링크 공유·카카오/네이버 로그인이 된다 (가능한 만큼, 못 한 것은 "확인하지 못한 것"에)
- [ ] 웹 빌드 `npx expo export --platform web` 통과, 웹에서 초대 코드 복사 동작

## 하지 말 것

- 이 작업의 커밋을 OTA로 내보내지 않는다 (새 빌드가 스토어에 나간 뒤 사용자 판단)
- push·배포

## 배포 (사용자가 실행)

1. `app.json`의 `version`을 올릴지(예: 1.2.0) 사용자가 정한다. runtimeVersion 정책이 `appVersion`이라 버전을 올리면 새 빌드부터 새 OTA 채널 버전이 된다
2. `.env`를 불러온 셸에서 EAS 빌드 → 스토어 제출 (`eas.json`의 production 프로필)
3. 스토어 배포 뒤부터 이 코드가 들어간 OTA 가능

## 구현 결과 (Cursor가 작성)

- 커밋:
- 지시서와 달라진 점 (각 항목에 `승인됨`/`미승인` 표시):
- 확인하지 못한 것:
