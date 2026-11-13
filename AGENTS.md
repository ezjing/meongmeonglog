# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# 구조 규칙 (Feature-Sliced Design) — 반드시 준수

코드를 추가·이동·수정할 때는 **[docs/architecture.md](docs/architecture.md)의 규칙을 따른다.** 핵심 요약:

- 레이어: `app`(Expo Router 라우트) → `pages` → `features` → `entities` → `shared`. 위 레이어만 아래를 import한다.
- 같은 레이어의 다른 slice는 import하지 않는다. 조합은 상위 레이어에서, 공통 로직은 아래 레이어로 내린다.
- entities끼리는 `entities/<대상>/@x/<사용하는 쪽>.ts` 공개 API로만 참조한다.
- 다른 slice는 `index.ts`(이름을 명시한 re-export)로만 import하고, slice 내부는 상대 경로를 쓴다.
- 색·모서리·그림자는 [docs/design-tokens.md](docs/design-tokens.md)의 의미 토큰(`@/shared/config/theme`)만 용도에 맞게 쓴다. 색 값·팔레트 직접 사용 금지.
- 라우트 파일은 `export { XScreen as default } from '@/pages/x';` 한 줄만 둔다.
- 작업 후 `npx tsc --noEmit`과 `npm run lint`가 통과해야 한다. lint가 FSD 규칙 위반을 에러로 잡는다. 규칙을 우회하려고 lint를 끄거나 예외를 추가하지 않는다.
