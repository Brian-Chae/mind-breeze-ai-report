/**
 * Cross-platform path utilities for handling file system paths
 * Handles Windows, macOS, and Linux path formats correctly
 */

/**
 * Detect the current operating system
 */
export function detectOS(): 'windows' | 'macos' | 'linux' | 'android' | 'unknown' {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (userAgent.includes('android')) {
    return 'android';
  } else if (userAgent.includes('win') || platform.includes('win')) {
    return 'windows';
  } else if (userAgent.includes('mac') || platform.includes('mac')) {
    return 'macos';
  } else if (userAgent.includes('linux') || platform.includes('linux')) {
    return 'linux';
  }
  
  return 'unknown';
}

/**
 * Get the appropriate path separator for the current OS
 */
export function getPathSeparator(): string {
  const os = detectOS();
  return os === 'windows' ? '\\' : '/';
}

/**
 * Join path segments using the appropriate separator for the current OS
 */
export function joinPath(...segments: string[]): string {
  if (segments.length === 0) return '';
  
  // Filter out empty segments and normalize each one
  const cleanSegments = segments
    .filter(segment => segment && segment.trim() !== '')
    .map(segment => normalizePath(segment.trim()));
  
  const separator = getPathSeparator();
  return cleanSegments.join(separator);
}

/**
 * Normalize a path to use the correct separators for the current OS
 */
export function normalizePath(path: string): string {
  if (!path) return '';
  
  const separator = getPathSeparator();
  const os = detectOS();
  
  if (os === 'windows') {
    // For Windows, convert all forward slashes to backslashes
    return path.replace(/\//g, '\\');
  } else {
    // For Unix-like systems, convert all backslashes to forward slashes
    return path.replace(/\\/g, '/');
  }
}

/**
 * Get platform-specific default paths for common directories
 */
export function getDefaultPaths() {
  const os = detectOS();
  const username = getCurrentUsername();
  
  switch (os) {
    case 'windows':
      return {
        documents: `C:\\Users\\${username}\\Documents`,
        downloads: `C:\\Users\\${username}\\Downloads`,
        desktop: `C:\\Users\\${username}\\Desktop`,
        appData: `C:\\Users\\${username}\\AppData\\Roaming`,
        linkBandDefault: `C:\\Users\\${username}\\Documents\\LINK SDK`
      };
    case 'macos':
      return {
        documents: `/Users/${username}/Documents`,
        downloads: `/Users/${username}/Downloads`,
        desktop: `/Users/${username}/Desktop`,
        appData: `/Users/${username}/Library/Application Support`,
        linkBandDefault: `/Users/${username}/Documents/LINK SDK`
      };
    case 'linux':
      return {
        documents: `/home/${username}/Documents`,
        downloads: `/home/${username}/Downloads`,
        desktop: `/home/${username}/Desktop`,
        appData: `/home/${username}/.config`,
        linkBandDefault: `/home/${username}/Documents/LINK SDK`
      };
    case 'android':
      return {
        documents: `/storage/emulated/0/Documents`,
        downloads: `/storage/emulated/0/Download`,
        desktop: `/storage/emulated/0/Desktop`,
        appData: `/storage/emulated/0/Android/data`,
        linkBandDefault: `/storage/emulated/0/Documents/LINK SDK`
      };
    default:
      return {
        documents: `${username}/Documents`,
        downloads: `${username}/Downloads`,
        desktop: `${username}/Desktop`,
        appData: `${username}/.config`,
        linkBandDefault: `${username}/Documents/LINK SDK`
      };
  }
}

/**
 * Get platform-specific recommended storage paths for user guidance
 */
export function getRecommendedStoragePaths(): string[] {
  const os = detectOS();
  
  switch (os) {
    case 'windows':
      return [
        'C:\\Users\\[사용자명]\\Documents\\LINK SDK',
        'C:\\Users\\[사용자명]\\Downloads\\LINK SDK',
        'C:\\Users\\[사용자명]\\Desktop\\LINK SDK',
        'D:\\LINK SDK' // 별도 드라이브
      ];
    case 'macos':
      return [
        '/Users/[사용자명]/Documents/LINK SDK',
        '/Users/[사용자명]/Downloads/LINK SDK',
        '/Users/[사용자명]/Desktop/LINK SDK',
        '/Volumes/ExternalDrive/LINK SDK' // 외장 드라이브
      ];
    case 'linux':
      return [
        '/home/[사용자명]/Documents/LINK SDK',
        '/home/[사용자명]/Downloads/LINK SDK',
        '/home/[사용자명]/Desktop/LINK SDK',
        '/media/[사용자명]/storage/LINK SDK' // 외장 저장소
      ];
    case 'android':
      return [
        '/storage/emulated/0/Documents/LINK SDK',
        '/storage/emulated/0/Download/LINK SDK',
        '/sdcard/Documents/LINK SDK',
        '/sdcard/Download/LINK SDK'
      ];
    default:
      return [
        '[사용자 폴더]/Documents/LINK SDK',
        '[사용자 폴더]/Downloads/LINK SDK'
      ];
  }
}

/**
 * Try to detect the current username from various sources
 */
export function getCurrentUsername(): string {
  try {
    // Try to get username from browser environment variables or other sources
    const os = detectOS();
    
    // For different operating systems, provide appropriate placeholders
    switch (os) {
      case 'windows':
        // Windows username placeholder
        return '[사용자명]';
      case 'macos':
        // macOS username placeholder
        return '[사용자명]';
      case 'linux':
        // Linux username placeholder
        return '[사용자명]';
      case 'android':
        // Android doesn't use traditional usernames
        return 'android';
      default:
        return '[사용자명]';
    }
  } catch (error) {
    console.warn('Could not detect username:', error);
  }
  
  return 'user'; // Fallback
}

/**
 * Generate a smart default path suggestion based on directory name and OS
 */
export function generateSmartPath(directoryName: string, baseDir: 'documents' | 'downloads' | 'desktop' = 'downloads'): string {
  const defaultPaths = getDefaultPaths();
  const basePath = defaultPaths[baseDir];
  
  return joinPath(basePath, directoryName);
}

/**
 * Validate if a path looks like a valid absolute path for the current OS
 */
export function isValidAbsolutePath(path: string): boolean {
  const os = detectOS();
  
  switch (os) {
    case 'windows':
      // Windows: C:\path\to\folder or \\server\share\path
      return /^[A-Za-z]:\\/.test(path) || /^\\\\/.test(path);
    case 'macos':
    case 'linux':
      // Unix-like: /path/to/folder
      return path.startsWith('/');
    default:
      // Generic check
      return path.includes('/') || path.includes('\\');
  }
}

/**
 * Convert a path to display format (for UI showing)
 */
export function formatPathForDisplay(path: string): string {
  return normalizePath(path);
}

/**
 * Convert a path to system format (for copying to clipboard)
 */
export function formatPathForSystem(path: string): string {
  if (!path) return '';
  
  const normalized = normalizePath(path);
  
  // Additional cleanup for Windows paths
  const os = detectOS();
  if (os === 'windows') {
    // Ensure Windows paths use backslashes consistently
    return normalized.replace(/\//g, '\\');
  }
  
  return normalized;
}

/**
 * Get localized OS name for display
 */
export function getOSDisplayName(): string {
  const os = detectOS();
  
  switch (os) {
    case 'windows':
      return 'Windows';
    case 'macos':
      return 'macOS';
    case 'linux':
      return 'Linux';
    case 'android':
      return 'Android';
    default:
      return '알 수 없음';
  }
} 