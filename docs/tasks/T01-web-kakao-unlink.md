# T01. 탈퇴 시 서버에서 카카오 연동 해제

## 목표

지금은 앱(카카오 SDK)에서만 탈퇴 시 카카오 연결을 끊는다. 웹에서 탈퇴하거나, 웹으로 로그인한 계정을 앱에서 탈퇴하면 카카오 연결이 남는다.
탈퇴 Edge Function(`delete-account`)이 **서버에서** 카카오 연결을 끊게 해 모든 경우를 처리한다.

## 배경

- 카카오 회원번호는 Supabase Auth 이메일에 들어 있다: `kakao-<회원번호>@meongmeonglog.dev` (`supabase/functions/_shared/socialAuth.ts`의 `toAuthEmail`)
- 카카오 "연결 끊기" REST API는 **Admin 키**로 회원번호를 지정해 호출할 수 있다
  - `POST https://kapi.kakao.com/v1/user/unlink`
  - 헤더 `Authorization: KakaoAK ${KAKAO_ADMIN_KEY}`, `Content-Type: application/x-www-form-urlencoded`
  - 본문 `target_id_type=user_id&target_id=<회원번호>`
  - 구현 전에 카카오 공식 문서(developers.kakao.com, 카카오 로그인 > REST API > 연결 끊기)에서 형식을 다시 확인한다
- 네이버는 연동 해제를 하지 않기로 결정됨 (계정 삭제 안내 페이지에 해제 방법 안내). 이번 작업 범위 아님

## 바꿀 파일

1. `supabase/functions/delete-account/index.ts`
   - 사용자 삭제 **전에** Auth 사용자 이메일을 조회한다 (`supabaseAdmin.auth.admin.getUserById(userId)`)
   - 이메일이 `kakao-<숫자>@meongmeonglog.dev` 형식이면 회원번호를 꺼내 연결 끊기를 호출한다
   - 연결 끊기 실패(이미 끊김, 키 없음, 네트워크 오류)는 **탈퇴를 막지 않는다**: `console.error`만 남기고 계속 진행
   - 키(`KAKAO_ADMIN_KEY`)가 없으면 호출을 건너뛴다
   - 외부 호출은 `externalApiSignal()`(`_shared/http.ts`)로 시간 제한을 건다
   - 회원번호 추출 함수는 `_shared/socialAuth.ts` 옆에 두거나 같은 파일에서 export한다 (이메일 형식을 한 곳에서 관리)
2. `src/features/auth/api/authApi.ts`의 `deleteAccount`
   - 서버가 카카오 연결을 끊으므로 앱의 `unlinkKakaoAccount()` 호출은 **그대로 둔다** (서버 배포 전 구버전 서버 대비, 이미 끊긴 경우 SDK가 실패해도 무시됨)
   - 바꿀 것 없음. 주석만 "서버도 연결을 끊는다"로 갱신
3. `docs/account-deletion.md`는 바꾸지 않는다 (네이버 안내 그대로)

## 완료 조건

- [x] `delete-account`가 카카오 계정이면 연결 끊기를 시도하고, 실패해도 탈퇴가 끝난다
- [x] 네이버 계정은 아무 호출도 하지 않는다
- [x] `npx tsc --noEmit`, `npm run lint` 통과 (Edge Function은 Deno라 tsc 대상이 아님 → 문법 오류가 없게 주의, 가능하면 `deno check`)
- [x] 커밋 메시지에 키 값이나 보안 설명을 쓰지 않는다

## 하지 말 것

- Admin 키 값을 코드·문서·커밋에 쓰지 않는다
- 배포하지 않는다

## 배포 (사용자가 실행)

1. 카카오 개발자 콘솔에서 Admin 키를 확인해 Supabase secret으로 등록 (값이 화면·기록에 남지 않게):
   `supabase secrets set KAKAO_ADMIN_KEY=<값> --project-ref ansjpqdsujostrhukygy`
2. `supabase functions deploy delete-account --project-ref ansjpqdsujostrhukygy`
3. 테스트 계정으로 웹에서 카카오 로그인 → 탈퇴 → 카카오 계정 설정의 "연결된 서비스"에서 멍멍로그가 사라졌는지 확인

## 구현 결과 (Cursor가 작성)

- 커밋: `a9049f4` fix: 탈퇴할 때 서버에서 카카오 연결을 끊는다
- 지시서와 달라진 점: 없음. 연결 끊기 `Content-Type`은 공식 문서의 `application/x-www-form-urlencoded;charset=utf-8`을 사용
- 확인하지 못한 것: 이 환경에 Deno가 없어 `deno check`는 실행하지 못함. 배포와 테스트 계정 탈퇴 확인은 하지 않음

## 검토 (Claude, 2026-11-19)

결과: **통과.** 수정 지시 없음. 지시서와 다른 점 없음 (`Content-Type`의 charset은 카카오 문서 형식이라 지시서 범위 안).

- 카카오 회원번호는 Auth 이메일 형식을 만드는 `socialAuth.ts` 옆에서 꺼내서, 형식이 한 곳에서 관리된다. 숫자가 아니거나 다른 형식(네이버)이면 호출하지 않는다
- 키가 없거나, 조회·호출이 실패해도 로그만 남기고 탈퇴를 계속한다. 시간 제한(`externalApiSignal`) 있음
- `socialAuth.ts`를 import해도 서버를 띄우는 코드(`serveJson`)는 함수 안에서만 실행되므로 부작용 없다
- 예전 실제 이메일로 가입한 계정은 로그인할 때 이메일이 옮겨지므로, 탈퇴(로그인 후에만 가능) 시점에는 항상 새 형식이다
- 참고(선택): 연결 끊기 뒤 계정 삭제가 실패하면 "연결만 끊기고 계정은 남는" 상태가 된다. 다시 로그인하면 연결이 새로 생기고 탈퇴를 다시 할 수 있어 큰 문제는 아니다. 고친다면 이메일만 먼저 읽고, 연결 끊기는 계정 삭제가 성공한 뒤에 한다
- 남은 확인 (배포 후): Admin 키 등록 → `delete-account` 배포 → 테스트 계정으로 웹 카카오 로그인 후 탈퇴 → 카카오 계정의 연결된 서비스에서 사라졌는지
