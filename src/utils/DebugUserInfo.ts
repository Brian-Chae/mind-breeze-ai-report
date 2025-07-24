import { auth } from '@core/services/firebase';
import { FirebaseService } from '@core/services/FirebaseService';
import { UserType } from '@core/types/unified';

/**
 * 디버깅용 사용자 정보 확인 및 업데이트 유틸리티
 */
export class DebugUserInfo {
  
  /**
   * 현재 로그인된 사용자 정보 확인
   */
  static async getCurrentUserInfo() {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        if (import.meta.env.DEV) {
        }
        return null;
      }

      if (import.meta.env.DEV) {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          emailVerified: currentUser.emailVerified
      }

      // Firestore에서 사용자 프로필 확인
      try {
        const userProfile = await FirebaseService.getUserProfile(currentUser.uid);
        if (import.meta.env.DEV) {
        }
        
        return {
          auth: currentUser,
          profile: userProfile
        };
      } catch (error) {
        if (import.meta.env.DEV) {
        }
        return {
          auth: currentUser,
          profile: null
        };
      }

    } catch (error) {
      if (import.meta.env.DEV) {
      }
      return null;
    }
  }

  /**
   * 현재 사용자를 시스템 관리자로 강제 업데이트
   */
  static async forceUpdateToSystemAdmin() {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        if (import.meta.env.DEV) {
        }
        return false;
      }

      if (import.meta.env.DEV) {
          uid: currentUser.uid,
          email: currentUser.email
      }

      await FirebaseService.updateUserProfile(currentUser.uid, {
        userType: UserType.SYSTEM_ADMIN,
        displayName: 'System Administrator',
        email: currentUser.email,
        permissions: JSON.stringify([
          'system:all',
          'organization:all',
          'user:all',
          'report:all',
          'credit:all',
          'analytics:all',
          'settings:all',
          'admin:all'
        ]),
        lastLoginAt: new Date(),
        isActive: true,
        organizationId: null, // 시스템 관리자는 특정 조직에 속하지 않음
        role: 'SYSTEM_ADMIN',
        department: 'System Administration',
        position: 'System Administrator',
        status: 'ACTIVE',
        updatedAt: new Date()
      });

      if (import.meta.env.DEV) {
          message: 'Page refresh required for changes to take effect'
      }
      
      return true;

    } catch (error) {
      if (import.meta.env.DEV) {
      }
      return false;
    }
  }

  /**
   * 브라우저 콘솔에서 사용할 수 있도록 전역 함수로 등록
   */
  static registerGlobalDebugFunctions() {
    // 개발 환경에서만 전역 디버그 함수 등록
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      // @ts-ignore
      window.debugUser = {
        getCurrentInfo: this.getCurrentUserInfo,
        forceUpdateToSystemAdmin: this.forceUpdateToSystemAdmin
      };
      
        availableFunctions: [
          'await debugUser.getCurrentInfo() // Current user info check',
          'await debugUser.forceUpdateToSystemAdmin() // Force update to system admin'
        ]
      
      // Keep console logs for developer visibility in browser console
      console.log('🔧 디버깅 함수 등록 완료!');
      console.log('📝 브라우저 콘솔에서 다음 명령어를 사용하세요:');
      console.log('   - await debugUser.getCurrentInfo()    // 현재 사용자 정보 확인');
      console.log('   - await debugUser.forceUpdateToSystemAdmin()  // 시스템 관리자로 강제 업데이트');
    }
  }
} 