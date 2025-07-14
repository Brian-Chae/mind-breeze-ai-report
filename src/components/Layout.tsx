'use client'

import React, { useState } from 'react'
import { cn } from './ui/utils'
import { 
  Activity, 
  Database, 
  FileText, 
  LayoutDashboard, 
  Settings, 
  Bluetooth,
  BarChart3
} from 'lucide-react'
import { LooxidIcon } from './ui/LooxidIcon'
import { NotificationContainer } from './ui/NotificationContainer'

interface LayoutProps {
  children: React.ReactNode
  currentSection: string
  onSectionChange: (section: string) => void
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'device-manager', label: 'Device Manager', icon: Bluetooth },
  { id: 'data-center', label: 'Data Center', icon: Database },
  { id: 'visualizer', label: 'Visualizer', icon: BarChart3 },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Layout({ children, currentSection, onSectionChange }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <LooxidIcon size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-medium text-foreground">LINK BAND</h1>
              <p className="text-xs text-muted-foreground">SDK Service</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    currentSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>SDK v1.2.0</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
      {/* Notifications */}
      <NotificationContainer />
    </div>
  )
} 