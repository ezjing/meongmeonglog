# 작업 인계 (2026-11-18, 웹 W5 배포까지)

다른 도구(Cursor 등)에서 이어서 작업하기 위한 현재 상태 정리. 작업 규칙은 `AGENTS.md`, `docs/architecture.md`, `docs/design-tokens.md`, `.cursor/rules/`를 따른다.

> **작업 방식:** Claude가 계획·검토하고 Cursor가 구현한다. 할 일은 `docs/tasks/`의 작업 지시서로 주고받는다 (`docs/tasks/README.md`).

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
| 웹 W1 | `web.output: "server"`(루트 HTML `src/app/+html.tsx`에 PWA 설정), 네이티브 전용 모듈 `.web` 분리, PWA manifest·아이콘, iPhone Safari 홈 화면 추가 배너 |
| 웹 W2 | 카카오·네이버 웹 로그인. 브라우저가 인가 코드를 받고 Edge Function이 토큰으로 교환한 뒤 기존 `createSocialSession` 사용. 콜백 경로 `/callback` |
| 앱 네이버 로그인 | SDK 대신 브라우저 로그인(Custom Tab). 웹 `/callback`(+middleware)이 앱에서 시작한 로그인을 `meongmeonglog://oauth-callback`으로 돌려보내고, 서버가 코드를 교환. Supabase secret `OAUTH_STATE_SECRET` 필요. 탈퇴 시 네이버 연동 해제는 하지 않음(계정 삭제 안내 페이지에 해제 방법 안내) |
| 웹 W3 | Google Maps JS, 화면이 켜진 동안만 위치 기록, 화면이 숨으면 그 구간은 경로에 잇지 않음, 화면 꺼짐 방지(Wake Lock). iPhone에서 지도가 현재 위치로 이동하는 것까지 확인 |
| 웹 W4 | Safari용 사진 선택(`pickImage.web.ts`). 탭 안에서 바로 앨범·카메라를 연다. 리사이즈·업로드는 기존 `manipulateAsync`와 `readStorageImageBytes.web.ts`. 웹에는 자르기 화면이 없다. 미리보기·정식 주소에 배포됨. 아이폰에서 앨범·카메라·업로드는 아직 확인 전 |
| 날씨·웹 위치 | 날씨 기본 서버가 응답하지 않으면 다른 Open-Meteo 주소로 조회. 홈 화면 앱은 산책 시작 탭에서 대략적인 위치와 정밀 위치를 함께 요청. 웹에는 배포됨. 네이티브 앱 업데이트는 아직 없음 |

## 2. 배포 상태

| 대상 | 상태 |
|---|---|
| Edge Functions 5개 | 배포 완료 (auth-kakao, auth-naver, diaries-generate, welcome-greeting, delete-account). 2026-11-24 T08 반영: `diaries-generate` v39(집 구성원 권한), `delete-account` v12(관리자 넘기기·남는 집 파일 보존). T09 반영: `diaries-generate` v40(같이 간 가족 호칭, 기록한 사람 기준 양육 정보). 쓰지 않던 share-card는 2026-11-18 삭제 |
| DB 마이그레이션 | 001~016 원격 적용. 008 일기 공유 링크, 009 다견 산책, 010 가족(집·초대 코드·권한) — 2026-11-24 적용, 사용자 8명 → 집 8개. 011 같이 산책(같이 간 가족·동시 산책 막기·수정 권한) — 2026-11-24 적용. 012 산책 읽기 정책 수정 — 2026-11-25 적용 (010 이후 산책 시작이 RLS 오류로 모두 실패하던 문제). 적용 전 백업은 로컬 scratchpad에만 있음 |
| 웹 미리보기 | `https://meongmeonglog--preview.expo.app` (alias `preview`). 2026-11-23 T06·T10·사진 4:3 반영본 |
| 웹 정식 주소 | `https://meongmeonglog.expo.app` 배포됨 (2026-11-25 앱바 여백·홈 메뉴 높이·공유 일기 시작 버튼. 이전 2026-11-24 T08·T09). 카카오·네이버 콜백에 이 주소가 등록된 상태 |
| 앱 OTA | 2026-11-25 production 채널, runtime 1.1.0, Android — Update group `6e8a0ca9-40d9-4f68-b69f-ba876c23882d` (T15 여러 마리 일기). 이전 기록은 git 기록과 docs/tasks 참고 |
| 스토어 빌드 | production **1.2.0 (version code 8)**, 2026-11-26 로컬 빌드(`eas build --local`) → Play 프로덕션 제출. T16(네이티브 변경) 포함. version code 7(1.1.0)은 검토에 보내지 않고 8로 대신함. **runtime 1.2.0이라 이후 OTA는 1.2.0 설치본에만 간다. 8이 공개되기 전에는 OTA 금지.** preview 프로필 빌드는 없음 |
| 정책 페이지 | GitHub Pages: `/meongmeonglog/terms-of-service`, `/privacy-policy`, `/account-deletion` |

**사용자 확인 대기**: OTA 적용 후 실기기에서 로그인, 실제 걸으며 산책 기록, 종료(메모 키보드)·일기 생성, 리스트 스크롤, 강아지 정보 수정.
문제 시 롤백: `npx eas-cli update:rollback` → **Embedded Update** 선택.

## 3. 웹 W5 (배포됨)

공유 링크와 5장 초과 안내는 미리보기·정식 웹 주소에 배포됐다. 앱 업데이트는 아직 없다.
- 일기마다 토큰 하나. 다시 공유하면 같은 주소를 다시 켠다. 토큰은 서버가 만든다
- 받는 사람 페이지 `/s/{token}`은 로그인 없이 연다. 본문·한마디·사진·이름·날짜·거리·시간만 보여 준다
- 앱은 이미지 공유를 유지하고 "링크 공유"와 "공유 중지"를 추가했다. 웹은 링크 공유만. 앱에서 쓰려면 OTA가 필요하다
- 카카오 미리보기를 위해 `web.output`을 `server`로 바꿨다

웹 지원 결정 사항 (계획서는 완료 후 삭제):
- 지도: Google Maps JS. 안드로이드 키와 웹 키는 분리한다. 웹 키 환경 변수는 `EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY`
- 호스팅: EAS Hosting `*.expo.app`. 미리보기 alias는 `preview`
- 산책: 화면이 켜진 동안만 기록. 승인된 안내 문구는 아래에 있다
- 공유 링크(W5): 본문·한마디·사진·강아지 이름·날짜·거리·시간만 공개, 경로·보호자 정보 숨김, 만료 없음 + "공유 중지". 앱은 이미지 공유 유지 + 링크 공유 추가

### 다른 컴퓨터에서 시작하기 전에
- 날씨 대체 주소·홈 화면 앱 위치·5장 안내·W5 공유 링크는 이 커밋들에 들어 있다. push는 사용자가 한다
- `.env`는 git에 없다. 지금 컴퓨터를 그대로 복사해야 한다. 변수 이름만 적으면 Supabase URL·anon key, 카카오 네이티브 앱 키, 네이버 클라이언트 ID, 구글 지도 안드로이드 키·웹 키, `EXPO_PUBLIC_DEV_AUTH`, `ANDROID_SDK_PATH`, `GROQ_API_KEY`
- `.env.example`에는 실제 값이 들어 있다. 커밋하지 않는다
- `supabase/.temp/`는 git에 없다(CLI 로컬 캐시). 새 컴퓨터에서는 `supabase login` 후 `supabase link --project-ref ansjpqdsujostrhukygy`를 한 번 실행한다. `--project-ref`를 붙이는 명령(함수 배포·secret)은 link 없이도 되고, `db push --linked`는 link가 필요하다
- `eas` / `expo export` 전에 `set -a && . ./.env && set +a`. EAS는 `.env`를 읽지 않아 카카오 플러그인이 실패한다
- 웹 배포: `npx expo export --platform web` 후 미리보기는 `npx eas-cli deploy --non-interactive --alias preview --export-dir dist`, 정식 주소는 `npx eas-cli deploy --non-interactive --prod --export-dir dist`. 실행 전 사용자 확인

### 콘솔에 이미 해 둔 것
- 카카오·네이버 콜백은 미리보기와 정식 주소 둘 다 등록: `https://meongmeonglog--preview.expo.app/callback`, `https://meongmeonglog.expo.app/callback`. 네이버 서비스 URL은 PC 웹에 미리보기, 모바일 웹에 정식 주소
- 카카오 REST API 키는 Supabase secret `KAKAO_REST_API_KEY`. 그 밖의 로그인 보안 설정은 `HANDOFF.local.md` 참고
- 구글 지도: 기존 키는 Android 앱 제한 유지. 웹용 키는 웹사이트 제한에 미리보기·정식 주소와 Maps JavaScript API. 미리보기 주소에서 서울 지도 타일이 열리는 것 확인

### 승인된 웹 문구
- 홈 화면 추가 배너: `홈 화면에 추가하면 앱처럼 쓸 수 있어요` / `Safari 아래 공유 버튼(⬆️)을 누르고 '홈 화면에 추가'를 선택하세요`
- 산책 안내: `웹에서는 이 화면이 켜져 있는 동안만 경로가 기록돼요. 화면을 끄거나 다른 앱으로 나가면 그 구간은 빠집니다.` (산책 중 화면에만 표시)
- 공유: `🔗  링크 공유`, `공유 중지`, `링크를 복사했어요`, `공유 링크를 만들지 못했어요`, `공유를 중지했어요`, `공유를 중지하지 못했어요`
- 공유 받는 페이지: `산책 일기`, `공유가 중지되었거나 없는 일기예요`, 불러오기 실패 시 `일기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.` + `다시 시도`
- 웹 지도 로드 실패: `지도를 불러오지 못했어요`
- 위치·사진: `위치 권한을 허용해야 산책을 기록할 수 있어요.`, `산책 기록을 위해 위치 권한을 허용해 주세요.`, `위치 추적을 시작하지 못했어요.`, `최대 5장까지 첨부할 수 있어요. 그중 5장만 넣었어요.`
- 다시 공유하면 예전 주소를 다시 켠다(새 주소를 만들지 않음)
- 웹 링크 공유: 이미 켜진 링크는 공유 시트, 처음 공유·다시 켤 때는 링크 복사(Safari가 탭 직후에만 공유 시트를 허용)

### W4에서 남은 확인
- iPhone Safari에서 앨범 선택, 카메라 촬영, 미리보기, 업로드. 확인할 주소는 `https://meongmeonglog.expo.app`
- 웹은 사진을 사각형으로 자르지 않는다. 프로필은 원 안에 꽉 차게 보인다
- W5는 웹에 배포됐다. 앱의 링크 공유는 OTA 전이라 아직 설치본에 없다

### 아직 열린 확인
- iPhone에서 화면을 끄거나 다른 앱으로 나갔을 때 그 구간이 경로에서 빠지는지, 실외에서 실선이 이어지는지

## 4. 지금 할 일

기준은 `docs/tasks/README.md`.

- T01~T12, T14: 완료 (배포됨)
- T13: 검토 대기 (문서·규칙·`npm run verify`)
- T15~T17: 준비됨. T15 여러 마리 일기 사진은 한 번만, T16 다음 네이티브 빌드, T17 테이블 기본 권한
- 지시서가 없는 결정: 일기 생성 실패의 서버 로그, 썸네일, 오류 모니터링, 분석 도구, 웹 프로필 사진 자르기, PWA 오프라인, 다음 스토어 빌드 시점 (넣을 항목은 T16)
- 이용약관 초안 법률 검토 (사용자)
- 1.0.0 사용자는 OTA를 못 받음 → 스토어에서 1.1.0 업데이트 필요
- W5 공유 링크는 웹에 배포됨. 실기기에서 링크 공유·받는 페이지·카톡 미리보기 확인은 남아 있다

## 5. 환경·명령

| 용도 | 명령 |
|---|---|
| 개발 서버 | `npm start` (Metro 8081, dev client) |
| iOS 시뮬레이터 빌드 | `npx expo run:ios` (`npm run ios`는 `--device`라 실기기용) |
| 검증 | `npm run verify` (타입·lint·서식) · `npx expo export --platform android` (번들 확인) |
| 웹 빌드 확인 | `npx expo export --platform web` |
| Edge Function 배포 | `supabase functions deploy <이름> --project-ref ansjpqdsujostrhukygy` |
| 마이그레이션 | `supabase db push --linked --dry-run` → 확인 후 `supabase db push --linked` |
| OTA (production) | `.env`를 export한 셸에서 `npx eas-cli update --channel production --platform android --environment production --message "..."` |

- 테스트 프레임워크 없음 (단위·E2E 없음)
- `eas` 명령은 `.env`를 읽지 않아 앱 설정 단계에서 카카오 플러그인이 실패한다 → `set -a && . ./.env && set +a` 후 실행. 번들 값은 EAS production 환경 변수(`--environment production`)를 쓴다(값은 `.env`와 같은 Supabase 프로젝트)
- `.env.example`(실제 값 포함)은 커밋하지 않는다
- 시뮬레이터 자동화 도구의 탭 입력이 불안정했음 — 화면 확인은 `xcrun simctl io <udid> screenshot`이 확실함

## 6. 기기별 차이 메모 (공유 일기 "나도 멍멍로그 시작하기")

코드: `src/pages/shared-diary/lib/startMeongmeonglog(.web).ts`

| 어디서 열었나 | 동작 | 이유 |
|---|---|---|
| Android 웹 | 앱이 있으면 앱 열기, 없으면 Play 스토어 | Android는 `intent://` 링크로 "앱이 있으면 열고 없으면 대체 주소"가 된다 (네이티브 빌드 불필요, 1.0.0도 앱 주소 `meongmeonglog://`가 있음) |
| iPhone 웹 | 웹 첫 화면(로그인). Safari면 홈 화면 추가 안내 | iOS 앱이 아직 없다. 웹은 앱·PWA 설치 여부를 알 수 없고, 앱 주소로 열기를 시도하면 앱이 없을 때 Safari 오류창이 뜬다 |
| PC 웹 | 웹 첫 화면(로그인) | 설치할 앱이 없다 |
| 앱 안 | 앱 첫 화면 | 이미 앱이다 |

iPhone PWA 한계:
- 홈 화면에 PWA를 추가해도 **링크는 PWA로 열리지 않는다** (iOS가 링크를 PWA에 넘기지 않음). 카카오톡 인앱 브라우저나 Safari에서 열린다
- PWA와 Safari는 로그인 정보를 따로 보관한다. PWA에서 로그인했어도 Safari에서는 다시 로그인해야 한다
- 홈 화면 추가는 Safari에서만 된다. 카카오톡 인앱 브라우저에서는 안내 배너도 뜨지 않는다
- "있으면 앱 열기"를 iPhone에서 하려면 iOS 네이티브 앱 + Universal Links가 필요하다

확인 안 된 것: Android에서 앱이 없을 때 Play 스토어로 가는지, 카카오톡 인앱 브라우저에서 `intent://`가 동작하는지.
