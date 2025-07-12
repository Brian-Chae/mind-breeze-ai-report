/**
 * 시간대 설정에 따른 시간 포맷팅 유틸리티
 */

export type TimezoneType = 'system' | 'korea' | 'utc';

/**
 * 시간대 설정에 따라 세션 시작 시간을 생성
 * JavaScript Date는 내부적으로 UTC를 사용하므로 
 * 시간대 정보는 포맷팅 시에만 적용됩니다.
 */
export function createSessionStartTime(timezone: TimezoneType = 'system'): Date {
  // 모든 시간대에서 동일한 Date 객체를 반환
  // 시간대 차이는 포맷팅할 때 적용됩니다
  return new Date();
}

/**
 * 시간대 설정에 따라 Date 객체를 포맷팅
 */
export function formatDateByTimezone(
  date: Date | string | number,
  timezone: TimezoneType = 'system',
  options: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    includeDate?: boolean;
    includeTime?: boolean;
  } = {}
): string {
  const {
    dateStyle = 'short',
    timeStyle = 'medium',
    includeDate = true,
    includeTime = true
  } = options;

  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  let formatOptions: Intl.DateTimeFormatOptions = {};
  
  if (includeDate) {
    formatOptions.dateStyle = dateStyle;
  }
  
  if (includeTime) {
    formatOptions.timeStyle = timeStyle;
  }

  switch (timezone) {
    case 'korea':
      return dateObj.toLocaleString('ko-KR', {
        ...formatOptions,
        timeZone: 'Asia/Seoul'
      });
    
    case 'utc':
      return dateObj.toLocaleString('en-US', {
        ...formatOptions,
        timeZone: 'UTC'
      }) + ' UTC';
    
    case 'system':
    default:
      return dateObj.toLocaleString(undefined, formatOptions);
  }
}

/**
 * 현재 시간을 시간대 설정에 따라 포맷팅
 */
export function getCurrentTimeByTimezone(timezone: TimezoneType = 'system'): string {
  return formatDateByTimezone(new Date(), timezone);
}

/**
 * 시간대 설정에 따라 날짜만 포맷팅
 */
export function formatDateOnlyByTimezone(
  date: Date | string | number,
  timezone: TimezoneType = 'system'
): string {
  return formatDateByTimezone(date, timezone, {
    includeDate: true,
    includeTime: false,
    dateStyle: 'short'
  });
}

/**
 * 시간대 설정에 따라 시간만 포맷팅
 */
export function formatTimeOnlyByTimezone(
  date: Date | string | number,
  timezone: TimezoneType = 'system'
): string {
  return formatDateByTimezone(date, timezone, {
    includeDate: false,
    includeTime: true,
    timeStyle: 'medium'
  });
}



/**
 * 세션 지속시간 포맷팅 (시간대와 무관)
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0초';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${remainingSeconds}초`;
  } else if (minutes > 0) {
    return `${minutes}분 ${remainingSeconds}초`;
  } else {
    return `${remainingSeconds}초`;
  }
}

/**
 * 시간대 이름 가져오기
 */
export function getTimezoneDisplayName(timezone: TimezoneType): string {
  switch (timezone) {
    case 'korea':
      return '한국 시간 (KST)';
    case 'utc':
      return '국제 표준시 (UTC)';
    case 'system':
    default:
      return '시스템 시간대';
  }
} 