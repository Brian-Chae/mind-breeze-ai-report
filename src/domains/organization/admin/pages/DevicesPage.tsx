import React from 'react'
import { useAdminConfig } from '../core/hooks/useAdminConfig'
import { UserType } from '../core/types/AdminTypes'

// Import existing device management components
import OrganizationDeviceManagementContent from '../../components/UnifiedAdmin/contents/OrganizationDeviceManagementContent'
import DeviceManagementContent from '../../components/OrganizationAdmin/Dashboard/contents/DeviceManagementContent'

export function DevicesPage() {
  const { userType } = useAdminConfig()

  // System admins get the system-wide device management, others get organization-specific
  if (userType === UserType.SYSTEM_ADMIN) {
    return <DeviceManagementContent />
  }

  return <OrganizationDeviceManagementContent />
}