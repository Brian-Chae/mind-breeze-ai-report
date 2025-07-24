import React from 'react'
import { cn } from '@shared/components/ui/utils'

interface AdminContentProps {
  children: React.ReactNode
  className?: string
}

export function AdminContent({ children, className }: AdminContentProps) {
  return (
    <main className={cn(
      "flex-1 overflow-auto bg-gray-50 p-6",
      className
    )}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  )
}