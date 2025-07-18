import { auth } from '@core/services/firebase';
import { FirebaseService } from '@core/services/FirebaseService';

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
        console.log('❌ 로그인된 사용자가 없습니다.');
        return null;
      }

      console.log('🔍 Firebase Auth 사용자 정보:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        emailVerified: currentUser.emailVerified
      });

      // Firestore에서 사용자 프로필 확인
      try {
        const userProfile = await FirebaseService.getUserProfile(currentUser.uid);
        console.log('🔍 Firestore 사용자 프로필:', userProfile);
        
        return {
          auth: currentUser,
          profile: userProfile
        };
      } catch (error) {
        console.log('❌ Firestore 사용자 프로필 조회 실패:', error);
        return {
          auth: currentUser,
          profile: null
        };
      }

    } catch (error) {
      console.error('❌ 사용자 정보 확인 실패:', error);
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
        console.log('❌ 로그인된 사용자가 없습니다.');
        return false;
      }

      console.log('🔧 시스템 관리자로 강제 업데이트 시작...');
      console.log('🔧 사용자 UID:', currentUser.uid);
      console.log('🔧 사용자 이메일:', currentUser.email);

      await FirebaseService.updateUserProfile(currentUser.uid, {
        userType: 'SYSTEM_ADMIN',
        displayName: 'System Administrator',
        email: currentUser.email,
        permissions: [
          'system:all',
          'organization:all',
          'user:all',
          'report:all',
          'credit:all',
          'analytics:all',
          'settings:all',
          'admin:all'
        ],
        lastLoginAt: new Date(),
        isActive: true,
        organizationId: null, // 시스템 관리자는 특정 조직에 속하지 않음
        role: 'SYSTEM_ADMIN',
        department: 'System Administration',
        position: 'System Administrator',
        status: 'ACTIVE',
        updatedAt: new Date()
      });

      console.log('✅ 시스템 관리자 업데이트 완료!');
      console.log('🔄 페이지를 새로고침하면 변경사항이 반영됩니다.');
      
      return true;

    } catch (error) {
      console.error('❌ 시스템 관리자 업데이트 실패:', error);
      return false;
    }
  }

  /**
   * 브라우저 콘솔에서 사용할 수 있도록 전역 함수로 등록
   */
  static registerGlobalDebugFunctions() {
    // @ts-ignore
    window.debugUser = {
      getCurrentInfo: this.getCurrentUserInfo,
      forceUpdateToSystemAdmin: this.forceUpdateToSystemAdmin
    };
    
    console.log('🔧 디버깅 함수 등록 완료!');
    console.log('📝 브라우저 콘솔에서 다음 명령어를 사용하세요:');
    console.log('   - await debugUser.getCurrentInfo()    // 현재 사용자 정보 확인');
    console.log('   - await debugUser.forceUpdateToSystemAdmin()  // 시스템 관리자로 강제 업데이트');
  }
} 