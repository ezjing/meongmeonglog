# 웹 지원 계획서

대상: 앱스토어 대신 **Safari(또는 홈 화면에 추가)로 접속하는 iOS 사용자**.
방식: 지금 코드베이스를 그대로 쓰고, 웹에서 안 되는 부분만 플랫폼별 파일(`*.web.tsx`)로 대체한다. 구조 규칙은 [architecture.md](architecture.md)를 따른다.

> 상태: 계획 단계. 아래 "결정 필요" 항목이 정해지면 단계별로 계획 → 승인 → 구현 → 커밋 순서로 진행한다.

## 1. 기능별 웹 가능 여부

| 기능 | 지금 구현 | 웹 | 대체 방법 |
|---|---|---|---|
| 카카오·네이버 로그인 | 네이티브 SDK | ❌ | OAuth 리다이렉트: 웹이 받은 인가 코드를 Edge Function이 토큰으로 교환 → 기존 `createSocialSession` 그대로 사용 |
| 산책 위치 기록 | 백그라운드 위치 태스크 (`expo-task-manager`) | ⚠️ | 웹은 백그라운드 위치 불가. **화면이 켜진 동안만** 브라우저 위치(watchPosition)로 기록 + 화면 꺼짐 방지(Wake Lock). 좌표 필터·거리 계산·저장·전송 로직은 재사용 |
| 지도 | `react-native-maps` | ❌ | `WalkMap.web.tsx`에서 웹 지도 SDK 사용 (결정 1) |
| 사진 선택·업로드 | `expo-image-picker` + `expo-file-system` | ⚠️ | 선택은 웹 지원. 업로드 시 파일 읽기만 웹 분기(`fetch(blob).arrayBuffer()`) |
| 공유 | `react-native-view-shot` 캡처 + `expo-sharing` | ❌ | 링크 공유(Web Share API)로 대체 — 2장 |
| 뒤로가기 확인, Android 알림 권한 | `BackHandler`, `PermissionsAndroid` | 해당 없음 | 웹에서는 건너뛰도록 분기 |
| 저장소·Supabase 세션 | AsyncStorage | ✅ | 웹에서 localStorage로 동작 (`shared/api/supabase.ts`에 웹 분기 있음) |

**가장 큰 제약 — 산책 기록:** iPhone 웹에서는 다른 앱으로 전환하거나 화면이 잠기면 기록이 멈추고, 그 구간 경로가 끊긴다. 웹 사용자에게 화면에서 안내해야 한다 (문구는 구현 시 승인).

## 2. share-card 링크 공유 (앱·웹 공통)

- 일기별로 추측 불가능한 **공유 토큰**을 `share_cards`에 저장 (마이그레이션 필요).
- 받는 사람은 **로그인 없이** `/s/{토큰}` 페이지에서 일기를 본다. RLS 때문에 토큰으로만 조회되는 공개 조회 함수를 별도로 둔다.
- **카카오톡 링크 미리보기(OG 태그)** 는 서버가 HTML을 내려줘야 한다. Supabase Edge Function은 기본 도메인에서 HTML 응답이 막혀 있으므로, 웹 호스팅의 Expo Router API route(`+api.ts`, server output)에서 미리보기 HTML을 만든다.
- 네이티브 앱 공유 버튼도 같은 링크 공유로 바꿀지 결정 필요 (결정 4).

## 3. 보안 개선 (함께 진행)

- 웹 로그인을 도입하면서 소셜 로그인 인증 흐름(토큰 교환·검증)을 서버 중심으로 정리하고, 관련 키 관리 방식을 함께 점검한다.

## 4. FSD 구조 영향

- 플랫폼별 구현은 같은 세그먼트에 `.web.tsx` / `.web.ts`로 둔다. public API는 그대로.
  - 예: `features/walk-session/ui/WalkMap.web.tsx`, `features/auth/lib/kakaoAuth.web.ts`
- 새로 생기는 것
  - `features/share-link` — 공유 링크 생성·공유
  - `pages/shared-diary` — 공개 일기 화면
  - `app/s/[token].tsx` — 로그인 보호 밖 라우트
  - `app/api/…+api.ts` — 미리보기 HTML

## 5. 진행 순서

| 단계 | 내용 | 비고 |
|---|---|---|
| W1 웹 기반 | 네이티브 전용 모듈 분기로 웹 빌드 통과, 호스팅 배포 설정, PWA manifest·아이콘 | `web.output` 결정 (API route가 필요하면 `server`) |
| W2 로그인 | 카카오·네이버 OAuth 리다이렉트, Edge Function 코드 교환, 인증 보안 점검(3장) | 카카오·네이버 개발자 콘솔에 웹 도메인·Redirect URI 등록 필요 (사용자 작업) |
| W3 지도·산책 | 웹 지도, 화면 켜진 동안 기록, Wake Lock, 제약 안내 | |
| W4 사진 | 업로드 파일 읽기 웹 분기 | |
| W5 공유 링크 | 마이그레이션(토큰), 공개 조회 함수, 공개 페이지, 카톡 미리보기, 앱·웹 공유 버튼 | DB 반영·배포 전 확인 |
| W6 QA | iPhone Safari·홈 화면 추가 상태에서 전체 흐름 | Wake Lock은 홈 화면 앱에서 iOS 18.4 이상만 정상 동작한다는 보고가 있어 실기기 확인 |

## 6. 결정 필요

1. **웹 지도**: (a) Google Maps JS — 기존 API 키 재사용(웹 도메인 제한 추가) / (b) 카카오맵 JS — 국내 지도 품질 좋음, 앱 지도와 모양이 다름
2. **호스팅·도메인**: EAS Hosting(Expo 공식, API route 지원) 추천. 공유 링크·OAuth Redirect용 도메인 보유 여부
3. **산책 기록 웹 제약**(화면 켜진 동안만 기록) 수용 여부
4. **공유 링크 범위**: 노출 정보(본문·사진·강아지 이름·거리·시간), 링크 삭제·만료 기능 필요 여부, 네이티브 앱도 링크 공유로 바꿀지
5. **PWA 안내**: iOS Safari 사용자에게 "홈 화면에 추가" 안내 표시 여부

## 참고 자료

- [Supabase: XHTML responses are only allowed with a Custom Domain enabled](https://supabase.com/changelog/29633-xhtml-responses-are-only-allowed-with-a-custom-domain-enabled)
- [Supabase Edge Functions: Development tips](https://supabase.com/docs/guides/functions/development-tips)
- [Expo TaskManager (SDK 56)](https://docs.expo.dev/versions/v56.0.0/sdk/task-manager/)
- [Expo: Publishing websites](https://docs.expo.dev/guides/publishing-websites/)
- [Expo Router: API routes](https://docs.expo.dev/router/reference/api-routes)
- [EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/)
- [Screen Wake Lock on iOS (Progressier)](https://progressier.com/pwa-capabilities/screen-wake-lock)
- [WebKit Bug 254545](https://bugs.webkit.org/show_bug.cgi?id=254545)
