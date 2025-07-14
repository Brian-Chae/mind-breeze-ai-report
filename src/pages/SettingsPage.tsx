import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Settings } from '../components/Settings'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  
  const handleSectionChange = (section: string) => {
    navigate(`/${section}`)
  }

  return (
    <Layout currentSection="settings" onSectionChange={handleSectionChange}>
      <Settings />
    </Layout>
  )
} 