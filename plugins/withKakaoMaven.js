const { withProjectBuildGradle } = require('expo/config-plugins');

const KAKAO_MAVEN = "maven { url 'https://devrepo.kakao.com/nexus/content/groups/public/' }";

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withKakaoMaven = (config) =>
  withProjectBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.contents.includes('devrepo.kakao.com')) {
      return gradleConfig;
    }

    gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
      /allprojects\s*\{\s*repositories\s*\{/,
      `allprojects {
  repositories {
    ${KAKAO_MAVEN}`,
    );

    return gradleConfig;
  });

module.exports = withKakaoMaven;
