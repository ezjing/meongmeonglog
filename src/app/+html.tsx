import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { colors } from '@/shared/config/theme';

/**
 * 웹 루트 HTML (web.output: server). 서버가 렌더링하는 모든 페이지에 들어간다.
 * PWA(홈 화면에 추가) 설정: manifest, iOS 홈 화면 아이콘·전체 화면 실행.
 * 브라우저 전역 객체(window, document)는 쓰지 않는다.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>멍멍로그</title>
        <meta name="theme-color" content={colors.bg} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="멍멍로그" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
