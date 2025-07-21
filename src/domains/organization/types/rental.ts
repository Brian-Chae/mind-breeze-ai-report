/**
 * 🏢 디바이스 렌탈 관리 시스템 타입 정의
 * 렌탈 계약, 결제, 반납 관리를 위한 완전한 타입 시스템
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// 1. 렌탈 계약 (DeviceRental) - 핵심 렌탈 정보
// ============================================================================

export type RentalStatus = 'ACTIVE' | 'SCHEDULED_RETURN' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';
export type ContractType = 'RENTAL' | 'LEASE';

export interface DeviceRental {
  id: string;
  deviceId: string;              // deviceInventory.id 참조
  organizationId: string;        // 조직 ID
  organizationName: string;      // 조직명 (빠른 조회용)
  
  // 계약 정보
  contractType: ContractType;
  rentalPeriod: 1 | 3 | 6 | 12; // 개월 단위
  startDate: Timestamp;          // 계약 시작일
  endDate: Timestamp;            // 계약 종료일
  
  // 금액 정보
  monthlyFee: number;            // 월 렌탈료
  depositAmount: number;         // 보증금
  totalContractValue: number;    // 총 계약 금액
  
  // 담당자 정보
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  department?: string;
  
  // 상태 정보
  status: RentalStatus;
  returnScheduledDate: Timestamp; // 반납 예정일
  actualReturnDate?: Timestamp;   // 실제 반납일
  
  // 연체 정보
  overdueStartDate?: Timestamp;
  overdueDays?: number;
  overdueAmount?: number;
  
  // 메타 정보
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;             // 계약 생성자
  notes?: string;
}

// 렌탈 생성 요청 데이터
export interface CreateRentalRequest {
  deviceId: string;
  organizationId: string;
  contractType: ContractType;
  rentalPeriod: 1 | 3 | 6 | 12;
  startDate?: Date;              // 기본값: 오늘
  monthlyFee: number;
  depositAmount?: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  department?: string;
  notes?: string;
}

// ============================================================================
// 2. 렌탈 결제 (RentalPayment) - 결제 이력 관리
// ============================================================================

export type PaymentType = 'MONTHLY' | 'DEPOSIT' | 'PENALTY' | 'REFUND';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'CASH';

export interface RentalPayment {
  id: string;
  rentalId: string;              // deviceRentals.id 참조
  deviceId: string;
  organizationId: string;
  
  // 결제 정보
  paymentType: PaymentType;
  amount: number;
  paymentDate?: Timestamp;
  dueDate: Timestamp;
  
  // 상태
  status: PaymentStatus;
  
  // 결제 수단
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// 3. 렌탈 반납 (RentalReturn) - 반납 이력 관리
// ============================================================================

export type ReturnStatus = 'ON_TIME' | 'EARLY' | 'LATE';
export type DeviceCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';

export interface RentalReturn {
  id: string;
  rentalId: string;
  deviceId: string;
  organizationId: string;
  
  // 반납 정보
  scheduledReturnDate: Timestamp;
  actualReturnDate: Timestamp;
  returnStatus: ReturnStatus;
  
  // 기기 상태
  deviceCondition: DeviceCondition;
  conditionNotes?: string;
  
  // 처리 정보
  processedBy: string;
  receivedBy: string;
  
  // 정산 정보
  finalAmount: number;
  refundAmount?: number;
  penaltyAmount?: number;
  
  createdAt: Timestamp;
}

// ============================================================================
// 4. 렌탈 통계 (RentalStatistics) - 대시보드용
// ============================================================================

export interface RentalStatistics {
  // 기본 통계
  totalContracts: number;
  activeRentals: number;
  scheduledReturns: number;
  overdueRentals: number;
  completedRentals: number;
  
  // 수익 통계
  monthlyRevenue: number;
  totalRevenue: number;
  outstandingAmount: number;
  
  // 성과 지표
  averageRentalPeriod: number;   // 일 단위
  returnOnTimeRate: number;      // 정시 반납률 %
  deviceUtilizationRate: number; // 디바이스 활용률 %
  
  // 추세 데이터
  monthlyTrend: Array<{
    month: string;
    newContracts: number;
    returns: number;
    revenue: number;
  }>;
  
  // 상위 조직
  topOrganizations: Array<{
    organizationId: string;
    organizationName: string;
    activeRentals: number;
    totalRevenue: number;
  }>;
}

// ============================================================================
// 5. 회수 일정 (ScheduledReturn) - 회수 관리용
// ============================================================================

export interface ScheduledReturn {
  contractId: string;
  deviceId: string;
  organizationId: string;
  organizationName: string;
  contactName: string;
  contactPhone: string;
  scheduledDate: Date;
  daysUntilReturn: number;
  isOverdue: boolean;
  overduedays?: number;
}

// ============================================================================
// 6. 렌탈 필터 및 검색 옵션
// ============================================================================

export interface RentalSearchFilters {
  status?: RentalStatus[];
  organizationId?: string;
  deviceType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  overdueOnly?: boolean;
  upcomingReturns?: boolean;
}

// ============================================================================
// 7. 렌탈 액션 및 이벤트
// ============================================================================

export interface RentalAction {
  type: 'EXTEND' | 'EARLY_RETURN' | 'CANCEL' | 'UPDATE_CONTACT' | 'ADD_NOTE';
  rentalId: string;
  payload: any;
  executedBy: string;
  executedAt: Timestamp;
  reason?: string;
}

// 렌탈 연장 요청
export interface ExtendRentalRequest {
  rentalId: string;
  newEndDate: Date;
  reason: string;
  additionalMonths: number;
}

// 조기 반납 요청
export interface EarlyReturnRequest {
  rentalId: string;
  returnDate: Date;
  reason: string;
  deviceCondition: DeviceCondition;
}

// ============================================================================
// 8. 에러 처리
// ============================================================================

export class RentalManagementError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RentalManagementError';
  }
}

export const RentalErrorCodes = {
  DEVICE_NOT_AVAILABLE: 'DEVICE_NOT_AVAILABLE',
  RENTAL_NOT_FOUND: 'RENTAL_NOT_FOUND',
  INVALID_RENTAL_PERIOD: 'INVALID_RENTAL_PERIOD',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
  RETURN_DATE_INVALID: 'RETURN_DATE_INVALID',
  DEVICE_ALREADY_RENTED: 'DEVICE_ALREADY_RENTED',
  INSUFFICIENT_DEPOSIT: 'INSUFFICIENT_DEPOSIT',
  UNAUTHORIZED_ACTION: 'UNAUTHORIZED_ACTION'
} as const;

export type RentalErrorCode = typeof RentalErrorCodes[keyof typeof RentalErrorCodes];