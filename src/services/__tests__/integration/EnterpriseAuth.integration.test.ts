import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enterpriseAuthService } from '../../EnterpriseAuthService';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase'; // 실제 Firebase 인스턴스 사용

describe('EnterpriseAuthService Integration Tests', () => {
  beforeAll(async () => {
    console.log('Using real Firebase instance for integration testing');
  });

  afterAll(async () => {
    // 로그아웃
    if (auth.currentUser) {
      await signOut(auth);
    }
  });

  it('should create or login with Firebase credentials', async () => {
    const email = 'brian.chae@looxidlabs.com';
    const password = 'dlguswl8286!';

    try {
      // 먼저 로그인 시도
      let userCredential;
      try {
        console.log('Attempting login...');
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful:', userCredential?.user?.uid);
      } catch (loginError: any) {
        console.log('Login failed, attempting to create account:', loginError.code);
        
        if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
          // 계정이 없으면 생성
          console.log('Creating new account...');
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
          console.log('Account created successfully:', userCredential?.user?.uid);
        } else {
          throw loginError;
        }
      }

      expect(userCredential).toBeTruthy();
      expect(userCredential.user).toBeTruthy();
      expect(userCredential.user.email).toBe(email);
      
      console.log('Firebase Auth successful:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email
      });
    } catch (error) {
      console.error('Firebase Auth failed:', error);
      throw error;
    }
  });

  it('should work with EnterpriseAuthService', async () => {
    const email = 'brian.chae@looxidlabs.com';
    const password = 'dlguswl8286!';
    
    try {
      console.log('Testing EnterpriseAuthService...');
      
      // EnterpriseAuthService로 로그인 시도
      const user = await enterpriseAuthService.signIn({ email, password });
      
      expect(user).toBeTruthy();
      expect(user.email).toBe(email);
      
      // 현재 컨텍스트 확인
      const currentContext = enterpriseAuthService.getCurrentContext();
      expect(currentContext).toBeTruthy();
      expect(currentContext.user?.email).toBe(email);
      
      console.log('EnterpriseAuthService successful:', {
        user: user.email,
        userType: user.userType,
        context: currentContext.user?.userType
      });
    } catch (error) {
      console.error('EnterpriseAuthService failed:', error);
      
      // 더 자세한 디버깅 정보
      console.log('Current Firebase Auth user:', auth.currentUser?.email);
      console.log('Current context:', enterpriseAuthService.getCurrentContext());
      
      throw error;
    }
  });
}); 