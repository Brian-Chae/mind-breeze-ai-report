/**
 * Firebase Firestore 데이터 타입 정의
 * 
 * Firestore에서 가져온 원시 데이터와 애플리케이션에서 사용하는 
 * 변환된 데이터 간의 타입 안전성을 제공합니다.
 */

import { Timestamp, DocumentData } from 'firebase/firestore'

// === 공통 Firestore 타입 ===

export interface FirestoreDocument {
  id: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface FirestoreTimestampFields {
  createdAt?: Timestamp
  updatedAt?: Timestamp
  joinedAt?: Timestamp
  registrationDate?: Timestamp
  lastUsedDate?: Timestamp
  rentalStartDate?: Timestamp
  rentalEndDate?: Timestamp
  purchaseDate?: Timestamp
  warrantyStartDate?: Timestamp
  warrantyEndDate?: Timestamp
}

// === 디바이스 관련 Firestore 타입 ===

export interface FirestoreDeviceData extends DocumentData, FirestoreTimestampFields {
  id: string
  deviceId: string
  deviceName: string
  deviceModel: string
  acquisitionType: 'RENTAL' | 'PURCHASE'
  totalMeasurements?: number
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETURNED'
  batteryLevel?: number
  firmwareVersion?: string
  organizationId: string
  assignedUserId?: string
  assignedUserName?: string
  
  // 렌탈 전용 필드들
  monthlyFee?: number
  isExtensionRequested?: boolean
  isPurchaseConversionRequested?: boolean
  isReturnRequested?: boolean
  
  // 구매 전용 필드들
  purchasePrice?: number
}

export interface FirestoreServiceRequestData extends DocumentData, FirestoreTimestampFields {
  id: string
  deviceId: string
  organizationId: string
  requestType: 'EXTENSION' | 'PURCHASE_CONVERSION' | 'RETURN' | 'MAINTENANCE'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  requestedDate: Timestamp
  responseDate?: Timestamp
  requestDetails?: string
  responseDetails?: string
}

// === 조직 관련 Firestore 타입 ===

export interface FirestoreOrganizationData extends DocumentData, FirestoreTimestampFields {
  id: string
  name: string
  businessNumber?: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'INACTIVE'
  memberCount?: number
  deviceCount?: number
  subscriptionType?: string
  creditsRemaining?: number
}

export interface FirestoreOrganizationMemberData extends DocumentData, FirestoreTimestampFields {
  id: string
  email: string
  displayName?: string
  role: 'ADMIN' | 'MEMBER'
  organizationId: string
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
  lastLoginDate?: Timestamp
}

// === 리포트 관련 Firestore 타입 ===

export interface FirestoreReportData extends DocumentData, FirestoreTimestampFields {
  id: string
  userId: string
  organizationId: string
  deviceId: string
  reportType: 'HEALTH_ANALYSIS' | 'MEASUREMENT_SUMMARY' | 'PERIODIC_REPORT'
  status: 'GENERATING' | 'COMPLETED' | 'FAILED'
  generationStartTime?: Timestamp
  generationEndTime?: Timestamp
  metadata?: Record<string, unknown>
}

// === 사용량 및 분석 관련 Firestore 타입 ===

export interface FirestoreUsageData extends DocumentData, FirestoreTimestampFields {
  id: string
  organizationId: string
  deviceId?: string
  userId?: string
  usageType: 'MEASUREMENT' | 'REPORT_GENERATION' | 'DATA_EXPORT'
  timestamp: Timestamp
  metadata?: Record<string, unknown>
}

export interface FirestoreAnalyticsData extends DocumentData, FirestoreTimestampFields {
  id: string
  organizationId?: string
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  periodStart: Timestamp
  periodEnd: Timestamp
  metrics: Record<string, number>
  breakdown?: Record<string, Record<string, number>>
}

// === 타입 변환 유틸리티 ===

/**
 * Firestore Timestamp를 Date로 변환하는 유틸리티 타입
 */
export type ConvertTimestampsToDate<T> = {
  [K in keyof T]: T[K] extends Timestamp 
    ? Date 
    : T[K] extends Timestamp | undefined 
      ? Date | undefined
      : T[K] extends Timestamp | null
        ? Date | null
        : T[K]
}

/**
 * Firestore 문서의 Timestamp 필드들을 Date로 변환
 */
export function convertTimestampsToDate<T extends FirestoreTimestampFields>(data: T): ConvertTimestampsToDate<T> {
  const result = { ...data } as any
  
  // Timestamp 필드들을 Date로 변환
  const timestampFields: (keyof FirestoreTimestampFields)[] = [
    'createdAt', 'updatedAt', 'joinedAt', 'registrationDate', 'lastUsedDate',
    'rentalStartDate', 'rentalEndDate', 'purchaseDate', 'warrantyStartDate', 'warrantyEndDate'
  ]
  
  timestampFields.forEach(field => {
    if (result[field] && typeof result[field].toDate === 'function') {
      result[field] = result[field].toDate()
    }
  })
  
  return result
}

/**
 * Date를 Firestore Timestamp로 변환
 */
export function convertDateToTimestamp<T extends Record<string, any>>(data: T): T {
  const result = { ...data }
  
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Date) {
      (result as any)[key] = Timestamp.fromDate(result[key])
    }
  })
  
  return result
}

// === 타입 가드 함수들 ===

export function isFirestoreDocument(data: any): data is FirestoreDocument {
  return data && typeof data === 'object' && 'id' in data && 'createdAt' in data && 'updatedAt' in data
}

export function hasTimestampFields(data: any): data is FirestoreTimestampFields {
  return data && typeof data === 'object'
}