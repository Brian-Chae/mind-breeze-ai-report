import React from 'react'

// 사용자 관리 컴포넌트 임포트
import UsersSection from '../../OrganizationAdmin/Users/UsersSection'

/**
 * 조직 사용자 관리 콘텐츠
 * 사용자 목록 관리를 위한 단일 페이지
 */
export default function OrganizationUserManagementContent() {
  const handleTabNavigation = (sectionId: string, subSectionId?: string) => {
    // 탭 네비게이션 제거됨 - 필요시 추후 구현
  }

  return (
    <UsersSection 
      subSection="user-list"
      onNavigate={handleTabNavigation}
    />
  )
}