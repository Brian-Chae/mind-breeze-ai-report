/**
 * 🛒 디바이스 판매 관리 시스템 타입 정의
 * 디바이스 일괄 판매, A/S 보증 관리를 위한 완전한 타입 시스템
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// 1. 판매 계약 (DeviceSale) - 핵심 판매 정보
// ============================================================================

export type SalesStatus = 'ACTIVE' | 'WARRANTY_EXPIRED' | 'AS_PROCESSING' | 'COMPLETED';

export interface DeviceSale {
  id: string;
  deviceId: string;              // deviceInventory.id 참조
  organizationId: string;        // 조직 ID
  organizationName: string;      // 조직명 (빠른 조회용)
  
  // 판매 정보
  saleDate: Timestamp;           // 판매일
  salePrice: number;             // 판매 가격
  totalAmount: number;           // 총 판매 금액 (부가세 포함)
  
  // 담당자 정보
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  department?: string;
  
  // A/S 보증 정보
  warrantyStartDate: Timestamp;  // 보증 시작일 (보통 판매일과 동일)
  warrantyEndDate: Timestamp;    // 보증 종료일
  warrantyPeriodMonths: number;  // 보증 기간 (개월) - 기본값: 12개월
  warrantyRemainingDays: number; // 보증 잔여일 (계산값)
  
  // 상태 정보
  status: SalesStatus;
  
  // 메타 정보
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;             // 판매 등록자
  notes?: string;
}

// 판매 생성 요청 데이터
export interface CreateSaleRequest {
  deviceId: string;
  organizationId: string;
  saleDate?: Date;               // 기본값: 오늘
  salePrice: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  department?: string;
  warrantyPeriodMonths?: number; // 기본값: 12개월
  notes?: string;
}

// ============================================================================
// 2. A/S 처리 (ServiceRequest) - A/S 요청 및 처리
// ============================================================================

export type ServiceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
export type ServiceType = 'REPAIR' | 'REPLACEMENT' | 'REFUND' | 'INSPECTION';
export type ServiceUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ServiceRequest {
  id: string;
  saleId: string;                // deviceSales.id 참조
  deviceId: string;
  organizationId: string;
  
  // 요청 정보
  requestDate: Timestamp;
  serviceType: ServiceType;
  issueDescription: string;
  urgency: ServiceUrgency;
  contactName?: string;          // 요청자 연락처 정보
  
  // 진행 정보
  status: ServiceStatus;
  assignedTechnician?: string;
  estimatedCompletionDate?: Timestamp;
  actualCompletionDate?: Timestamp;
  
  // 처리 결과
  resolutionDescription?: string;
  replacementDeviceId?: string;
  serviceCost?: number;         // A/S 비용 (보증기간 외)
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// 3. 판매 통계 (SalesStatistics) - 대시보드용
// ============================================================================

export interface SalesStatistics {
  // 기본 판매 통계
  totalSales: number;            // 총 판매 대수
  monthlyTotalSales: number;     // 이번달 총 판매 대수
  todayTotalSales: number;       // 오늘 총 판매 대수
  totalRevenue: number;          // 총 판매 대금
  
  // 월별/일별 통계
  monthlyRevenue: number;        // 이번달 판매 대금
  todayRevenue: number;          // 오늘 판매 대금
  
  // A/S 관련 통계
  activeWarranties: number;      // 보증 중인 기기 수
  expiredWarranties: number;     // 보증 만료된 기기 수
  pendingServiceRequests: number; // 대기 중인 A/S 요청
  
  // 성과 지표
  averageSalePrice: number;      // 평균 판매가
  customerSatisfactionRate: number; // 고객 만족도 (A/S 기준)
  
  // 추세 데이터
  monthlyTrend: Array<{
    month: string;
    sales: number;
    revenue: number;
    serviceRequests: number;
  }>;
  
  // 상위 고객사
  topCustomers: Array<{
    organizationId: string;
    organizationName: string;
    totalSales: number;
    totalRevenue: number;
  }>;
}

// ============================================================================
// 4. 판매 기기 목록 뷰 (SalesListItem) - 목록 표시용
// ============================================================================

export interface SalesListItem {
  // 기본 정보
  id: string;
  deviceId: string;
  deviceSerialNumber: string;
  deviceModel: string;
  
  // 고객사 정보
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  
  // 판매 정보
  saleDate: Date;
  salePrice: number;
  
  // 보증 정보
  warrantyEndDate: Date;
  warrantyRemainingDays: number;
  isWarrantyExpired: boolean;
  
  // 상태
  status: SalesStatus;
  
  // A/S 현황
  activeServiceRequests: number; // 진행 중인 A/S 요청 수
  totalServiceRequests: number;  // 총 A/S 요청 수
}

// ============================================================================
// 5. 검색 및 필터 옵션
// ============================================================================

export interface SalesSearchFilters {
  status?: SalesStatus[];
  organizationId?: string;
  deviceType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  warrantyStatus?: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON'; // 30일 이내 만료 예정
  hasActiveService?: boolean;    // A/S 진행 중인 기기만
  priceRange?: {
    min: number;
    max: number;
  };
}

// ============================================================================
// 6. A/S 처리 액션
// ============================================================================

// A/S 요청 생성
export interface CreateServiceRequestData {
  saleId: string;
  serviceType: ServiceType;
  issueDescription: string;
  urgency: ServiceUrgency;
  requestedBy: string;
}

// A/S 처리 완료
export interface CompleteServiceRequestData {
  serviceRequestId: string;
  resolutionDescription: string;
  replacementDeviceId?: string;
  serviceCost?: number;
  completedBy: string;
}

// ============================================================================
// 7. 페이지네이션 및 정렬
// ============================================================================

export interface SalesPaginationOptions {
  page: number;
  limit: number;
  sortBy: 'saleDate' | 'organizationName' | 'deviceId' | 'warrantyEndDate' | 'salePrice';
  sortOrder: 'asc' | 'desc';
}

// ============================================================================
// 8. 에러 처리
// ============================================================================

export class SalesManagementError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SalesManagementError';
  }
}

export const SalesErrorCodes = {
  DEVICE_NOT_AVAILABLE: 'DEVICE_NOT_AVAILABLE',
  DEVICE_ALREADY_SOLD: 'DEVICE_ALREADY_SOLD',
  SALE_NOT_FOUND: 'SALE_NOT_FOUND',
  INVALID_SALE_DATE: 'INVALID_SALE_DATE',
  INVALID_WARRANTY_PERIOD: 'INVALID_WARRANTY_PERIOD',
  SERVICE_REQUEST_NOT_FOUND: 'SERVICE_REQUEST_NOT_FOUND',
  WARRANTY_EXPIRED: 'WARRANTY_EXPIRED',
  UNAUTHORIZED_ACTION: 'UNAUTHORIZED_ACTION',
  INVALID_PRICE: 'INVALID_PRICE'
} as const;

export type SalesErrorCode = typeof SalesErrorCodes[keyof typeof SalesErrorCodes];

// ============================================================================
// 9. 상수 및 라벨
// ============================================================================

export const SalesStatusLabels = {
  ACTIVE: '🟢 정상',
  WARRANTY_EXPIRED: '🟡 보증만료',
  AS_PROCESSING: '🔧 A/S중',
  COMPLETED: '✅ 완료'
} as const;

export const ServiceStatusLabels = {
  PENDING: '⏳ 접수대기',
  IN_PROGRESS: '🔄 진행중',
  COMPLETED: '✅ 완료',
  REJECTED: '❌ 반려'
} as const;

export const ServiceUrgencyLabels = {
  LOW: '🟢 낮음',
  MEDIUM: '🟡 보통',
  HIGH: '🟠 높음',
  CRITICAL: '🔴 긴급'
} as const;

// 보증 상태 계산 함수
export const getWarrantyStatus = (warrantyEndDate: Date): 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  if (warrantyEndDate < now) {
    return 'EXPIRED';
  } else if (warrantyEndDate < thirtyDaysFromNow) {
    return 'EXPIRING_SOON';
  } else {
    return 'ACTIVE';
  }
};

// 보증 잔여일 계산 함수
export const calculateWarrantyRemainingDays = (warrantyEndDate: Date): number => {
  const now = new Date();
  const timeDiff = warrantyEndDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
};