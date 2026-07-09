import { Path, Svg } from 'react-native-svg';

interface IconProps {
  size?: number;
}

/** 카카오 로그인 심볼 — 말풍선 실루엣, #000000 */
export function KakaoIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3C6.477 3 2 6.617 2 11.07c0 2.668 1.462 5.026 3.71 6.492l-.914 4.002 4.198-2.49C9.91 19.33 10.945 19.46 12 19.46c5.523 0 10-3.617 10-8.39C22 6.617 17.523 3 12 3z"
        fill="#000000"
      />
    </Svg>
  );
}

/** 네이버 N 마크 — 흰색 */
export function NaverIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
