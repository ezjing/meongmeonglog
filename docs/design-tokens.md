# 멍멍로그 디자인 토큰

코드: `src/shared/config/tokens/` · 화면 코드 입구: `@/shared/config/theme`

토큰은 3단계로 구성됩니다. 아래 단계는 위 단계만 참조합니다.

```
1단계 팔레트 (Primitive)   실제 색 값. 의미 없음            예) apricot500, ink900
  ↓
2단계 의미 (Semantic)      용도에 따른 이름. 화면은 여기만 사용  예) primary, fgMuted, border
  ↓
3단계 컴포넌트 (Component)  특정 컴포넌트 전용 이름 — 현재 없음   예) buttonPrimaryBg
```

| 파일 | 내용 |
|---|---|
| `tokens/palette.json` | 1단계 색 원본 (app.config.ts에서도 읽어서 JSON) |
| `tokens/primitive.ts` | 1단계: 브랜드 선택 블록(`brand`, `neutral`), 모서리 단계(`radiusScale`) |
| `tokens/semantic.ts` | 2단계: 색(Light/Dark), 모서리, 그림자, 고정 크기 |
| `tokens/component.ts` | 3단계: 현재 비어 있음. 추가 규칙은 파일 주석 참고 |
| `theme.ts` | 화면 코드 입구. 2단계 토큰 + 간격·글자 크기 등 기본 스케일 |

## 사용 규칙

- 화면 코드는 `import { colors, radius, shadows, sizes, spacing, … } from '@/shared/config/theme'`만 쓴다.
- `@/shared/config/tokens/*`(팔레트 포함)를 직접 import하면 **lint 에러**가 난다.
- 색 값(`#FF8A5B`, `rgba(...)`)을 화면 코드에 직접 쓰지 않는다. 필요한 용도가 없으면 2단계에 토큰을 추가한다.
- 토큰은 **값이 아니라 용도로 고른다.** 같은 흰색이어도 카드 배경은 `surface`, 주황 버튼 위 글자는 `fgOnPrimary`다.

## 1단계 — 팔레트

| 이름 | 값 | 비고 |
|---|---|---|
| `apricot100` / `300` / `500` / `600` | #FFE9DC / #E8B4A0 / #FF8A5B / #E96F3E | 브랜드 |
| `cream200` / `cream300` | #F3E8D5 / #E3D9C4 | 밝은 중립 |
| `ink400` / `ink600` / `ink900` | #8A8A93 / #5B5B66 / #2B2B3D | 어두운 중립 |
| `ink900Alpha46` / `ink900Alpha72` | ink900 46% / 72% | |
| `blackAlpha35` / `blackAlpha85` / `whiteAlpha50` | | |
| `moss500` / `red500` | #6B8F71 / #D9534F | 상태 |
| `white` / `black` | | |
| `kakaoYellow` / `naverGreen` / `instagramPink` | #FEE500 / #03C75A / #E1306C | 외부 서비스 |

**브랜드 블록**(`primitive.ts`의 `brand`, `neutral`)만 바꾸면 2단계 토큰을 거쳐 앱 전체 색이 바뀐다.

## 2단계 — 의미

### 색

| 그룹 | 토큰 | 1단계 | 용도 |
|---|---|---|---|
| 배경·면 | `bg` | neutral 200 | 화면 배경 |
| | `surface` | white | 카드, 입력창, 시트, 다이얼로그, 탭바 |
| | `surfaceMuted` | neutral 200 | 흰 면 안에서 한 톤 들어간 영역 |
| | `surfaceInverse` | neutral 900 | 기본 토스트, 선택된 칩·버튼, 카메라 배지 |
| | `surfacePlaceholder` | brand 300 | 사진·아바타가 없을 때 자리 |
| | `overlay` / `overlayStrong` | ink900 46% / 72% | 다이얼로그 뒤 배경 / 사진 위 작은 버튼 |
| | `scrim` / `scrimStrong` | black 35% / 85% | 사진 위 태그 / 사진 크게 보기 배경 |
| 글자 | `fg` | neutral 900 | 기본 글자 |
| | `fgSecondary` | neutral 600 | 보조 글자, 라벨 |
| | `fgMuted` | neutral 400 | 흐린 글자, 비활성 탭 |
| | `fgSubtle` | neutral 400 | 입력창 placeholder |
| | `fgOnPrimary` | white | 주황·초록·빨강 면 위 글자 |
| | `fgInverse` | white | 진한 면·사진 위 글자 |
| | `fgOnMedia` / `fgOnMediaMuted` | white / white 50% | 사진 위 캐러셀 점 |
| 테두리 | `border` | neutral 300 | 기본 테두리·구분선 |
| | `borderStrong` | neutral 900 | 외곽선 버튼, 선택된 칩·버튼 테두리 |
| 브랜드 | `primary` | brand 500 | 주 버튼·강조 면, 지도 경로 |
| | `primaryFg` | brand 600 | 주황 글자·아이콘·강조 테두리 |
| | `primarySubtle` | brand 100 | 오늘의 한마디 등 연한 주황 면 |
| 상태 | `success` | moss500 | 성공 토스트 |
| | `warning` | brand 600 | 사용법 안내·입력값 확인 토스트 (흰 굵은 글자 대비를 위해 한 톤 진한 주황) |
| | `danger` | red500 | 요청 실패 토스트, 위험 행동 버튼 |
| 외부 서비스 | `kakao` `kakaoFg` `kakaoSymbol` `naver` `naverFg` `instagram` | | 각 서비스 가이드 색 고정 |
| 그림자 | `shadow` / `shadowStrong` | neutral 900 / black | 그림자 색 |

**다크 모드:** 앱이 `userInterfaceStyle: "light"`로 고정돼 있어 `darkColors`는 비어 있다. 지원할 때 Light와 다른 값만 채우고, `useColorScheme`으로 `lightColors`와 합쳐 쓴다.

### 모서리 (`radius`)

| 토큰 | 값 | 용도 |
|---|---|---|
| `controlSm` | 8 | 아이콘 칸, 캘린더 날짜 칸, 사진 썸네일 |
| `control` | 12 | 입력창, 선택 버튼, 소셜 로그인 버튼, 시트 안 버튼 |
| `controlLg` | 16 | 기본 버튼, 다이얼로그 버튼 |
| `cardSm` | 12 | 작은 안내 박스(오늘의 한마디 등), 일기 썸네일 |
| `card` | 16 | 카드, 토스트, 사진 미리보기 |
| `cardLg` | 20 | 강조 카드: 공유 카드, 환영 말풍선, 로그인 로고 |
| `modal` | 20 | 다이얼로그, 바텀시트, 로딩 카드 |
| `full` | 999 | 원형·알약 |

### 그림자 (`shadows`)

| 토큰 | 용도 |
|---|---|
| `control` | 지도 위 작은 버튼 |
| `card` | 카드 |
| `raised` | 강조 카드(공유 카드, 환영 말풍선) |
| `modal` | 로딩 카드, 다이얼로그, 토스트 |
| `sheet` / `drawer` | 바텀시트 / 드로어 |
| `cta` | 산책 시작 원형 버튼 (주황 그림자) |

### 고정 크기 (`sizes`)

| 토큰 | 값 | 용도 |
|---|---|---|
| `iconButton` | 36 | 원형 아이콘 버튼 (앱바, 지도 위치 버튼) |

## 기본 스케일 (`theme.ts`)

`spacing`, `fontSize`, `fontWeight`, `lineHeight`, `iconSize`, `emojiSize`, `borderWidth`, `opacity`, `scale`, `zIndex`, `hitSlop`은 의미 없이 단계만 있는 값이다. Tailwind 기본 스케일처럼 화면에서 직접 쓴다.

## 3단계 — 컴포넌트

`tokens/component.ts`. 같은 2단계 토큰을 쓰던 컴포넌트 중 하나만 다른 값이 필요해지면 여기에 추가한다(파일 주석의 규칙 참고).

### 버튼 (`buttonTokens`)

| variant | 배경 | 글자 | 테두리 |
|---|---|---|---|
| `primary` | `primary` | `fgOnPrimary` | — |
| `secondary` | `surface` | `fg` | `border` |
| `danger` | `surface` | `danger` | `danger` |
| `dangerFilled` | `danger` | `fgOnPrimary` | — |
| `text` | 없음 | `fgMuted` (밑줄) | — |
| `kakao` / `naver` / `instagram` | 서비스 색 | 서비스 글자색 | — |

## 버튼 역할

버튼은 **모양이 아니라 역할로** 고른다. `@/shared/ui/Button`의 `variant`로 지정한다.

| 역할 | variant | 규칙 | 예 |
|---|---|---|---|
| 주요 행동 | `primary` | **화면당 1개.** 그 화면의 목적인 행동 | 다음, 저장, 산책 종료, AI 일기 만들기, 다시 시도 |
| 보조 행동 | `secondary` | 주요 행동 옆의 대안·이동 | 이전, 저장만 하기, 정보 수정, 위치 권한 확인, 로그아웃 |
| 위험 행동 | `danger` | 되돌릴 수 없는 행동. **반드시 확인 다이얼로그를 거친다** | 회원 탈퇴, 산책 취소 |
| 위험 행동 확인 | `dangerFilled` | 위험 행동 확인 다이얼로그의 확인 버튼 (AlertDialog `destructive`) | 탈퇴하기, 취소하기 |
| 텍스트 버튼 | `text` | 눈에 덜 띄어야 하는 이탈·부가 행동 | 그만두고 홈으로, 다른 계정으로 로그인 |
| 외부 서비스 | `kakao` `naver` `instagram` | 각 서비스 가이드 색 고정 | 소셜 로그인, 공유 |

- 크기: `size="lg"`(화면, 기본) · `size="md"`(다이얼로그)
- 처리 중에는 `disabled` 대신 `loading`을 쓴다 (스피너 표시 + 다시 누르기 방지)

## 토스트 종류

`showToast({ message, variant })`의 `variant`는 필수다.

| variant | 색 | 쓰는 경우 |
|---|---|---|
| `success` | `success` (초록) | 저장·완료 |
| `warning` | `warning` (주황) | 사용법 안내, 입력값 확인, 권한 필요, 준비 중 |
| `error` | `danger` (빨강) | 요청 실패 (서버·네트워크 오류) |

## 토큰 추가·변경 체크리스트

- [ ] 용도에 맞는 2단계 토큰이 이미 있는지 먼저 찾았다
- [ ] 새 2단계 토큰은 1단계 값만 참조한다
- [ ] 이 문서의 표에 이름·용도를 추가했다
