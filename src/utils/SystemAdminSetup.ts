import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@core/services/firebase';
import { FirebaseService } from '@core/services/FirebaseService';

/**
 * 시스템 관리자 계정 자동 설정
 * Firebase Authentication과 Firestore 모두에 시스템 관리자 계정을 생성
 */
export class SystemAdminSetup {
  private static readonly ADMIN_EMAIL = 'admin@mindbreeze.kr';
  private static readonly ADMIN_PASSWORD = 'looxidlabs1234!';
  private static readonly ADMIN_UID = 'system-admin-uid';

  /**
   * 시스템 관리자 계정 존재 여부 확인 및 생성
   */
  static async ensureSystemAdminExists(): Promise<boolean> {
    try {
      console.log('🔍 시스템 관리자 계정 확인 중...');

      // 1. Firebase Auth에서 로그인 시도
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          this.ADMIN_EMAIL, 
          this.ADMIN_PASSWORD
        );
        
        console.log('✅ 시스템 관리자 계정이 이미 존재합니다:', userCredential.user.uid);
        
        // 로그아웃 (확인용 로그인이었음)
        await auth.signOut();
        
        return true;
      } catch (authError: any) {
        console.log('❌ Firebase Auth에 시스템 관리자 계정 없음:', authError.code);
        
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          // 2. 계정이 없으면 생성
          return await this.createSystemAdminAccount();
        } else {
          // 다른 에러는 재발생
          throw authError;
        }
      }
    } catch (error) {
      console.error('❌ 시스템 관리자 계정 확인 실패:', error);
      return false;
    }
  }

  /**
   * 시스템 관리자 계정 생성
   */
  private static async createSystemAdminAccount(): Promise<boolean> {
    try {
      console.log('🔧 시스템 관리자 계정 생성 중...');

      // 1. Firebase Auth에 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        this.ADMIN_EMAIL,
        this.ADMIN_PASSWORD
      );

      console.log('✅ Firebase Auth 계정 생성 완료:', userCredential.user.uid);

      // 2. Firestore에 사용자 프로필 생성
      await FirebaseService.updateUserProfile(userCredential.user.uid, {
        userType: 'SYSTEM_ADMIN',
        displayName: 'System Administrator',
        email: this.ADMIN_EMAIL,
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
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: null, // 시스템 관리자는 특정 조직에 속하지 않음
        employeeId: null,
        phone: null,
        profileImageUrl: null,
        role: 'SYSTEM_ADMIN',
        department: 'System Administration',
        position: 'System Administrator',
        status: 'ACTIVE',
        metadata: {
          isSystemGenerated: true,
          createdBy: 'system',
          version: '1.0'
        }
      });

      console.log('✅ Firestore 프로필 생성 완료');

      // 3. 로그아웃 (생성용 로그인이었음)
      await auth.signOut();

      console.log('🎉 시스템 관리자 계정 생성 완료!');
      return true;

    } catch (error) {
      console.error('❌ 시스템 관리자 계정 생성 실패:', error);
      return false;
    }
  }

  /**
   * 시스템 관리자 로그인 (인증 확인용)
   */
  static async testSystemAdminLogin(): Promise<boolean> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        this.ADMIN_EMAIL,
        this.ADMIN_PASSWORD
      );

      console.log('✅ 시스템 관리자 로그인 테스트 성공:', userCredential.user.email);
      
      // 테스트 완료 후 로그아웃
      await auth.signOut();
      
      return true;
    } catch (error) {
      console.error('❌ 시스템 관리자 로그인 테스트 실패:', error);
      return false;
    }
  }
} 