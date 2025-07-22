import React from 'react'
import UserManagementContent from './UserManagementContent'

interface UsersSectionProps {
  subSection: string;
  onNavigate: (section: string, subSection?: string) => void;
}

export default function UsersSection({ subSection, onNavigate }: UsersSectionProps) {
  // Use the new unified design
  return <UserManagementContent />
} 