/**
 * 🔧 A/S 관리 서비스
 * 
 * A/S 요청부터 완료까지의 전체 워크플로우를 관리합니다.
 * - 요청 생성/조회/업데이트
 * - 상태 변경 (대응대기 → 대응중 → 완료)
 * - 통계 및 분석
 * - 실시간 알림
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../core/services/firebase';
import { BaseService } from '../../../core/services/BaseService';
import { 
  ServiceRequest, 
  CreateServiceRequestData,
  ServiceResponseData,
  ServiceCompletionData,
  ServiceStatistics,
  ServiceRequestStatus
} from '../types/device';
import { IdGenerator } from '../../../core/utils/IdGenerator';

export class ServiceManagementService extends BaseService {
  private static instance: ServiceManagementService;
  
  // 캐시 키 상수
  private static readonly CACHE_KEYS = {
    SERVICE_REQUEST: (id: string) => `service_request_${id}`,
    SERVICE_REQUESTS_BY_STATUS: (status: ServiceRequestStatus) => `service_requests_status_${status}`,
    SERVICE_STATISTICS: () => 'service_statistics',
    ORGANIZATION_SERVICE_REQUESTS: (orgId: string) => `org_service_requests_${orgId}`,
  };

  // 캐시 TTL (초)
  private static readonly CACHE_TTL = {
    SERVICE_REQUEST: 300,      // 5분
    SERVICE_REQUESTS: 180,     // 3분  
    SERVICE_STATISTICS: 600,   // 10분
  };

  private constructor() {
    super();
  }

  public static getInstance(): ServiceManagementService {
    if (!ServiceManagementService.instance) {
      ServiceManagementService.instance = new ServiceManagementService();
    }
    return ServiceManagementService.instance;
  }

  // ============================================================================
  // 📝 A/S 요청 관리
  // ============================================================================

  /**
   * A/S 요청 생성
   */
  async createServiceRequest(requestData: CreateServiceRequestData): Promise<ServiceRequest> {
    return this.measureAndLog('createServiceRequest', async () => {
      this.validateRequired(requestData.organizationId, 'organizationId');
      this.validateRequired(requestData.organizationName, 'organizationName');
      this.validateRequired(requestData.requesterName, 'requesterName');
      this.validateRequired(requestData.requesterEmail, 'requesterEmail');
      this.validateRequired(requestData.deviceId, 'deviceId');
      this.validateRequired(requestData.issueDescription, 'issueDescription');

      const now = new Date();
      const requestId = IdGenerator.generateServiceRequestId();

      const serviceRequest: ServiceRequest = {
        id: requestId,
        ...requestData,
        requestDate: now,
        status: 'PENDING',
        resolutionMethod: '리퍼제품 교환',
        createdAt: now,
        updatedAt: now
      };

      try {
        const docRef = doc(db, 'serviceRequests', requestId);
        await setDoc(docRef, {
          ...serviceRequest,
          requestDate: Timestamp.fromDate(serviceRequest.requestDate),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 캐시 업데이트
        this.cache.set(
          ServiceManagementService.CACHE_KEYS.SERVICE_REQUEST(requestId), 
          serviceRequest,
          ServiceManagementService.CACHE_TTL.SERVICE_REQUEST
        );

        // 상태별 캐시 무효화
        this.cache.delete(ServiceManagementService.CACHE_KEYS.SERVICE_REQUESTS_BY_STATUS('PENDING'));
        this.cache.delete(ServiceManagementService.CACHE_KEYS.SERVICE_STATISTICS());


        return serviceRequest;

      } catch (error) {
        this.handleError(error, 'createServiceRequest', { requestData });
        throw error;
      }
    });
  }

  /**
   * A/S 요청 조회
   */
  async getServiceRequest(requestId: string): Promise<ServiceRequest> {
    return this.measureAndLog('getServiceRequest', async () => {
      this.validateId(requestId, 'A/S 요청 ID');

      return this.withCache(
        ServiceManagementService.CACHE_KEYS.SERVICE_REQUEST(requestId),
        async () => {
          try {
            const docRef = doc(db, 'serviceRequests', requestId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
              throw new Error('A/S 요청을 찾을 수 없습니다.');
            }

            const data = docSnap.data();
            return this.convertFirestoreServiceRequest(data);

          } catch (error) {
            this.handleError(error, 'getServiceRequest', { requestId });
            throw error;
          }
        },
        ServiceManagementService.CACHE_TTL.SERVICE_REQUEST
      );
    });
  }

  /**
   * 상태별 A/S 요청 조회
   */
  async getServiceRequestsByStatus(status: ServiceRequestStatus): Promise<ServiceRequest[]> {
    return this.measureAndLog('getServiceRequestsByStatus', async () => {
      return this.withCache(
        ServiceManagementService.CACHE_KEYS.SERVICE_REQUESTS_BY_STATUS(status),
        async () => {
          try {
            const q = query(
              collection(db, 'serviceRequests'),
              where('status', '==', status),
              orderBy('requestDate', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => 
              this.convertFirestoreServiceRequest(doc.data())
            );

            // 컬렉션이 없거나 데이터가 없는 경우 빈 배열 반환
            return requests || [];
          } catch (error) {
            this.logger.warn('상태별 A/S 요청 조회 실패', { status, error });
            return [];
          }
        },
        ServiceManagementService.CACHE_TTL.SERVICE_REQUESTS
      );
    });
  }

  /**
   * 조직별 A/S 요청 조회
   */
  async getServiceRequestsByOrganization(organizationId: string): Promise<ServiceRequest[]> {
    return this.measureAndLog('getServiceRequestsByOrganization', async () => {
      this.validateId(organizationId, '조직 ID');

      return this.withCache(
        ServiceManagementService.CACHE_KEYS.ORGANIZATION_SERVICE_REQUESTS(organizationId),
        async () => {
          try {
            const q = query(
              collection(db, 'serviceRequests'),
              where('organizationId', '==', organizationId),
              orderBy('requestDate', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => 
              this.convertFirestoreServiceRequest(doc.data())
            );

            return requests || [];
          } catch (error) {
            this.logger.error('조직의 A/S 요청 조회 실패', { organizationId, error });
            throw new Error('조직의 A/S 요청을 조회할 수 없습니다.');
          }
        },
        ServiceManagementService.CACHE_TTL.SERVICE_REQUESTS
      );
    });
  }

  // ============================================================================
  // 🎯 A/S 상태 변경 (핵심 워크플로우)
  // ============================================================================

  /**
   * A/S 대응 시작 (PENDING → IN_PROGRESS)
   */
  async respondToRequest(requestId: string, responseData: ServiceResponseData): Promise<ServiceRequest> {
    return this.measureAndLog('respondToRequest', async () => {
      this.validateId(requestId, 'A/S 요청 ID');
      this.validateRequired(responseData.responseMessage, 'responseMessage');
      this.validateRequired(responseData.assignedTechnicianId, 'assignedTechnicianId');
      this.validateRequired(responseData.assignedTechnicianName, 'assignedTechnicianName');

      try {
        const docRef = doc(db, 'serviceRequests', requestId);
        const now = new Date();

        const updateData = {
          status: 'IN_PROGRESS' as ServiceRequestStatus,
          responseDate: Timestamp.fromDate(now),
          responseMessage: responseData.responseMessage,
          assignedTechnicianId: responseData.assignedTechnicianId,
          assignedTechnicianName: responseData.assignedTechnicianName,
          updatedAt: serverTimestamp()
        };

        await updateDoc(docRef, updateData);

        // 업데이트된 요청 조회
        const updatedRequest = await this.getServiceRequest(requestId);

        // 캐시 갱신
        this.cache.set(
          ServiceManagementService.CACHE_KEYS.SERVICE_REQUEST(requestId),
          updatedRequest,
          ServiceManagementService.CACHE_TTL.SERVICE_REQUEST
        );

        // 상태별 캐시 무효화
        this.cache.delete(ServiceManagementService.CACHE_KEYS.SERVICE_REQUESTS_BY_STATUS('PENDING'));
        this.cache.delete(ServiceManagementService.CACHE_KEYS.SERVICE_REQUESTS_BY_STATUS('IN_PROGRESS'));
        this.cache.delete(ServiceManagementService.CACHE_KEYS.SERVICE_STATISTICS());

        this.logger.info('A/S 대응 시작', { requestId, technicianId: responseData.assignedTechnicianId });

        return updatedRequest;

      } catch (error) {
        this.handleError(error, 'respondToRequest', { requestId, responseData });
        throw error;
      }
    });
  }

  /**
   * A/S 완료 처리 (IN_PROGRESS → COMPLETED)
   */
  async completeServiceRequest(requestId: string, completionData: ServiceCompletionData): Promise<ServiceRequest> {
    return this.measureAndLog('completeServiceRequest', async () => {
      this.validateId(requestId, 'A/S 요청 ID');
      this.validateRequired(completionData.defectDescription, 'defectDescription');
      this.validateRequired(completionData.resolutionMethod, 'resolutionMethod');

      try {
        const docRef = doc(db, 'serviceRequests', requestId);
        const now = new Date();

        const updateData = {
          status: 'COMPLETED' as ServiceRequestStatus,
          completionDate: Timestamp.fromDate(now),
          defectDescription: completionData.defectDescription,
          resolutionMethod: completionData.resolutionMethod,
          resolutionNotes: completionData.resolutionNotes || '',
          replacementDeviceId: completionData.replacementDeviceId || '',
          updatedAt: serverTimestamp()
        };

        await updateDoc(docRef, updateData);

        // 업데이트된 요청 조회
        const updatedRequest = await this.getServiceRequest(requestId);

        // 캐시 갱신
        this.cache.set(
          ServiceManagementService.CACHE_KEYS.SERVICE_REQUEST(requestId),
          updatedRequest,
          ServiceManagementService.CACHE_TTL.SERVICE_REQUEST
        );

        // 상태별 캐시 무효화
        this.cache.delete(ServiceManagementService.CACHE_KEYS.SERVICE_REQUESTS_BY_STATUS('IN_PROGRESS'));
        this.cache.delete(ServiceManagementService.CACHE_KEYS.SERVICE_REQUESTS_BY_STATUS('COMPLETED'));
        this.cache.delete(ServiceManagementService.CACHE_KEYS.SERVICE_STATISTICS());

        this.logger.info('A/S 완료 처리', { requestId, resolutionMethod: completionData.resolutionMethod });

        return updatedRequest;

      } catch (error) {
        this.handleError(error, 'completeServiceRequest', { requestId, completionData });
        throw error;
      }
    });
  }

  // ============================================================================
  // 📈 A/S 통계 & 분석
  // ============================================================================

  /**
   * A/S 통계 조회
   */
  async getServiceStatistics(): Promise<ServiceStatistics> {
    return this.measureAndLog('getServiceStatistics', async () => {
      return this.withCache(
        ServiceManagementService.CACHE_KEYS.SERVICE_STATISTICS(),
        async () => {
          try {
            // 모든 A/S 요청 조회
            const q = query(collection(db, 'serviceRequests'));
            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => 
              this.convertFirestoreServiceRequest(doc.data())
            );

            const now = new Date();
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

            // 기본 통계 계산
            const totalRequests = requests.length;
            const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
            const inProgressRequests = requests.filter(r => r.status === 'IN_PROGRESS').length;
            const completedRequests = requests.filter(r => r.status === 'COMPLETED').length;
            const urgentRequests = requests.filter(r => r.urgencyLevel === 'HIGH' || r.urgencyLevel === 'CRITICAL').length;

            // 평균 처리 시간 계산
            const completedWithDates = requests.filter(r => 
              r.status === 'COMPLETED' && r.requestDate && r.completionDate
            );
            const averageResolutionTime = completedWithDates.length > 0 
              ? Math.round(completedWithDates.reduce((sum, r) => {
                  const diffTime = r.completionDate!.getTime() - r.requestDate.getTime();
                  return sum + (diffTime / (1000 * 60 * 60 * 24)); // 일 단위
                }, 0) / completedWithDates.length)
              : 0;

            // 월별 트렌드 계산
            const monthlyTrend = this.calculateMonthlyTrend(requests, sixMonthsAgo);

            // 이슈 타입별 통계
            const topIssueTypes = this.calculateTopIssueTypes(requests);

            const statistics: ServiceStatistics = {
              totalRequests,
              pendingRequests,
              inProgressRequests,
              completedRequests,
              averageResolutionTime,
              urgentRequests,
              monthlyRequestTrend: monthlyTrend,
              topIssueTypes
            };


            return statistics;

          } catch (error) {
            this.logger.error('A/S 통계 조회 실패', error);
            return {
              totalRequests: 0,
              pendingRequests: 0,
              inProgressRequests: 0,
              completedRequests: 0,
              averageResolutionTime: 0,
              urgentRequests: 0,
              monthlyRequestTrend: [],
              topIssueTypes: []
            };
          }
        },
        ServiceManagementService.CACHE_TTL.SERVICE_STATISTICS
      );
    });
  }

  // ============================================================================
  // 🛠️ 헬퍼 메서드
  // ============================================================================

  /**
   * Firestore 데이터를 ServiceRequest로 변환
   */
  private convertFirestoreServiceRequest(data: any): ServiceRequest {
    return {
      ...data,
      requestDate: data.requestDate?.toDate() || new Date(),
      responseDate: data.responseDate?.toDate(),
      completionDate: data.completionDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }

  /**
   * 월별 트렌드 계산
   */
  private calculateMonthlyTrend(requests: ServiceRequest[], fromDate: Date) {
    const monthlyData = new Map<string, { requests: number; completed: number }>();
    
    requests.forEach(request => {
      if (request.requestDate >= fromDate) {
        const monthKey = `${request.requestDate.getFullYear()}-${String(request.requestDate.getMonth() + 1).padStart(2, '0')}`;
        const current = monthlyData.get(monthKey) || { requests: 0, completed: 0 };
        current.requests++;
        if (request.status === 'COMPLETED') {
          current.completed++;
        }
        monthlyData.set(monthKey, current);
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * 이슈 타입별 통계 계산
   */
  private calculateTopIssueTypes(requests: ServiceRequest[]) {
    const issueTypes = new Map<string, number>();
    
    requests.forEach(request => {
      const issue = this.categorizeIssue(request.issueDescription);
      issueTypes.set(issue, (issueTypes.get(issue) || 0) + 1);
    });

    const total = requests.length;
    return Array.from(issueTypes.entries())
      .map(([issueType, count]) => ({
        issueType,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * 이슈 설명으로부터 카테고리 추출
   */
  private categorizeIssue(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes('배터리') || lower.includes('battery')) return '배터리 문제';
    if (lower.includes('연결') || lower.includes('connection') || lower.includes('블루투스')) return '연결 문제';
    if (lower.includes('충전') || lower.includes('charge')) return '충전 문제';
    if (lower.includes('화면') || lower.includes('display')) return '화면 문제';
    if (lower.includes('버튼') || lower.includes('button')) return '버튼 문제';
    if (lower.includes('센서') || lower.includes('sensor')) return '센서 문제';
    if (lower.includes('소프트웨어') || lower.includes('software') || lower.includes('앱')) return '소프트웨어 문제';
    return '기타';
  }
}

// 싱글톤 인스턴스 내보내기
export default ServiceManagementService.getInstance(); 