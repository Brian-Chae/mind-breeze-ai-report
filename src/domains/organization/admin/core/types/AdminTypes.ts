/**
 * Admin domain core types
 */

import * as React from 'react';
import { UserType } from '@core/types/unified';

// Re-export UserType for other modules
export { UserType };

export interface AdminDashboardData {
  summary: {
    totalOrganizations: number;
    totalUsers: number;
    totalDevices: number;
    activeUsers: number;
    totalCredits: number;
    usedCredits: number;
  };
  organizationStats: {
    active: number;
    trial: number;
    suspended: number;
    expired: number;
  };
  userStats: {
    active: number;
    inactive: number;
    recentSignups: number;
  };
  deviceStats: {
    total: number;
    assigned: number;
    available: number;
    disconnected: number;
  };
  recentActivity: AdminActivity[];
  systemHealth: SystemHealthStatus;
}

export interface AdminActivity {
  id: string;
  type: 'user_login' | 'device_assignment' | 'credit_purchase' | 'organization_created' | 'system_update';
  description: string;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  services: {
    database: ServiceStatus;
    auth: ServiceStatus;
    storage: ServiceStatus;
    api: ServiceStatus;
  };
  lastChecked: Date;
}

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  error?: string;
  lastChecked: Date;
}

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  ORGANIZATION_MANAGER = 'ORGANIZATION_MANAGER',
  ORGANIZATION_MEMBER = 'ORGANIZATION_MEMBER',
  INDIVIDUAL_USER = 'INDIVIDUAL_USER'
}

// Export AdminPermission as Permission as well for compatibility
export enum AdminPermission {
  // System-level permissions
  MANAGE_SYSTEM = 'manage_system',
  VIEW_ALL_ORGANIZATIONS = 'view_all_organizations',
  MANAGE_ALL_ORGANIZATIONS = 'manage_all_organizations',
  VIEW_ALL_USERS = 'view_all_users',
  MANAGE_ALL_USERS = 'manage_all_users',
  VIEW_ALL_DEVICES = 'view_all_devices',
  MANAGE_ALL_DEVICES = 'manage_all_devices',
  MANAGE_SYSTEM_CONFIG = 'manage_system_config',
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_API_KEYS = 'manage_api_keys',
  SYSTEM_ADMIN = 'system_admin',
  
  // Organization-level permissions
  VIEW_ORGANIZATION = 'view_organization',
  READ_ORGANIZATIONS = 'read_organizations',
  WRITE_ORGANIZATIONS = 'write_organizations',
  DELETE_ORGANIZATIONS = 'delete_organizations',
  MANAGE_ORGANIZATION = 'manage_organization',
  MANAGE_ORGANIZATION_USERS = 'manage_organization_users',
  MANAGE_ORGANIZATION_DEVICES = 'manage_organization_devices',
  MANAGE_ORGANIZATION_CREDITS = 'manage_organization_credits',
  VIEW_ORGANIZATION_REPORTS = 'view_organization_reports',
  
  // User permissions
  READ_USERS = 'read_users',
  WRITE_USERS = 'write_users',
  DELETE_USERS = 'delete_users',
  INVITE_USERS = 'invite_users',
  
  // Device permissions
  READ_DEVICES = 'read_devices',
  WRITE_DEVICES = 'write_devices',
  ASSIGN_DEVICES = 'assign_devices',
  UNASSIGN_DEVICES = 'unassign_devices',
  DELETE_DEVICES = 'delete_devices',
  
  // Report permissions
  GENERATE_REPORTS = 'generate_reports',
  VIEW_REPORTS = 'view_reports',
  READ_REPORTS = 'read_reports',
  WRITE_REPORTS = 'write_reports',
  SHARE_REPORTS = 'share_reports',
  DELETE_REPORTS = 'delete_reports',
  EXPORT_REPORTS = 'export_reports',
  
  // Analytics permissions
  VIEW_ANALYTICS = 'view_analytics',
  
  // Credit permissions
  READ_CREDITS = 'read_credits',
  MANAGE_CREDITS = 'manage_credits',
  PURCHASE_CREDITS = 'purchase_credits'
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: SystemRole;
  permissions: AdminPermission[];
  organizationId?: string;
  lastActive?: Date;
  createdAt: Date;
  updatedAt?: Date;
  metadata?: {
    phoneNumber?: string;
    department?: string;
    notes?: string;
  };
}

export interface AdminOrganization {
  id: string;
  name: string;
  type: 'enterprise' | 'professional' | 'starter' | 'trial';
  status: 'active' | 'suspended' | 'expired' | 'trial';
  credits: {
    total: number;
    used: number;
    remaining: number;
  };
  subscription?: {
    plan: string;
    startDate: Date;
    endDate?: Date;
    autoRenew: boolean;
  };
  limits: {
    maxUsers: number;
    maxDevices: number;
    maxReportsPerMonth: number;
  };
  stats: {
    userCount: number;
    deviceCount: number;
    reportCount: number;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface AdminDevice {
  id: string;
  serialNumber: string;
  model: string;
  type: 'EEG' | 'PPG' | 'COMBINED';
  status: 'available' | 'assigned' | 'disconnected' | 'maintenance';
  organizationId?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  lastConnected?: Date;
  firmwareVersion?: string;
  metadata?: {
    location?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface AdminReport {
  id: string;
  type: 'health' | 'mental_health' | 'medical_risk' | 'comprehensive';
  userId: string;
  userName: string;
  organizationId?: string;
  organizationName?: string;
  deviceId: string;
  status: 'pending' | 'completed' | 'failed';
  creditsUsed: number;
  generatedAt: Date;
  sharedWithUserIds?: string[];
  metadata?: {
    biomarkers?: string[];
    duration?: number;
    quality?: number;
  };
}

export interface AdminSystemConfig {
  id: string;
  category: 'general' | 'security' | 'api' | 'limits' | 'features';
  key: string;
  value: any;
  description?: string;
  lastModified: Date;
  modifiedBy: string;
}

export interface AdminApiKey {
  id: string;
  name: string;
  key: string;
  type: 'production' | 'development' | 'test';
  permissions: string[];
  organizationId?: string;
  expiresAt?: Date;
  lastUsed?: Date;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  category: 'auth' | 'user' | 'organization' | 'device' | 'report' | 'system';
  userId: string;
  userName: string;
  organizationId?: string;
  targetId?: string;
  targetType?: string;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'organization' | 'user' | 'device';
  title: string;
  message: string;
  targetRole?: SystemRole;
  targetUserId?: string;
  targetOrganizationId?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actions?: {
    label: string;
    url?: string;
    action?: string;
  }[];
}

export interface AdminStats {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  data: {
    newUsers: number;
    activeUsers: number;
    newOrganizations: number;
    reportsGenerated: number;
    creditsUsed: number;
    devicesConnected: number;
    revenue?: number;
  };
}

// Permission helpers
export const rolePermissions: Record<SystemRole, AdminPermission[]> = {
  [SystemRole.SUPER_ADMIN]: Object.values(AdminPermission),
  [SystemRole.SYSTEM_ADMIN]: [
    AdminPermission.SYSTEM_ADMIN,
    AdminPermission.VIEW_ALL_ORGANIZATIONS,
    AdminPermission.READ_ORGANIZATIONS,
    AdminPermission.WRITE_ORGANIZATIONS,
    AdminPermission.MANAGE_ALL_ORGANIZATIONS,
    AdminPermission.VIEW_ALL_USERS,
    AdminPermission.READ_USERS,
    AdminPermission.WRITE_USERS,
    AdminPermission.MANAGE_ALL_USERS,
    AdminPermission.VIEW_ALL_DEVICES,
    AdminPermission.MANAGE_ALL_DEVICES,
    AdminPermission.VIEW_SYSTEM_LOGS,
    AdminPermission.MANAGE_API_KEYS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
  ],
  [SystemRole.ORGANIZATION_ADMIN]: [
    AdminPermission.VIEW_ORGANIZATION,
    AdminPermission.READ_ORGANIZATIONS,
    AdminPermission.WRITE_ORGANIZATIONS,
    AdminPermission.MANAGE_ORGANIZATION,
    AdminPermission.MANAGE_ORGANIZATION_USERS,
    AdminPermission.READ_USERS,
    AdminPermission.WRITE_USERS,
    AdminPermission.MANAGE_ORGANIZATION_DEVICES,
    AdminPermission.MANAGE_ORGANIZATION_CREDITS,
    AdminPermission.VIEW_ORGANIZATION_REPORTS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
    AdminPermission.ASSIGN_DEVICES,
    AdminPermission.UNASSIGN_DEVICES,
  ],
  [SystemRole.ORGANIZATION_MANAGER]: [
    AdminPermission.VIEW_ORGANIZATION,
    AdminPermission.MANAGE_ORGANIZATION_USERS,
    AdminPermission.READ_USERS,
    AdminPermission.WRITE_USERS,
    AdminPermission.MANAGE_ORGANIZATION_DEVICES,
    AdminPermission.VIEW_ORGANIZATION_REPORTS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
    AdminPermission.ASSIGN_DEVICES,
    AdminPermission.UNASSIGN_DEVICES,
  ],
  [SystemRole.ORGANIZATION_MEMBER]: [
    AdminPermission.VIEW_ORGANIZATION,
    AdminPermission.VIEW_ORGANIZATION_REPORTS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
    AdminPermission.GENERATE_REPORTS,
    AdminPermission.VIEW_REPORTS,
  ],
  [SystemRole.INDIVIDUAL_USER]: [
    AdminPermission.GENERATE_REPORTS,
    AdminPermission.VIEW_REPORTS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
    AdminPermission.SHARE_REPORTS,
  ],
};

export function hasPermission(role: SystemRole, permission: AdminPermission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

export function canAccessAdmin(role: SystemRole): boolean {
  return [
    SystemRole.SUPER_ADMIN,
    SystemRole.SYSTEM_ADMIN,
    SystemRole.ORGANIZATION_ADMIN,
    SystemRole.ORGANIZATION_MANAGER,
  ].includes(role);
}

export function isSystemAdmin(role: SystemRole): boolean {
  return [SystemRole.SUPER_ADMIN, SystemRole.SYSTEM_ADMIN].includes(role);
}

export function isOrganizationAdmin(role: SystemRole): boolean {
  return [
    SystemRole.ORGANIZATION_ADMIN,
    SystemRole.ORGANIZATION_MANAGER,
  ].includes(role);
}

// Additional exports and types

// Export AdminPermission as Permission for compatibility
export { AdminPermission as Permission };

// Re-export UserType for compatibility
export type { UserType };

// MenuItem interface
export interface MenuItem {
  id: string;
  label: string;
  title?: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  permissions?: AdminPermission[];
  roles?: SystemRole[];
  children?: MenuItem[];
  isNew?: boolean;
  badge?: string | number;
}

// AdminConfig interface
export interface AdminConfig {
  userType: UserType;
  permissions: AdminPermission[];
  availableMenus: MenuItem[];
  restrictedFeatures?: string[];
  organizationId?: string;
  organizationName?: string;
  features?: {
    canViewAllOrganizations: boolean;
    canManageAllOrganizations: boolean;
    canViewSystemHealth: boolean;
    canManageSystemConfig: boolean;
    canViewAuditLogs: boolean;
    canManageApiKeys: boolean;
    canAccessReports: boolean;
    canManageDevices: boolean;
    canManageUsers: boolean;
    canManageCredits: boolean;
  };
}

// PermissionCheck type
export type PermissionCheck = (permission: AdminPermission | AdminPermission[]) => boolean;

// Default permissions constant
export const DEFAULT_PERMISSIONS: Record<SystemRole, AdminPermission[]> = {
  [SystemRole.SUPER_ADMIN]: Object.values(AdminPermission),
  [SystemRole.SYSTEM_ADMIN]: [
    AdminPermission.SYSTEM_ADMIN,
    AdminPermission.VIEW_ALL_ORGANIZATIONS,
    AdminPermission.READ_ORGANIZATIONS,
    AdminPermission.WRITE_ORGANIZATIONS,
    AdminPermission.MANAGE_ALL_ORGANIZATIONS,
    AdminPermission.VIEW_ALL_USERS,
    AdminPermission.READ_USERS,
    AdminPermission.WRITE_USERS,
    AdminPermission.MANAGE_ALL_USERS,
    AdminPermission.VIEW_ALL_DEVICES,
    AdminPermission.MANAGE_ALL_DEVICES,
    AdminPermission.VIEW_SYSTEM_LOGS,
    AdminPermission.MANAGE_API_KEYS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
  ],
  [SystemRole.ORGANIZATION_ADMIN]: [
    AdminPermission.VIEW_ORGANIZATION,
    AdminPermission.READ_ORGANIZATIONS,
    AdminPermission.WRITE_ORGANIZATIONS,
    AdminPermission.MANAGE_ORGANIZATION,
    AdminPermission.MANAGE_ORGANIZATION_USERS,
    AdminPermission.READ_USERS,
    AdminPermission.WRITE_USERS,
    AdminPermission.MANAGE_ORGANIZATION_DEVICES,
    AdminPermission.MANAGE_ORGANIZATION_CREDITS,
    AdminPermission.VIEW_ORGANIZATION_REPORTS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
    AdminPermission.ASSIGN_DEVICES,
    AdminPermission.UNASSIGN_DEVICES,
  ],
  [SystemRole.ORGANIZATION_MANAGER]: [
    AdminPermission.VIEW_ORGANIZATION,
    AdminPermission.MANAGE_ORGANIZATION_USERS,
    AdminPermission.READ_USERS,
    AdminPermission.WRITE_USERS,
    AdminPermission.MANAGE_ORGANIZATION_DEVICES,
    AdminPermission.VIEW_ORGANIZATION_REPORTS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
    AdminPermission.ASSIGN_DEVICES,
    AdminPermission.UNASSIGN_DEVICES,
  ],
  [SystemRole.ORGANIZATION_MEMBER]: [
    AdminPermission.VIEW_ORGANIZATION,
    AdminPermission.VIEW_ORGANIZATION_REPORTS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
    AdminPermission.GENERATE_REPORTS,
    AdminPermission.VIEW_REPORTS,
  ],
  [SystemRole.INDIVIDUAL_USER]: [
    AdminPermission.GENERATE_REPORTS,
    AdminPermission.VIEW_REPORTS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
    AdminPermission.SHARE_REPORTS,
  ],
};

// Restricted features constant
export const RESTRICTED_FEATURES = {
  SYSTEM_HEALTH: [SystemRole.SUPER_ADMIN, SystemRole.SYSTEM_ADMIN],
  SYSTEM_CONFIG: [SystemRole.SUPER_ADMIN],
  AUDIT_LOGS: [SystemRole.SUPER_ADMIN, SystemRole.SYSTEM_ADMIN],
  API_KEYS: [SystemRole.SUPER_ADMIN, SystemRole.SYSTEM_ADMIN],
  ALL_ORGANIZATIONS: [SystemRole.SUPER_ADMIN, SystemRole.SYSTEM_ADMIN],
  ALL_DEVICES: [SystemRole.SUPER_ADMIN, SystemRole.SYSTEM_ADMIN],
  ALL_USERS: [SystemRole.SUPER_ADMIN, SystemRole.SYSTEM_ADMIN],
} as const;

// Feature permissions mapping
export const FEATURE_PERMISSIONS: Record<string, AdminPermission[]> = {
  organizations: [
    AdminPermission.VIEW_ALL_ORGANIZATIONS,
    AdminPermission.READ_ORGANIZATIONS,
    AdminPermission.WRITE_ORGANIZATIONS,
    AdminPermission.MANAGE_ALL_ORGANIZATIONS,
  ],
  users: [
    AdminPermission.VIEW_ALL_USERS,
    AdminPermission.READ_USERS,
    AdminPermission.WRITE_USERS,
    AdminPermission.MANAGE_ALL_USERS,
    AdminPermission.MANAGE_ORGANIZATION_USERS,
  ],
  devices: [
    AdminPermission.VIEW_ALL_DEVICES,
    AdminPermission.READ_DEVICES,
    AdminPermission.WRITE_DEVICES,
    AdminPermission.MANAGE_ALL_DEVICES,
    AdminPermission.MANAGE_ORGANIZATION_DEVICES,
    AdminPermission.ASSIGN_DEVICES,
    AdminPermission.UNASSIGN_DEVICES,
    AdminPermission.DELETE_DEVICES,
  ],
  reports: [
    AdminPermission.VIEW_ORGANIZATION_REPORTS,
    AdminPermission.READ_REPORTS,
    AdminPermission.WRITE_REPORTS,
    AdminPermission.GENERATE_REPORTS,
    AdminPermission.VIEW_REPORTS,
    AdminPermission.SHARE_REPORTS,
    AdminPermission.DELETE_REPORTS,
  ],
  credits: [
    AdminPermission.READ_CREDITS,
    AdminPermission.MANAGE_ORGANIZATION_CREDITS,
    AdminPermission.MANAGE_CREDITS,
  ],
  system: [
    AdminPermission.SYSTEM_ADMIN,
    AdminPermission.MANAGE_SYSTEM,
    AdminPermission.MANAGE_SYSTEM_CONFIG,
    AdminPermission.VIEW_SYSTEM_LOGS,
    AdminPermission.MANAGE_API_KEYS,
  ],
};