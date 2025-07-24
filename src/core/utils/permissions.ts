import { Permission, UserType, DEFAULT_PERMISSIONS_BY_USER_TYPE, User } from '@core/types/unified';

/**
 * 권한 관리 유틸리티 클래스
 * 통합 권한 시스템을 위한 핵심 권한 검사 로직
 */
export class PermissionUtils {
  
  /**
   * 사용자가 특정 권한을 가지고 있는지 확인
   */
  static hasPermission(user: User | null, permission: Permission): boolean {
    if (!user) return false;
    
    // 시스템 관리자는 모든 권한 보유
    if (user.userType === 'SYSTEM_ADMIN') return true;
    
    // 사용자의 권한 목록 확인
    const userPermissions = this.getUserPermissions(user);
    
    // 직접 권한 확인
    if (userPermissions.includes(permission)) return true;
    
    // 도메인 전체 권한 확인 (예: organization:all)
    const domainPermission = this.getDomainAllPermission(permission);
    if (domainPermission && userPermissions.includes(domainPermission)) return true;
    
    return false;
  }
  
  /**
   * 사용자가 권한 목록 중 하나라도 가지고 있는지 확인
   */
  static hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }
  
  /**
   * 사용자가 권한 목록을 모두 가지고 있는지 확인
   */
  static hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }
  
  /**
   * 리소스와 액션에 대한 접근 권한 확인
   */
  static canAccess(user: User | null, resource: string, action: string): boolean {
    if (!user) return false;
    
    // 시스템 관리자는 모든 접근 허용
    if (user.userType === 'SYSTEM_ADMIN') return true;
    
    // 권한 문자열 생성 (resource:action)
    const permission = `${resource}:${action}` as Permission;
    
    return this.hasPermission(user, permission);
  }
  
  /**
   * 사용자의 모든 권한 목록 반환
   */
  static getUserPermissions(user: User): Permission[] {
    // 사용자 객체의 permissions 필드 확인 (JSON string array)
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.map(p => p as Permission);
    }
    
    // 기본 권한 반환
    return DEFAULT_PERMISSIONS_BY_USER_TYPE[user.userType] || [];
  }
  
  /**
   * 사용자 유형에 따른 기본 권한 반환
   */
  static getDefaultPermissions(userType: UserType): Permission[] {
    return DEFAULT_PERMISSIONS_BY_USER_TYPE[userType] || [];
  }
  
  /**
   * 권한에서 도메인 전체 권한 추출
   * 예: "organization:read" → "organization:all"
   */
  private static getDomainAllPermission(permission: Permission): Permission | null {
    const parts = permission.split(':');
    if (parts.length >= 2) {
      const domain = parts[0];
      const allPermission = `${domain}:all` as Permission;
      
      // 유효한 도메인 전체 권한인지 확인
      if (Object.values(Permission).includes(allPermission)) {
        return allPermission;
      }
    }
    return null;
  }
  
  /**
   * 권한 문자열의 유효성 검증
   */
  static isValidPermission(permission: string): permission is Permission {
    return Object.values(Permission).includes(permission as Permission);
  }
  
  /**
   * 권한 목록을 도메인별로 그룹화
   */
  static groupPermissionsByDomain(permissions: Permission[]): Record<string, Permission[]> {
    return permissions.reduce((groups, permission) => {
      const domain = permission.split(':')[0];
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(permission);
      return groups;
    }, {} as Record<string, Permission[]>);
  }
  
  /**
   * 사용자가 다른 사용자보다 높은 권한을 가지고 있는지 확인
   */
  static hasHigherPermissions(user1: User, user2: User): boolean {
    const hierarchy: UserType[] = [
      'SYSTEM_ADMIN',
      'ORGANIZATION_ADMIN',
      'ORGANIZATION_MEMBER',
      'INDIVIDUAL_USER',
      'MEASUREMENT_SUBJECT'
    ];
    
    const user1Level = hierarchy.indexOf(user1.userType);
    const user2Level = hierarchy.indexOf(user2.userType);
    
    return user1Level < user2Level; // 낮은 인덱스가 더 높은 권한
  }
  
  /**
   * 권한 상속 관계 확인
   * 상위 권한이 하위 권한을 포함하는지 확인
   */
  static inheritsPermission(parentPermission: Permission, childPermission: Permission): boolean {
    // 시스템 전체 권한은 모든 권한을 포함
    if (parentPermission === Permission.SYSTEM_ALL) return true;
    
    // 같은 권한
    if (parentPermission === childPermission) return true;
    
    // 도메인 전체 권한 확인
    const childDomain = childPermission.split(':')[0];
    const parentDomainAll = `${childDomain}:all` as Permission;
    
    return parentPermission === parentDomainAll;
  }
  
  /**
   * 권한 충돌 검사
   * 사용자에게 부여된 권한이 서로 충돌하는지 확인
   */
  static checkPermissionConflicts(permissions: Permission[]): string[] {
    const conflicts: string[] = [];
    
    // 예시: SYSTEM_ALL과 다른 권한의 충돌
    if (permissions.includes(Permission.SYSTEM_ALL) && permissions.length > 1) {
      conflicts.push('SYSTEM_ALL 권한이 있으면 다른 권한은 필요 없습니다.');
    }
    
    return conflicts;
  }
}

/**
 * React Hook에서 사용할 권한 검사 유틸리티
 */
export const createPermissionChecker = (user: User | null) => ({
  hasPermission: (permission: Permission) => PermissionUtils.hasPermission(user, permission),
  hasAnyPermission: (permissions: Permission[]) => PermissionUtils.hasAnyPermission(user, permissions),
  hasAllPermissions: (permissions: Permission[]) => PermissionUtils.hasAllPermissions(user, permissions),
  canAccess: (resource: string, action: string) => PermissionUtils.canAccess(user, resource, action),
  getUserPermissions: () => user ? PermissionUtils.getUserPermissions(user) : [],
  isSystemAdmin: () => user?.userType === 'SYSTEM_ADMIN',
  isOrganizationAdmin: () => user?.userType === 'ORGANIZATION_ADMIN',
  isMember: () => user?.userType === 'ORGANIZATION_MEMBER',
  isIndividualUser: () => user?.userType === 'INDIVIDUAL_USER',
  isMeasurementSubject: () => user?.userType === 'MEASUREMENT_SUBJECT'
});

/**
 * 권한 검사를 위한 타입 가드 함수들
 */
export const isSystemAdmin = (user: User | null): boolean => {
  return user?.userType === 'SYSTEM_ADMIN';
};

export const isOrganizationAdmin = (user: User | null): boolean => {
  return user?.userType === 'ORGANIZATION_ADMIN';
};

export const isOrganizationMember = (user: User | null): boolean => {
  return user?.userType === 'ORGANIZATION_MEMBER';
};

export const isIndividualUser = (user: User | null): boolean => {
  return user?.userType === 'INDIVIDUAL_USER';
};

export const isMeasurementSubject = (user: User | null): boolean => {
  return user?.userType === 'MEASUREMENT_SUBJECT';
};

/**
 * 권한 기반 접근 제어를 위한 데코레이터 함수
 */
export const requirePermission = (permission: Permission) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(this: any, user: User, ...args: any[]) {
      if (!PermissionUtils.hasPermission(user, permission)) {
        throw new Error(`권한이 없습니다: ${permission}`);
      }
      return originalMethod.apply(this, [user, ...args]);
    };
    
    return descriptor;
  };
};

/**
 * 권한 검사 결과 캐싱을 위한 유틸리티
 */
export class PermissionCache {
  private static cache = new Map<string, { result: boolean; timestamp: number }>();
  private static TTL = 5 * 60 * 1000; // 5분
  
  static getCacheKey(userId: string, permission: Permission): string {
    return `${userId}:${permission}`;
  }
  
  static get(userId: string, permission: Permission): boolean | null {
    const key = this.getCacheKey(userId, permission);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.result;
    }
    
    this.cache.delete(key);
    return null;
  }
  
  static set(userId: string, permission: Permission, result: boolean): void {
    const key = this.getCacheKey(userId, permission);
    this.cache.set(key, { result, timestamp: Date.now() });
  }
  
  static clear(userId?: string): void {
    if (userId) {
      // 특정 사용자의 캐시만 삭제
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.startsWith(`${userId}:`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      // 전체 캐시 삭제
      this.cache.clear();
    }
  }
}