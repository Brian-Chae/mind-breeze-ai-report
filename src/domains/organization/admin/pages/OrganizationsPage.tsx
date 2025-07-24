import React from 'react'
import { useAdminConfig } from '../core/hooks/useAdminConfig'
import { UserType } from '../core/types/AdminTypes'

// Import existing organization management components
import OrganizationManagementContent from '../../components/UnifiedAdmin/contents/OrganizationManagement/OrganizationManagementContent'
import EnterpriseManagementContent from '../../components/OrganizationAdmin/Dashboard/contents/EnterpriseManagementContent'

export function OrganizationsPage() {
  const { userType } = useAdminConfig()

  // System admins see enterprise management, others see organization management
  if (userType === UserType.SYSTEM_ADMIN) {
    return <EnterpriseManagementContent />
  }

  return <OrganizationManagementContent />
}