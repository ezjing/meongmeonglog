# T04. 웹 공유 아이콘을 SVG로 바꿔 `expo-symbols`를 웹 번들에서 빼기

## 목표

일기 상세 화면 앱 바의 공유 아이콘 하나 때문에 웹 번들에 `expo-symbols`(JS gzip 약 39KB)와 Material Symbols 폰트(약 956KB)가 들어간다 (T03 조사 결과).
**웹에서만** 아이콘을 SVG로 그려 이 둘을 뺀다. 앱(Android/iOS)은 지금 그대로 `expo-symbols`를 쓴다.

결정 사항 (사용자 승인, 2026-11-19): A안 — Material "share" 모양을 SVG로 직접 그린다. 새 패키지 없음.

## 바꿀 파일

1. `src/shared/ui/ShareIcon.tsx` (새 파일, 네이티브)
   - 지금 `StackAppBar.tsx`의 `SymbolView` 부분을 그대로 옮긴다
     ```tsx
     <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} size={size} tintColor={color} />
     ```
   - props: `size: number`, `color: string`
2. `src/shared/ui/ShareIcon.web.tsx` (새 파일, 웹)
   - `react-native-svg`의 `Svg`, `Path`로 그린다 (`src/features/auth/ui/SocialIcons.tsx`와 같은 방식)
   - `viewBox="0 0 24 24"`, `fill={color}`, path는 Material Icons "share" (Apache 2.0):
     ```
     M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z
     ```
   - `expo-symbols`를 import하지 않는다
3. `src/shared/ui/StackAppBar.tsx`
   - `SymbolView` 대신 `<ShareIcon size={iconSize.sm} color={colors.fg} />`
   - `expo-symbols` import 삭제. 버튼의 `accessibilityLabel="공유"` 등 나머지는 그대로
   - `StackAppBar.web.tsx`는 만들지 않는다 (아이콘만 플랫폼별로 나눔)

## 완료 조건

- [x] `npx tsc --noEmit`, `npm run lint` 통과
- [x] `npx expo export --platform web` 결과에 `expo-symbols`·Material Symbols 폰트가 없다 (예: `grep -r "expo-symbols" dist/` 결과 없음, 폰트 파일 없음). 변경 전후 웹 JS 크기를 "구현 결과"에 적는다
- [x] `npx expo export --platform android` 통과 (앱은 `expo-symbols` 그대로)
- [x] 아이콘 크기·색·버튼 위치·라벨 변경 없음

## 하지 말 것

- 아이콘 모양·크기·색을 다르게 정하지 않는다 (위 path 외의 아이콘을 쓰려면 먼저 묻는다)
- `package.json`에서 `expo-symbols`를 지우지 않는다 (앱이 쓴다)
- push·배포하지 않는다

## 배포 (사용자가 실행)

웹 배포 (`docs/handoff.md` 5장). 앱은 동작 변화가 없어 OTA가 필수는 아니다 (다음 OTA에 함께 나가도 된다).

## 구현 결과 (Cursor가 작성)

- 커밋: `940c689` perf: 웹 공유 아이콘을 SVG로 바꿔 심볼 폰트를 뺀다
- 지시서와 달라진 점: 없음
- 웹 JS 크기 (변경 전 → 후): 2873.4KB / gzip 699.7KB → 2770.1KB / gzip 661.6KB. 웹 export에 `expo-symbols` 문자열과 Material Symbols 폰트(956KB) 없음. Android export에는 그 폰트 파일이 남아 있음
- 확인하지 못한 것: 로그인된 일기 상세에서 아이콘이 어떻게 보이는지는 브라우저로 확인하지 못함

## 검토 (Claude, 2026-11-19)

결과: **통과.** 수정 지시 없음. 지시서와 다른 점 없음.

- 코드가 지시서와 같다: 네이티브 `ShareIcon.tsx`는 기존 `SymbolView` 그대로, 웹 `ShareIcon.web.tsx`는 지정한 path로 SVG, `StackAppBar`는 크기(`iconSize.sm`)·색(`colors.fg`)·라벨 그대로
- 직접 확인: `tsc`·`lint` 통과, 웹 export에 `expo-symbols`·`SymbolView` 문자열과 심볼 폰트 없음
- 남은 확인 (배포 후): 웹 일기 상세 화면에서 공유 아이콘 모양
