/**
 * Mind Breeze AI - 통합 타입 시스템 진입점
 * 
 * 모든 비즈니스 타입의 단일 소스 진실(Single Source of Truth)
 */

// 새로운 통합 타입 시스템 (권장)
export * from './unified';

// 기존 타입 시스템에서 타입만 선택적으로 export (호환성 유지)
export type {
  UserType as LegacyUserType,
  UserType, // UserType도 직접 export
  VolumeDiscountTier as LegacyVolumeDiscountTier,
  TrialType as LegacyTrialType,
  OrganizationStatus as LegacyOrganizationStatus,
  ServicePackageType as LegacyServicePackageType,
  CreditTransactionType as LegacyCreditTransactionType,
  Organization as LegacyOrganization,
  Organization, // Organization도 직접 export
  OrganizationMember as LegacyOrganizationMember,
  EnterpriseUser as LegacyEnterpriseUser,
  EnterpriseUser, // EnterpriseUser도 직접 export
  CreditTransaction as LegacyCreditTransaction,
  VolumeDiscountConfig
} from './business';

/**
 * @deprecated Use @core/types/unified instead
 * 이 import path는 향후 제거될 예정입니다.
 * 
 * 마이그레이션 가이드:
 * - import { UserType } from '@core/types/business' 
 * → import { UserType } from '@core/types/unified'
 */ 