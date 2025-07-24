import React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@shared/components/ui/utils'
import { 
  Building2, 
  Users, 
  Cpu, 
  FileText, 
  Settings,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { MenuItem } from '../../core/types/AdminTypes'

interface AdminSidebarProps {
  isOpen: boolean
  type: 'system' | 'organization'
  basePath: string
  menus: MenuItem[]
}

const iconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  organizations: Building2,
  users: Users,
  devices: Cpu,
  reports: FileText,
  system: Settings
}

export function AdminSidebar({ isOpen, type, basePath, menus }: AdminSidebarProps) {
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-10",
      isOpen ? "w-64" : "w-16"
    )}>
      {/* Logo/Title */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className={cn(
          "flex items-center space-x-3 transition-opacity duration-200",
          !isOpen && "opacity-0"
        )}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">MB</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {type === 'system' ? '시스템 관리자' : '조직 관리자'}
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {menus.map((menu) => {
          const Icon = menu.icon || iconMap[menu.id] || FileText
          
          return (
            <NavLink
              key={menu.id}
              to={menu.path}
              className={({ isActive }) => cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200",
                "hover:bg-gray-100",
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-700",
                !isOpen && "justify-center"
              )}
              title={!isOpen ? menu.title : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                "transition-opacity duration-200",
                !isOpen && "hidden"
              )}>
                {menu.title}
              </span>
              {menu.badge && isOpen && (
                <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {menu.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div>Mind Breeze AI Report</div>
            <div>v1.0.0</div>
          </div>
        </div>
      )}
    </aside>
  )
}