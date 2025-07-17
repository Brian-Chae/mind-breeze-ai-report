/**
 * URL 관련 유틸리티 함수들
 */

/**
 * 현재 환경에 맞는 BASE_URL을 반환합니다
 * 개발 환경에서는 localhost를, 배포 환경에서는 실제 도메인을 사용합니다
 */
export function getBaseUrl(): string {
  // 1. 환경변수에서 BASE_URL이 설정되어 있다면 우선 사용
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL;
  }

  // 2. 개발 환경 체크
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }

  // 3. 배포 환경에서는 현재 origin 사용
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 4. SSR 환경이나 기타 경우의 폴백
  return 'https://mind-breeze-ai-report-47942.web.app';
}

/**
 * 공유 링크 URL 생성
 */
export function createShareUrl(shareToken: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/shared-report/${shareToken}`;
}

/**
 * 측정 접근 링크 URL 생성
 */
export function createMeasurementAccessUrl(token: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/measurement-access?token=${token}`;
}

/**
 * 조직 참여 링크 URL 생성
 */
export function createOrganizationJoinUrl(): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/organization-join`;
} 