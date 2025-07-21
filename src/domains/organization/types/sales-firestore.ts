/**
 * 🔥 판매 관리 Firestore 컬렉션 구조 정의
 * Firebase Firestore 컬렉션 스키마 및 쿼리 타입
 */

import { Timestamp, DocumentReference } from 'firebase/firestore';
import { 
  DeviceSale, 
  ServiceRequest, 
  SalesStatistics,
  SalesStatus,
  ServiceStatus,
  ServiceType,
  ServiceUrgency 
} from './sales';

// ============================================================================
// 1. Firestore Document Interfaces
// ============================================================================

/**
 * deviceSales 컬렉션 (Root Level - System Admin View)
 * Path: /deviceSales/{saleId}
 */
export interface DeviceSaleDocument {
  id: string;
  deviceId: string;
  deviceSerialNumber: string;        // 빠른 조회용
  deviceModel: string;               // 빠른 조회용
  organizationId: string;
  organizationName: string;          // 빠른 조회용
  
  // 판매 정보
  saleDate: Timestamp;
  salePrice: number;
  totalAmount: number;
  
  // 담당자 정보
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  department?: string;
  
  // A/S 보증 정보
  warrantyStartDate: Timestamp;
  warrantyEndDate: Timestamp;
  warrantyPeriodMonths: number;
  
  // 상태 정보
  status: SalesStatus;
  
  // 메타 정보
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  notes?: string;
  
  // 인덱싱용 필드
  saleYear: number;                  // 2024
  saleMonth: number;                 // 1-12
  saleDay: number;                   // 1-31
  warrantyExpiryYear: number;        // 보증 만료 연도
  warrantyExpiryMonth: number;       // 보증 만료 월
}

/**
 * organizations/{orgId}/deviceSales/{saleId} (Organization Level)
 * 조직별 판매 데이터 (중복 저장 - 빠른 조회용)
 */
export interface OrganizationSaleDocument extends Omit<DeviceSaleDocument, 'organizationId' | 'organizationName'> {
  // organizationId는 문서 경로에 포함되므로 제외
}

/**
 * serviceRequests 컬렉션 (Root Level)
 * Path: /serviceRequests/{requestId}
 */
export interface ServiceRequestDocument {
  id: string;
  saleId: string;
  deviceId: string;
  deviceSerialNumber: string;        // 빠른 조회용
  deviceModel: string;               // 빠른 조회용
  organizationId: string;
  organizationName: string;          // 빠른 조회용
  
  // 요청 정보
  requestDate: Timestamp;
  serviceType: ServiceType;
  issueDescription: string;
  urgency: ServiceUrgency;
  requestedBy: string;               // 요청자 이름
  
  // 진행 정보
  status: ServiceStatus;
  assignedTechnician?: string;
  assignedTechnicianId?: string;
  estimatedCompletionDate?: Timestamp;
  actualCompletionDate?: Timestamp;
  
  // 처리 결과
  resolutionDescription?: string;
  replacementDeviceId?: string;
  serviceCost?: number;
  
  // 고객 만족도
  customerRating?: number;           // 1-5 점수
  customerFeedback?: string;
  
  // 메타 정보
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // 인덱싱용 필드
  requestYear: number;
  requestMonth: number;
  completionYear?: number;
  completionMonth?: number;
  isWarrantyService: boolean;        // 보증 서비스 여부
}

/**
 * organizations/{orgId}/serviceRequests/{requestId}
 * 조직별 A/S 요청 데이터 (중복 저장)
 */
export interface OrganizationServiceRequestDocument extends Omit<ServiceRequestDocument, 'organizationId' | 'organizationName'> {
  // organizationId는 문서 경로에 포함되므로 제외
}

/**
 * salesStatistics 컬렉션
 * Path: /salesStatistics/{statisticsId}
 * 일별/월별/연별 통계 데이터
 */
export interface SalesStatisticsDocument {
  id: string;
  period: 'daily' | 'monthly' | 'yearly';
  periodValue: string;               // '2024-01-15', '2024-01', '2024'
  
  // 기본 판매 통계
  totalSales: number;
  totalRevenue: number;
  averageSalePrice: number;
  
  // 보증 관련
  newWarranties: number;
  expiredWarranties: number;
  
  // A/S 관련
  newServiceRequests: number;
  completedServiceRequests: number;
  averageServiceTime: number;        // 평균 처리 시간 (일)
  
  // 조직별 세부 데이터
  organizationBreakdown: Array<{
    organizationId: string;
    organizationName: string;
    sales: number;
    revenue: number;
    serviceRequests: number;
  }>;
  
  // 기기 모델별 세부 데이터
  deviceModelBreakdown: Array<{
    deviceModel: string;
    sales: number;
    revenue: number;
    serviceRequests: number;
  }>;
  
  // 메타 정보
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastCalculatedAt: Timestamp;
}

/**
 * organizations/{orgId}/salesAnalytics/{analyticsId}
 * 조직별 판매 분석 데이터
 */
export interface OrganizationSalesAnalyticsDocument {
  id: string;
  organizationId: string;
  period: 'monthly' | 'yearly';
  periodValue: string;
  
  // 해당 조직 판매 데이터
  totalSales: number;
  totalRevenue: number;
  totalServiceRequests: number;
  averageServiceTime: number;
  customerSatisfactionRate: number;
  
  // 기기별 세부 데이터
  deviceBreakdown: Array<{
    deviceModel: string;
    sales: number;
    revenue: number;
    serviceRequests: number;
  }>;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// 2. Firestore Query Types
// ============================================================================

/**
 * 판매 데이터 쿼리 필터
 */
export interface SalesFirestoreQuery {
  organizationId?: string;
  deviceModel?: string;
  status?: SalesStatus;
  saleYear?: number;
  saleMonth?: number;
  warrantyExpiryYear?: number;
  warrantyExpiryMonth?: number;
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
  limit?: number;
  orderBy?: {
    field: keyof DeviceSaleDocument;
    direction: 'asc' | 'desc';
  };
}

/**
 * A/S 요청 쿼리 필터
 */
export interface ServiceRequestFirestoreQuery {
  organizationId?: string;
  deviceId?: string;
  status?: ServiceStatus;
  urgency?: ServiceUrgency;
  assignedTechnician?: string;
  requestYear?: number;
  requestMonth?: number;
  isWarrantyService?: boolean;
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
  limit?: number;
  orderBy?: {
    field: keyof ServiceRequestDocument;
    direction: 'asc' | 'desc';
  };
}

// ============================================================================
// 3. Firestore Collection References
// ============================================================================

/**
 * 컬렉션 경로 상수
 */
export const FIRESTORE_COLLECTIONS = {
  // Root Level Collections
  DEVICE_SALES: 'deviceSales',
  SERVICE_REQUESTS: 'serviceRequests',
  SALES_STATISTICS: 'salesStatistics',
  
  // Organization Level Collections
  ORG_DEVICE_SALES: 'deviceSales',
  ORG_SERVICE_REQUESTS: 'serviceRequests',
  ORG_SALES_ANALYTICS: 'salesAnalytics',
  
  // Other Related Collections
  DEVICE_INVENTORY: 'deviceInventory',
  ORGANIZATIONS: 'organizations'
} as const;

/**
 * 컬렉션 경로 생성 헬퍼
 */
export const getCollectionPath = {
  // Root Level
  deviceSales: () => FIRESTORE_COLLECTIONS.DEVICE_SALES,
  serviceRequests: () => FIRESTORE_COLLECTIONS.SERVICE_REQUESTS,
  salesStatistics: () => FIRESTORE_COLLECTIONS.SALES_STATISTICS,
  
  // Organization Level
  organizationSales: (orgId: string) => `organizations/${orgId}/${FIRESTORE_COLLECTIONS.ORG_DEVICE_SALES}`,
  organizationServiceRequests: (orgId: string) => `organizations/${orgId}/${FIRESTORE_COLLECTIONS.ORG_SERVICE_REQUESTS}`,
  organizationAnalytics: (orgId: string) => `organizations/${orgId}/${FIRESTORE_COLLECTIONS.ORG_SALES_ANALYTICS}`,
} as const;

// ============================================================================
// 4. Composite Index Requirements
// ============================================================================

/**
 * Firestore 복합 인덱스 요구사항
 * firebase.json의 firestore.indexes 섹션에 추가 필요
 */
export const REQUIRED_FIRESTORE_INDEXES = [
  // 판매 데이터 쿼리용 인덱스
  {
    collectionGroup: "deviceSales",
    fields: [
      { fieldPath: "organizationId", order: "ASCENDING" },
      { fieldPath: "saleDate", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "deviceSales", 
    fields: [
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "warrantyEndDate", order: "ASCENDING" }
    ]
  },
  {
    collectionGroup: "deviceSales",
    fields: [
      { fieldPath: "saleYear", order: "DESCENDING" },
      { fieldPath: "saleMonth", order: "DESCENDING" }
    ]
  },
  
  // A/S 요청 쿼리용 인덱스
  {
    collectionGroup: "serviceRequests",
    fields: [
      { fieldPath: "organizationId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "requestDate", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "serviceRequests",
    fields: [
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "urgency", order: "DESCENDING" },
      { fieldPath: "requestDate", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "serviceRequests",
    fields: [
      { fieldPath: "assignedTechnician", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "requestDate", order: "DESCENDING" }
    ]
  }
];

// ============================================================================
// 5. Data Transformation Helpers
// ============================================================================

/**
 * DeviceSale → DeviceSaleDocument 변환
 */
export const transformSaleToDocument = (sale: DeviceSale): DeviceSaleDocument => {
  const saleDate = sale.saleDate.toDate();
  const warrantyEndDate = sale.warrantyEndDate.toDate();
  
  return {
    ...sale,
    deviceSerialNumber: sale.deviceId, // 실제로는 DeviceInventory에서 가져와야 함
    deviceModel: 'LINK_BAND_2.0',      // 실제로는 DeviceInventory에서 가져와야 함
    saleYear: saleDate.getFullYear(),
    saleMonth: saleDate.getMonth() + 1,
    saleDay: saleDate.getDate(),
    warrantyExpiryYear: warrantyEndDate.getFullYear(),
    warrantyExpiryMonth: warrantyEndDate.getMonth() + 1
  };
};

/**
 * ServiceRequest → ServiceRequestDocument 변환
 */
export const transformServiceRequestToDocument = (request: ServiceRequest): ServiceRequestDocument => {
  const requestDate = request.requestDate.toDate();
  const completionDate = request.actualCompletionDate?.toDate();
  
  return {
    ...request,
    deviceSerialNumber: request.deviceId, // 실제로는 DeviceInventory에서 가져와야 함
    deviceModel: 'LINK_BAND_2.0',         // 실제로는 DeviceInventory에서 가져와야 함
    organizationName: '',                 // 실제로는 Organization에서 가져와야 함
    requestYear: requestDate.getFullYear(),
    requestMonth: requestDate.getMonth() + 1,
    completionYear: completionDate?.getFullYear(),
    completionMonth: completionDate ? completionDate.getMonth() + 1 : undefined,
    isWarrantyService: true, // 보증 기간 확인 로직 필요
    requestedBy: request.contactName || 'Unknown'
  };
};