export const personalityOptions = [
  '활발함',
  '소심함',
  '먹보',
  '장난꾸러기',
  '츤데레',
  '애교쟁이',
  '기타',
] as const;

export const speechStyleOptions = ['기본', '아기말투', '반말', '존댓말', '기타'] as const;

export type PersonalityOption = (typeof personalityOptions)[number];
export type SpeechStyleOption = (typeof speechStyleOptions)[number];

export const dogBreeds = [
  '포메라니안',
  '말티즈',
  '푸들',
  '치와와',
  '시바견',
  '골든 리트리버',
  '비글',
  '믹스견',
  '기타',
] as const;
