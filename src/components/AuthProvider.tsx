import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔵 AuthProvider 초기화 시작');
    
    // 리다이렉트 결과 확인 (자동 리다이렉션 제거)
    const checkRedirectResult = async () => {
      try {
        console.log('🔵 리다이렉트 결과 확인 중...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ 리다이렉트 로그인 성공:', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName
          });
          // 자동 리다이렉션 제거 - 로그인 페이지에서 처리하도록 함
        } else {
          console.log('ℹ️ 리다이렉트 결과 없음');
        }
      } catch (error) {
        console.error('❌ 리다이렉트 결과 처리 오류:', error);
      }
    };

    checkRedirectResult();

    console.log('🔵 Firebase 인증 상태 리스너 등록');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔄 Firebase 인증 상태 변화:', {
        user: user ? {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName
        } : null,
        timestamp: new Date().toISOString()
      });
      
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('🔵 AuthProvider 정리 중...');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading
  };

  console.log('🔄 AuthProvider 렌더링:', { user: user?.email || null, loading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 