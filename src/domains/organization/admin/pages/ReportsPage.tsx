import React from 'react'
import { useAdminConfig } from '../core/hooks/useAdminConfig'
import { UserType } from '../core/types/AdminTypes'

// Import existing report management components
import AIReportManagementContent from '../../components/UnifiedAdmin/contents/AIReportManagementContent'
import ReportManagementContent from '../../components/OrganizationAdmin/Dashboard/contents/ReportManagementContent'

export function ReportsPage() {
  const { userType } = useAdminConfig()

  // System admins get the system-wide report management, others get AI report management
  if (userType === UserType.SYSTEM_ADMIN) {
    return <ReportManagementContent />
  }

  return <AIReportManagementContent />
}