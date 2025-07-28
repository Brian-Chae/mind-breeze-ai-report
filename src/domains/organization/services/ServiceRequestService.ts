/**
 * 통합 서비스 요청(A/S) 관리 서비스
 * 
 * 기업에서 시스템 관리자로의 A/S 요청을 통합 관리
 * 워런티 확인, 비용 승인, 상태 추적 등 전체 A/S 생애주기 관리
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  runTransaction,
  Timestamp
} from 'firebase/firestore'
import { BaseService } from '../../../core/services/BaseService'
import {
  ServiceRequest,
  CreateServiceRequestRequest,
  UpdateServiceRequestRequest,
  ServiceRequestType,
  ServiceStatus,
  ServicePriority,
  IssueCategory,
  CostApprovalStatus,
  ServiceStatusHistory,
  ServiceRequestFilters,
  PaginatedResult,
  SortOptions,
  PaginationOptions,
  IntegratedDeviceError,
  IntegratedDeviceErrorCodes,
  IntegratedDeviceDefaults
} from '../types/integrated-device'
import { DeviceAllocationService } from './DeviceAllocationService'

export class ServiceRequestService extends BaseService {
  private static readonly COLLECTION_NAME = 'serviceRequests'
  private static readonly CACHE_TTL = 3 * 60 * 1000 // 3분 (A/S는 실시간성 중요)
  
  private deviceAllocationService: DeviceAllocationService

  constructor() {
    super()
    this.deviceAllocationService = new DeviceAllocationService()
  }
}
