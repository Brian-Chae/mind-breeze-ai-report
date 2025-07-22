/**
 * 개발용 도구 함수들
 * 브라우저 콘솔에서 사용할 수 있는 유틸리티 함수들
 */

import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'

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
    }
  }

  console.log('🛠️ 개발 도구가 로드되었습니다!')
  console.log('사용 가능한 함수들:')
  console.log('- devTools.addAdminToOrganization(organizationId)')
  console.log('- devTools.getMembers(organizationId)')
  console.log('- devTools.getPendingMembers(organizationId)')
  console.log('- devTools.getOrganization(organizationId)')
}