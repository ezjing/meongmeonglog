# 작업 인계 (2026-11-16 기준)

다른 도구(Cursor 등)에서 이어서 작업하기 위한 현재 상태 정리. 작업 규칙은 `AGENTS.md`, `docs/architecture.md`, `docs/design-tokens.md`, `.cursor/rules/`를 따른다.

> 이 폴더는 GitHub Pages로 공개된다. 민감한 내용(키, 보안 약점)은 저장소 밖의 `HANDOFF.local.md`(gitignore)에 있다.

## 1. 지금까지 끝난 것

| 영역 | 내용 |
|---|---|
| 버그 수정 | 강아지 정보 수정 시 로딩 멈춤, 등록 실패 시 무한 로딩, 사진 미리보기 이전/다음, 스크롤 중 카드 눌림, 탈퇴 버튼 중복 클릭, 좌표 기록 시각, 토스트 타이머, 산책 시작 무한 로딩, 키보드가 입력칸 가림(산책 종료·온보딩·정보 수정) |
| 기능 | 사진 확대(핀치·드래그·더블탭), 성격·말투 '기타' 직접 입력, 드로어에서 이용약관·개인정보처리방침·계정 삭제 안내 열기 |
| 구조 | FSD 전환(`app → pages → features → entities → shared`), ESLint로 규칙 강제, 미사용 코드·의존성·asset 정리, 중복 통합 |
| 디자인 | 3단계 디자인 토큰(팔레트 → 의미 → 컴포넌트), 버튼 역할 체계, 토스트 3종(✅ 성공 · ⚠️ 안내 · ❌ 실패) |
| 성능 | 산책 중 재렌더·저장소 읽기 감소, 좌표 500건 일괄 insert, 일기 목록 필요한 컬럼만·리스트 20개 무한 스크롤, 사진 중복 조회 제거, 온보딩 경로 판단 캐시 공유 |
| 서버 | Edge Function 공통 처리(`serveJson`), 외부 API 30초 타임아웃, 일기 생성 조회 병렬화, 이메일로 사용자 1명 조회하는 DB 함수(마이그레이션 007), 네이버 닉네임 없을 때 실명 저장 제거 |
| 문서 | 이용약관 초안(`docs/terms-of-service.md`, 법률 검토 전), README 정책 페이지 URL, 웹 지원 계획서 |

## 2. 배포 상태

| 대상 | 상태 |
|---|---|
| Edge Functions 6개 | 배포 완료 (auth-kakao, auth-naver, diaries-generate, welcome-greeting, share-card, delete-account) |
| DB 마이그레이션 | 001~007 원격 적용 |
| 앱 OTA | 2026-11-13 production 채널, runtime 1.1.0, Android — Update group `49908538-ff2b-495f-857e-5653ff969e20` |
| 스토어 빌드 | production 1.1.0 (version code 6). preview 프로필 빌드는 없음 |
| 정책 페이지 | GitHub Pages: `/meongmeonglog/terms-of-service`, `/privacy-policy`, `/account-deletion` |

**사용자 확인 대기**: OTA 적용 후 실기기에서 로그인, 실제 걸으며 산책 기록, 종료(메모 키보드)·일기 생성, 리스트 스크롤, 강아지 정보 수정.
문제 시 롤백: `npx eas-cli update:rollback` → **Embedded Update** 선택.

## 3. 다음 작업: 웹 1차 (W1 + W2)

계획 전체: `docs/web-plan.md`. 결정 사항 요약:
- 지도: Google Maps JS / 호스팅: EAS Hosting 기본 주소 `*.expo.app` (도메인 없음) / 산책은 화면 켜진 동안만 기록(수용)
- PWA: manifest + standalone + iOS Safari "홈 화면에 추가" 안내 배너
- 공유 링크: 본문·사진·강아지 이름·날짜·거리·시간만 공개, 경로·보호자 정보 숨김, 만료 없음 + "공유 중지", 앱은 이미지 공유 유지 + 링크 공유 추가

### 현재 웹 빌드 상태 (조사 결과)
- `web.output: "static"`은 빌드 중 Node에서 Supabase 클라이언트가 WebSocket을 찾다 실패 → **`"single"`(SPA)로 바꾸면 빌드 성공**
- SPA 빌드를 브라우저로 열면 **빈 화면**: 앱 시작 시 `react-native-maps`(네이티브 전용, `codegenNativeComponent`)를 불러오다 멈춤 → `WalkMap.web.tsx` 등 플랫폼 분리 필요

### 진행 순서 (제안 — 아래 "승인 대기" 참고)
1. 웹 분리 작업 + PWA
   - `web.output` → `"single"` (W5에서 OG 미리보기용 API route가 필요하면 `"server"`)
   - `.web.tsx` 분리: 지도(W1은 빈 자리), 백그라운드 위치 태스크(웹 미등록), 카카오·네이버 SDK(W2 전까지 안내), 사진 업로드 파일 읽기(`fetch(blob)`), 카드 캡처 공유(웹 숨김), 뒤로가기·Android 권한(웹 건너뜀)
   - 브라우저에서 화면별로 열어 남은 웹 오류를 찾아 같은 방식으로 분리
   - manifest(이름·아이콘·`bg` 배경·standalone), iOS 메타 태그, 홈 화면 추가 배너(iPhone Safari에서만, standalone 실행 중 숨김, 닫으면 다시 안 보임)
2. EAS Hosting에 비공개 배포해 주소 확보 (`meongmeonglog.expo.app` 신청, 실행 전 사용자 확인)
3. **사용자 작업**: 카카오·네이버 개발자 콘솔에 웹 도메인·Redirect URI 등록, 카카오 REST API 키를 Supabase secret으로 등록
4. 웹 로그인: 소셜 로그인 페이지 → 콜백 화면 → Edge Function이 인가 코드를 토큰으로 교환 → 기존 `createSocialSession` 재사용 (+ `HANDOFF.local.md`의 인증 보안 항목)
5. 재배포 → iPhone Safari·홈 화면 앱에서 로그인~일기 보기 확인
- 웹 1차 후 산책 시작 버튼은 웹에서 "곧 지원 예정" 안내 (문구 승인 필요). 사용자 공개는 W3(지도·산책) 이후 권장

### 승인 대기 (구현 전에 사용자에게 확인)
- 웹 1차를 위 순서(W1+W2 묶음)로 진행할지
- 홈 화면 추가 배너 문구 초안
  - `홈 화면에 추가하면 앱처럼 쓸 수 있어요`
  - `Safari 아래 공유 버튼(⬆️)을 누르고 '홈 화면에 추가'를 선택하세요`

## 4. 백로그

- W3 지도·산책(웹) → W4 사진(웹) → W5 공유 링크(마이그레이션·공개 조회 함수·공개 페이지·카톡 미리보기) → W6 QA
- 썸네일 원본 크기(46px에 원본 사용) — Supabase Pro 요금제 이미지 변환 시 처리 (보류)
- 캘린더 칸 크기가 화면 크기 변경을 반영하지 않음 (`Dimensions` → `useWindowDimensions`, 사소)
- 이용약관 초안 법률 검토 (사용자)
- 1.0.0 사용자는 OTA를 못 받음 → 스토어에서 1.1.0 업데이트 필요

## 5. 환경·명령

| 용도 | 명령 |
|---|---|
| 개발 서버 | `npm start` (Metro 8081, dev client) |
| iOS 시뮬레이터 빌드 | `npx expo run:ios` (`npm run ios`는 `--device`라 실기기용) |
| 검증 | `npx tsc --noEmit` · `npm run lint` · `npx expo export --platform android` (번들 확인) |
| 웹 빌드 확인 | `npx expo export --platform web` |
| Edge Function 배포 | `supabase functions deploy <이름> --project-ref ansjpqdsujostrhukygy` |
| 마이그레이션 | `supabase db push --linked --dry-run` → 확인 후 `supabase db push --linked` |
| OTA (production) | `.env`를 export한 셸에서 `npx eas-cli update --channel production --platform android --environment production --message "..."` |

- 테스트 프레임워크 없음 (단위·E2E 없음)
- `eas` 명령은 `.env`를 읽지 않아 앱 설정 단계에서 카카오 플러그인이 실패한다 → `set -a && . ./.env && set +a` 후 실행. 번들 값은 EAS production 환경 변수(`--environment production`)를 쓴다(값은 `.env`와 같은 Supabase 프로젝트)
- `supabase/.temp/cli-latest` 변경, `.env.example`(실제 값 포함, 커밋 금지)은 커밋하지 않는다
- 시뮬레이터 자동화 도구의 탭 입력이 불안정했음 — 화면 확인은 `xcrun simctl io <udid> screenshot`이 확실함
