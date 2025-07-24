/**
 * 시스템 상태 및 헬스 체크 관련 타입 정의
 */

export interface SystemHealthIssue {
  category: 'maintenance' | 'performance' | 'connectivity' | 'security' | 'data' | 'user'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  deviceIds?: string[]
  organizationIds?: string[]
  userIds?: string[]
  recommendedAction?: string
  estimatedImpact?: number
  detectedAt: Date
  metadata?: Record<string, unknown>
}

export interface SystemHealthReport {
  overallScore: number
  issues: SystemHealthIssue[]
  summary: {
    totalIssues: number
    criticalIssues: number
    highPriorityIssues: number
    affectedDevices: number
    affectedOrganizations: number
  }
  recommendations: string[]
  generatedAt: Date
}

export interface DeviceHealthStatus {
  deviceId: string
  status: 'healthy' | 'warning' | 'critical' | 'offline'
  batteryLevel?: number
  firmwareVersion?: string
  lastSeen?: Date
  issues: SystemHealthIssue[]
  maintenanceDue?: boolean
  performanceScore?: number
}

export interface OrganizationHealthStatus {
  organizationId: string
  organizationName: string
  overallScore: number
  deviceCount: number
  healthyDevices: number
  warningDevices: number
  criticalDevices: number
  offlineDevices: number
  activeUsers: number
  lastActivity?: Date
  issues: SystemHealthIssue[]
}

export type HealthCheckCategory = 
  | 'devices'
  | 'organizations' 
  | 'users'
  | 'performance'
  | 'security'
  | 'data_integrity'

export interface HealthCheckResult {
  category: HealthCheckCategory
  passed: boolean
  score: number
  issues: SystemHealthIssue[]
  checkedAt: Date
  nextCheckDue?: Date
}