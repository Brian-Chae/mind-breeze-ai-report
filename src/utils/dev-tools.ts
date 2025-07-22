/**
 * 개발용 도구 함수들
 * 브라우저 콘솔에서 사용할 수 있는 유틸리티 함수들
 */

import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import { db } from '@/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

// 개발 환경에서만 window 객체에 유틸리티 함수들 추가
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  ;(window as any).devTools = {
    /**
     * 조직에 관리자 구성원 추가
     * 콘솔에서 사용: devTools.addAdminToOrganization('조직ID')
     */
    async addAdminToOrganization(organizationId: string) {
      try {
        console.log('관리자 구성원 추가 시작...', organizationId)
        await organizationManagementService.addAdminMemberToExistingOrganization(organizationId)
        console.log('✅ 관리자 구성원 추가 완료!')
        return true
      } catch (error) {
        console.error('❌ 관리자 구성원 추가 실패:', error)
        return false
      }
    },

    /**
     * 조직 구성원 목록 조회
     * 콘솔에서 사용: devTools.getMembers('조직ID')
     */
    async getMembers(organizationId: string) {
      try {
        const members = await organizationManagementService.getMembers(organizationId)
        console.log('구성원 목록:', members)
        return members
      } catch (error) {
        console.error('구성원 목록 조회 실패:', error)
        return []
      }
    },

    /**
     * 대기 구성원 목록 조회
     * 콘솔에서 사용: devTools.getPendingMembers('조직ID')
     */
    async getPendingMembers(organizationId: string) {
      try {
        const pendingMembers = await organizationManagementService.getPendingMembers(organizationId)
        console.log('대기 구성원 목록:', pendingMembers)
        return pendingMembers
      } catch (error) {
        console.error('대기 구성원 목록 조회 실패:', error)
        return []
      }
    },

    /**
     * 조직 정보 조회
     * 콘솔에서 사용: devTools.getOrganization('조직ID')
     */
    async getOrganization(organizationId: string) {
      try {
        const org = await organizationManagementService.getOrganization(organizationId)
        console.log('조직 정보:', org)
        return org
      } catch (error) {
        console.error('조직 정보 조회 실패:', error)
        return null
      }
    },

    /**
     * 사용자 타입 및 조직 정보 수정
     * 콘솔에서 사용: devTools.fixUserData('사용자ID', '조직ID', 'ORGANIZATION_ADMIN')
     */
    async fixUserData(userId: string, organizationId: string, userType: 'ORGANIZATION_ADMIN' | 'SYSTEM_ADMIN' = 'ORGANIZATION_ADMIN') {
      try {
        console.log('사용자 데이터 수정 시작...', { userId, organizationId, userType })
        
        // 현재 사용자 데이터 확인
        const userDoc = await getDoc(doc(db, 'users', userId))
        if (!userDoc.exists()) {
          throw new Error('사용자를 찾을 수 없습니다.')
        }
        
        const currentData = userDoc.data()
        console.log('현재 사용자 데이터:', currentData)
        
        // 업데이트할 데이터
        const updateData: any = {
          userType,
          updatedAt: new Date()
        }
        
        if (organizationId) {
          updateData.organizationId = organizationId
        }
        
        // Firestore 업데이트
        await updateDoc(doc(db, 'users', userId), updateData)
        console.log('✅ 사용자 데이터 수정 완료!', updateData)
        
        // 수정된 데이터 확인
        const updatedDoc = await getDoc(doc(db, 'users', userId))
        const updatedData = updatedDoc.data()
        console.log('수정된 사용자 데이터:', updatedData)
        
        return true
      } catch (error) {
        console.error('❌ 사용자 데이터 수정 실패:', error)
        return false
      }
    },

    /**
     * 사용자 데이터 조회
     * 콘솔에서 사용: devTools.getUserData('사용자ID')
     */
    async getUserData(userId: string) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId))
        if (!userDoc.exists()) {
          console.log('사용자를 찾을 수 없습니다.')
          return null
        }
        
        const userData = { id: userDoc.id, ...userDoc.data() }
        console.log('사용자 데이터:', userData)
        return userData
      } catch (error) {
        console.error('사용자 데이터 조회 실패:', error)
        return null
      }
    },

    /**
     * 현재 로그인한 사용자 정보 조회
     * 콘솔에서 사용: devTools.getCurrentUser()
     */
    getCurrentUser() {
      const auth = (window as any).firebase?.auth?.currentUser
      if (auth) {
        console.log('현재 로그인 사용자:', {
          uid: auth.uid,
          email: auth.email,
          displayName: auth.displayName
        })
        return auth
      } else {
        console.log('로그인된 사용자가 없습니다.')
        return null
      }
    }
  }

  console.log('🛠️ 개발 도구가 로드되었습니다!')
  console.log('사용 가능한 함수들:')
  console.log('- devTools.addAdminToOrganization(organizationId)')
  console.log('- devTools.getMembers(organizationId)')
  console.log('- devTools.getPendingMembers(organizationId)')
  console.log('- devTools.getOrganization(organizationId)')
  console.log('- devTools.fixUserData(userId, organizationId, userType)')
  console.log('- devTools.getUserData(userId)')
  console.log('- devTools.getCurrentUser()')
}