import React, { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { AdminContent } from './AdminContent'
import { useAdminConfig } from '../../core/hooks/useAdminConfig'
import { cn } from '@shared/components/ui/utils'

interface AdminLayoutProps {
  type: 'system' | 'organization'
  basePath: string
  children: React.ReactNode
}

export function AdminLayout({ type, basePath, children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { userType, availableMenus } = useAdminConfig()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={isSidebarOpen}
        type={type}
        basePath={basePath}
        menus={availableMenus}
      />

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-16"
      )}>
        {/* Header */}
        <AdminHeader 
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          type={type}
        />

        {/* Content */}
        <AdminContent>
          {children}
        </AdminContent>
      </div>
    </div>
  )
}