import { router } from 'expo-router';

/** 딥링크로 바로 진입해 돌아갈 화면이 없으면 홈으로 보낸다 */
export function goBackOrHome() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.dismissTo('/(tabs)');
  }
}

/** 보호자 정보 수정 화면 (온보딩 화면을 수정 모드로 재사용) */
export function openGuardianEdit() {
  router.push({ pathname: '/(onboarding)/guardianBasic', params: { mode: 'edit' } });
}

/** 강아지 정보 수정 화면. 선택된 강아지를 연다 */
export function openDogEdit(dogId: string) {
  router.push({ pathname: '/(onboarding)/dogBasic', params: { mode: 'edit', dogId } });
}

/** 강아지 추가. 등록 화면이 온보딩 입력값을 비운다 */
export function openDogCreate() {
  router.push({ pathname: '/(onboarding)/dogBasic', params: { mode: 'create' } });
}

export function openFamilyManage() {
  router.push('/family');
}
