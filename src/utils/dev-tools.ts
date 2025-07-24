/**
 * 개발용 도구 함수들
 * 브라우저 콘솔에서 사용할 수 있는 유틸리티 함수들
 */

import organizationManagementService from '../domains/organization/services/management/OrganizationManagementService'
import { db } from '../core/services/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { UserType } from '@core/types/unified'

// 개발 환경에서만 window 객체에 유틸리티 함수들 추가
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  ;(window as any).devTools = {
    /**
     * 조직에 관리자 구성원 추가
     * 콘솔에서 사용: devTools.addAdminToOrganization('조직ID')
     */
    async addAdminToOrganization(organizationId: string) {
      try {
        await organizationManagementService.addAdminMemberToExistingOrganization(organizationId)
        return true
      } catch (error) {
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
        return members
      } catch (error) {
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
        return pendingMembers
      } catch (error) {
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
        return org
      } catch (error) {
        return null
      }
    },

    /**
     * 사용자 타입 및 조직 정보 수정
     * 콘솔에서 사용: devTools.fixUserData('사용자ID', '조직ID', 'ORGANIZATION_ADMIN')
     */
    async fixUserData(userId: string, organizationId: string, userType: UserType = 'ORGANIZATION_ADMIN') {
      try {
        
        // 현재 사용자 데이터 확인
        const userDoc = await getDoc(doc(db, 'users', userId))
        if (!userDoc.exists()) {
          throw new Error('사용자를 찾을 수 없습니다.')
        }
        
        const currentData = userDoc.data()
        
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
        
        // 수정된 데이터 확인
        const updatedDoc = await getDoc(doc(db, 'users', userId))
        const updatedData = updatedDoc.data()
        
        return true
      } catch (error) {
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
          return null
        }
        
        const userData = { id: userDoc.id, ...userDoc.data() }
        return userData
      } catch (error) {
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
        console.log('현재 사용자 정보:', {
          uid: auth.uid,
          email: auth.email,
          displayName: auth.displayName
        });
        return auth
      } else {
        return null
      }
    }
  }

  console.log('개발 도구 함수 목록:', {
    availableFunctions: [
      'devTools.addAdminToOrganization(organizationId)',
      'devTools.getMembers(organizationId)',
      'devTools.getPendingMembers(organizationId)',
      'devTools.getOrganization(organizationId)',
      'devTools.fixUserData(userId, organizationId, userType)',
      'devTools.getUserData(userId)',
      'devTools.getCurrentUser()'
    ]
  });
  
  // Keep console logs for developer visibility in browser console
  console.log('🛠️ 개발 도구가 로드되었습니다!');
  console.log('사용 가능한 함수들:');
  console.log('- devTools.addAdminToOrganization(organizationId)');
  console.log('- devTools.getMembers(organizationId)');
  console.log('- devTools.getPendingMembers(organizationId)');
  console.log('- devTools.getOrganization(organizationId)');
  console.log('- devTools.fixUserData(userId, organizationId, userType)');
  console.log('- devTools.getUserData(userId)');
  console.log('- devTools.getCurrentUser()');
}