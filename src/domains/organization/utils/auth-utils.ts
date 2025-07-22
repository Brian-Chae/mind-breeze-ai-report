import { signOut } from 'firebase/auth'
import { auth } from '@core/services/firebase'

/**
 * 공통 로그아웃 함수
 * Firebase 인증에서 로그아웃하고 지정된 경로로 리디렉션
 */
export const performLogout = async (navigate: (path: string) => void, redirectPath: string = '/', userType?: string) => {
  try {
    console.log(`🔄 ${userType || '사용자'} 로그아웃 시작`)
    await signOut(auth)
    console.log('✅ Firebase 로그아웃 완료')
    navigate(redirectPath)
  } catch (error) {
    console.error('❌ 로그아웃 실패:', error)
    // 에러가 발생해도 지정된 경로로 리디렉션
    navigate(redirectPath)
  }
}