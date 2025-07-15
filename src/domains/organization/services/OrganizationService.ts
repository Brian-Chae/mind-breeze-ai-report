import { BaseService } from '@core/services/BaseService';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  runTransaction,
  DocumentSnapshot
} from 'firebase/firestore';

import {
  Organization,
  Department,
  OrganizationStats,
  OrganizationTree,
  OrganizationDashboardData,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  OrganizationFilters,
  DepartmentFilters,
  OrganizationSearchResult,
  RecentActivity,
  OrganizationAlert,
  HealthTrend,
  RiskMember,
  DepartmentHealth,
  SystemNotification,
  RiskLevel,
  OrganizationSize,
  OrganizationStatus
} from '../types/organization';

/**
 * 조직 관리 서비스 클래스
 * 조직 정보, 부서 관리, 통계 등 조직 관련 모든 기능을 제공합니다.
 */
export class OrganizationService extends BaseService {
  private readonly ORGANIZATIONS_COLLECTION = 'organizations';
  private readonly DEPARTMENTS_COLLECTION = 'departments';
  private readonly ACTIVITIES_COLLECTION = 'activities';
  private readonly ALERTS_COLLECTION = 'organizationAlerts';

  // ===== 조직 정보 관리 =====

  /**
   * 조직 정보 조회
   * @param organizationId 조직 ID
   * @returns 조직 정보
   */
  async getOrganization(organizationId: string): Promise<Organization> {
    try {
      this.validateId(organizationId, '조직 ID');
      
      // 캐시 확인
      const cached = this.getCache<Organization>(`org:${organizationId}`);
      if (cached !== null) {
        return cached as Organization;
      }

      const docRef = doc(this.db, this.ORGANIZATIONS_COLLECTION, organizationId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('조직을 찾을 수 없습니다.');
      }

      const data = docSnap.data();
      const organization: Organization = {
        id: docSnap.id,
        name: data.name,
        industry: data.industry,
        size: data.size,
        employeeCount: data.employeeCount,
        businessRegistrationNumber: data.businessRegistrationNumber,
        website: data.website,
        address: data.address,
        contact: data.contact,
        settings: data.settings,
        subscription: {
          ...data.subscription,
          startDate: this.toDate(data.subscription.startDate),
          endDate: this.toDate(data.subscription.endDate),
          nextBillingDate: data.subscription.nextBillingDate ? this.toDate(data.subscription.nextBillingDate) : undefined,
          lastPaymentDate: data.subscription.lastPaymentDate ? this.toDate(data.subscription.lastPaymentDate) : undefined
        },
        status: data.status,
        creditBalance: data.creditBalance || 0,
        isTrialActive: data.isTrialActive || false,
        trialType: data.trialType,
        trialStartDate: data.trialStartDate ? this.toDate(data.trialStartDate) : undefined,
        trialEndDate: data.trialEndDate ? this.toDate(data.trialEndDate) : undefined,
        trialCreditsTotal: data.trialCreditsTotal,
        contractStartDate: data.contractStartDate ? this.toDate(data.contractStartDate) : undefined,
        contractEndDate: data.contractEndDate ? this.toDate(data.contractEndDate) : undefined,
        contractDocument: data.contractDocument,
        createdAt: this.toDate(data.createdAt),
        updatedAt: this.toDate(data.updatedAt),
        createdBy: data.createdBy,
        logo: data.logo,
        description: data.description
      };

      // 캐시에 저장 (5분)
      this.setCache(`org:${organizationId}`, organization, 300000);
      
      this.log('조직 정보 조회 완료', { organizationId, name: organization.name });
      return organization;

    } catch (error) {
      this.handleError(error, 'getOrganization', { organizationId });
    }
  }

  /**
   * 조직 정보 생성
   * @param request 조직 생성 요청
   * @param createdBy 생성자 ID
   * @returns 생성된 조직 정보
   */
  async createOrganization(request: CreateOrganizationRequest, createdBy: string): Promise<Organization> {
    try {
      this.validateRequired(request.name, '조직명');
      this.validateRequired(request.industry, '업종');
      this.validateRequired(createdBy, '생성자 ID');
      this.validateEmail(request.contact.email);

      const now = this.now();
      const organizationData = {
        name: request.name,
        industry: request.industry,
        size: request.size,
        employeeCount: request.employeeCount || 0,
        businessRegistrationNumber: request.businessRegistrationNumber,
        website: request.website,
        address: request.address,
        contact: request.contact,
        settings: {
          timezone: 'Asia/Seoul',
          language: 'ko',
          currency: 'KRW',
          measurementUnit: 'metric',
          workingHours: {
            start: '09:00',
            end: '18:00',
            daysOfWeek: [1, 2, 3, 4, 5]
          },
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          ...request.settings
        },
        subscription: {
          planType: 'TRIAL',
          status: 'ACTIVE',
          startDate: now,
          endDate: this.toTimestamp(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30일 후
          maxUsers: 50,
          maxDevices: 10,
          features: ['basic_reports', 'measurement', 'dashboard'],
          billingCycle: 'MONTHLY'
        },
        status: 'TRIAL' as OrganizationStatus,
        creditBalance: 0,
        isTrialActive: true,
        trialType: 'FREE_TRIAL',
        trialStartDate: now,
        trialEndDate: this.toTimestamp(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        trialCreditsTotal: 10,
        createdAt: now,
        updatedAt: now,
        createdBy
      };

      const docRef = doc(collection(this.db, this.ORGANIZATIONS_COLLECTION));
      await setDoc(docRef, organizationData);

      this.log('조직 생성 완료', { organizationId: docRef.id, name: request.name });
      
      // 생성된 조직 정보 반환
      return await this.getOrganization(docRef.id);

    } catch (error) {
      this.handleError(error, 'createOrganization', { request });
    }
  }

  /**
   * 조직 정보 업데이트
   * @param organizationId 조직 ID
   * @param request 업데이트 요청
   * @param updatedBy 업데이트한 사용자 ID
   */
  async updateOrganization(
    organizationId: string, 
    request: UpdateOrganizationRequest, 
    updatedBy: string
  ): Promise<void> {
    try {
      this.validateId(organizationId, '조직 ID');
      this.validateRequired(updatedBy, '업데이트 사용자 ID');

      // 기존 조직 존재 확인
      await this.getOrganization(organizationId);

      // 이메일 검증 (변경 시)
      if (request.contact?.email) {
        this.validateEmail(request.contact.email);
      }

      const updateData: any = {
        updatedAt: this.now()
      };

      // 요청된 필드만 업데이트
      if (request.name) updateData.name = request.name;
      if (request.industry) updateData.industry = request.industry;
      if (request.size) updateData.size = request.size;
      if (request.employeeCount !== undefined) updateData.employeeCount = request.employeeCount;
      if (request.businessRegistrationNumber) updateData.businessRegistrationNumber = request.businessRegistrationNumber;
      if (request.website) updateData.website = request.website;
      if (request.description) updateData.description = request.description;
      
      if (request.address) {
        updateData.address = request.address;
      }
      
      if (request.contact) {
        updateData.contact = request.contact;
      }
      
      if (request.settings) {
        updateData.settings = request.settings;
      }

      const docRef = doc(this.db, this.ORGANIZATIONS_COLLECTION, organizationId);
      await updateDoc(docRef, updateData);

      // 캐시 무효화
      this.clearCache(`org:${organizationId}`);
      this.clearCachePattern(`org:${organizationId}:`);

      this.log('조직 정보 업데이트 완료', { organizationId, updatedBy });

    } catch (error) {
      this.handleError(error, 'updateOrganization', { organizationId, request });
    }
  }

  // ===== 부서 관리 =====

  /**
   * 조직의 부서 목록 조회
   * @param organizationId 조직 ID
   * @param filters 필터 조건
   * @returns 부서 목록
   */
  async getDepartments(organizationId: string, filters?: DepartmentFilters): Promise<Department[]> {
    try {
      this.validateId(organizationId, '조직 ID');

      // 캐시 키 생성
      const cacheKey = `depts:${organizationId}:${JSON.stringify(filters || {})}`;
      const cached = this.getCache<Department[]>(cacheKey);
      if (cached) {
        return cached;
      }

      let q = query(
        collection(this.db, this.DEPARTMENTS_COLLECTION),
        where('organizationId', '==', organizationId),
        orderBy('level'),
        orderBy('order')
      );

      // 필터 적용
      if (filters?.active !== undefined) {
        q = query(q, where('active', '==', filters.active));
      }
      if (filters?.parentId) {
        q = query(q, where('parentId', '==', filters.parentId));
      }
      if (filters?.managerId) {
        q = query(q, where('managerId', '==', filters.managerId));
      }
      if (filters?.level !== undefined) {
        q = query(q, where('level', '==', filters.level));
      }

      const querySnapshot = await getDocs(q);
      const departments = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          organizationId: data.organizationId,
          name: data.name,
          description: data.description,
          code: data.code,
          parentId: data.parentId,
          managerId: data.managerId,
          level: data.level,
          order: data.order,
          memberCount: data.memberCount || 0,
          activeMemberCount: data.activeMemberCount || 0,
          maxMembers: data.maxMembers,
          active: data.active,
          isHeadquarter: data.isHeadquarter || false,
          location: data.location,
          budget: data.budget,
          createdAt: this.toDate(data.createdAt),
          updatedAt: this.toDate(data.updatedAt),
          createdBy: data.createdBy
        } as Department;
      });

      // 멤버 수 필터링 (클라이언트 사이드)
      let filteredDepartments = departments;
      if (filters?.minMemberCount !== undefined) {
        filteredDepartments = filteredDepartments.filter(d => d.memberCount >= filters.minMemberCount!);
      }
      if (filters?.maxMemberCount !== undefined) {
        filteredDepartments = filteredDepartments.filter(d => d.memberCount <= filters.maxMemberCount!);
      }

      // 캐시에 저장 (3분)
      this.setCache(cacheKey, filteredDepartments, 180000);

      this.log('부서 목록 조회 완료', { organizationId, count: filteredDepartments.length });
      return filteredDepartments;

    } catch (error) {
      this.handleError(error, 'getDepartments', { organizationId, filters });
    }
  }

  /**
   * 부서 생성
   * @param request 부서 생성 요청
   * @param createdBy 생성자 ID
   * @returns 생성된 부서 정보
   */
  async createDepartment(request: CreateDepartmentRequest, createdBy: string): Promise<Department> {
    try {
      this.validateRequired(request.name, '부서명');
      this.validateId(request.organizationId, '조직 ID');
      this.validateRequired(createdBy, '생성자 ID');

      // 조직 존재 확인
      await this.getOrganization(request.organizationId);

      // 부모 부서 확인 및 레벨 계산
      let level = 0;
      let order = 0;
      
      if (request.parentId) {
        const parentDept = await this.getDepartment(request.parentId);
        if (parentDept.organizationId !== request.organizationId) {
          throw new Error('상위 부서가 같은 조직에 속하지 않습니다.');
        }
        level = parentDept.level + 1;
      }

      // 같은 레벨의 부서 수를 확인하여 order 설정
      const siblingDepts = await this.getDepartments(request.organizationId, {
        parentId: request.parentId,
        level
      });
      order = siblingDepts.length;

      const now = this.now();
      const departmentData = {
        organizationId: request.organizationId,
        name: request.name,
        description: request.description,
        code: request.code,
        parentId: request.parentId,
        managerId: request.managerId,
        level,
        order,
        memberCount: 0,
        activeMemberCount: 0,
        maxMembers: request.maxMembers,
        active: true,
        isHeadquarter: level === 0 && order === 0, // 첫 번째 최상위 부서는 본사
        location: request.location,
        budget: request.budget,
        createdAt: now,
        updatedAt: now,
        createdBy
      };

      const docRef = doc(collection(this.db, this.DEPARTMENTS_COLLECTION));
      await setDoc(docRef, departmentData);

      // 캐시 무효화
      this.clearCachePattern(`depts:${request.organizationId}:`);

      this.log('부서 생성 완료', { departmentId: docRef.id, name: request.name });
      
      return {
        id: docRef.id,
        ...departmentData,
        createdAt: this.toDate(departmentData.createdAt),
        updatedAt: this.toDate(departmentData.updatedAt)
      } as Department;

    } catch (error) {
      this.handleError(error, 'createDepartment', { request });
    }
  }

  /**
   * 부서 정보 조회
   * @param departmentId 부서 ID
   * @returns 부서 정보
   */
  async getDepartment(departmentId: string): Promise<Department> {
    try {
      this.validateId(departmentId, '부서 ID');

      const docRef = doc(this.db, this.DEPARTMENTS_COLLECTION, departmentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('부서를 찾을 수 없습니다.');
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        code: data.code,
        parentId: data.parentId,
        managerId: data.managerId,
        level: data.level,
        order: data.order,
        memberCount: data.memberCount || 0,
        activeMemberCount: data.activeMemberCount || 0,
        maxMembers: data.maxMembers,
        active: data.active,
        isHeadquarter: data.isHeadquarter || false,
        location: data.location,
        budget: data.budget,
        createdAt: this.toDate(data.createdAt),
        updatedAt: this.toDate(data.updatedAt),
        createdBy: data.createdBy
      } as Department;

    } catch (error) {
      this.handleError(error, 'getDepartment', { departmentId });
    }
  }

  /**
   * 부서 정보 업데이트
   * @param departmentId 부서 ID
   * @param request 업데이트 요청
   * @param updatedBy 업데이트한 사용자 ID
   */
  async updateDepartment(
    departmentId: string, 
    request: UpdateDepartmentRequest, 
    updatedBy: string
  ): Promise<void> {
    try {
      this.validateId(departmentId, '부서 ID');
      this.validateRequired(updatedBy, '업데이트 사용자 ID');

      // 기존 부서 확인
      const department = await this.getDepartment(departmentId);

      const updateData: any = {
        updatedAt: this.now()
      };

      // 요청된 필드만 업데이트
      if (request.name) updateData.name = request.name;
      if (request.description) updateData.description = request.description;
      if (request.code) updateData.code = request.code;
      if (request.managerId) updateData.managerId = request.managerId;
      if (request.location) updateData.location = request.location;
      if (request.maxMembers !== undefined) updateData.maxMembers = request.maxMembers;
      if (request.budget !== undefined) updateData.budget = request.budget;
      if (request.active !== undefined) updateData.active = request.active;
      if (request.order !== undefined) updateData.order = request.order;

      // 부모 부서 변경 시 레벨 재계산
      if (request.parentId !== undefined) {
        if (request.parentId) {
          const parentDept = await this.getDepartment(request.parentId);
          if (parentDept.organizationId !== department.organizationId) {
            throw new Error('상위 부서가 같은 조직에 속하지 않습니다.');
          }
          updateData.parentId = request.parentId;
          updateData.level = parentDept.level + 1;
        } else {
          updateData.parentId = null;
          updateData.level = 0;
        }
      }

      const docRef = doc(this.db, this.DEPARTMENTS_COLLECTION, departmentId);
      await updateDoc(docRef, updateData);

      // 캐시 무효화
      this.clearCachePattern(`depts:${department.organizationId}:`);

      this.log('부서 정보 업데이트 완료', { departmentId, updatedBy });

    } catch (error) {
      this.handleError(error, 'updateDepartment', { departmentId, request });
    }
  }

  /**
   * 부서 삭제
   * @param departmentId 부서 ID
   * @param deletedBy 삭제한 사용자 ID
   */
  async deleteDepartment(departmentId: string, deletedBy: string): Promise<void> {
    try {
      this.validateId(departmentId, '부서 ID');
      this.validateRequired(deletedBy, '삭제 사용자 ID');

      const department = await this.getDepartment(departmentId);

      // 하위 부서 확인
      const childDepartments = await this.getDepartments(department.organizationId, {
        parentId: departmentId
      });

      if (childDepartments.length > 0) {
        throw new Error('하위 부서가 있는 부서는 삭제할 수 없습니다.');
      }

      // 멤버가 있는지 확인
      if (department.memberCount > 0) {
        throw new Error('멤버가 있는 부서는 삭제할 수 없습니다.');
      }

      const docRef = doc(this.db, this.DEPARTMENTS_COLLECTION, departmentId);
      await deleteDoc(docRef);

      // 캐시 무효화
      this.clearCachePattern(`depts:${department.organizationId}:`);

      this.log('부서 삭제 완료', { departmentId, deletedBy });

    } catch (error) {
      this.handleError(error, 'deleteDepartment', { departmentId });
    }
  }

  // ===== 조직 구조 관리 =====

  /**
   * 조직 구조 트리 조회
   * @param organizationId 조직 ID
   * @returns 조직 구조 트리
   */
  async getOrganizationStructure(organizationId: string): Promise<OrganizationTree[]> {
    try {
      this.validateId(organizationId, '조직 ID');

      const cacheKey = `org-tree:${organizationId}`;
      const cached = this.getCache<OrganizationTree[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const departments = await this.getDepartments(organizationId, { active: true });
      
      // 부서를 트리 구조로 변환
      const departmentMap = new Map<string, Department>();
      departments.forEach(dept => departmentMap.set(dept.id, dept));

      const buildTree = (parentId?: string): OrganizationTree[] => {
        return departments
          .filter(dept => dept.parentId === parentId)
          .map(dept => {
            const children = buildTree(dept.id);
            const totalMemberCount = dept.memberCount + 
              children.reduce((sum, child) => sum + child.totalMemberCount, 0);

            return {
              department: dept,
              children,
              memberCount: dept.memberCount,
              totalMemberCount
            };
          });
      };

      const tree = buildTree();

      // 캐시에 저장 (5분)
      this.setCache(cacheKey, tree, 300000);

      this.log('조직 구조 조회 완료', { organizationId, departmentCount: departments.length });
      return tree;

    } catch (error) {
      this.handleError(error, 'getOrganizationStructure', { organizationId });
    }
  }

  // ===== 통계 및 대시보드 =====

  /**
   * 조직 통계 조회
   * @param organizationId 조직 ID
   * @returns 조직 통계
   */
  async getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
    try {
      this.validateId(organizationId, '조직 ID');

      const cacheKey = `org-stats:${organizationId}`;
      const cached = this.getCache<OrganizationStats>(cacheKey);
      if (cached) {
        return cached;
      }

      // TODO: 실제 통계 데이터 수집 구현
      // 현재는 모의 데이터 반환
      const stats: OrganizationStats = {
        totalMembers: 45,
        activeMembers: 42,
        inactiveMembers: 3,
        pendingMembers: 5,
        totalMeasurements: 234,
        recentMeasurements: 28,
        averageMeasurementsPerUser: 5.2,
        riskMembers: 8,
        highRiskMembers: 2,
        mediumRiskMembers: 6,
        creditBalance: 150,
        creditUsageThisMonth: 45,
        creditUsageLastMonth: 38,
        averageCreditPerMeasurement: 1.8,
        totalDevices: 12,
        activeDevices: 10,
        availableDevices: 8,
        maintenanceDevices: 2,
        totalReports: 156,
        reportsThisMonth: 22,
        pendingReports: 3,
        averageReportGenerationTime: 2.5,
        dailyActiveUsers: 25,
        weeklyActiveUsers: 38,
        monthlyActiveUsers: 42,
        userEngagementRate: 85.5,
        departmentStats: [],
        activityByHour: [],
        activityByDay: [],
        activityByWeek: []
      };

      // 캐시에 저장 (2분)
      this.setCache(cacheKey, stats, 120000);

      this.log('조직 통계 조회 완료', { organizationId });
      return stats;

    } catch (error) {
      this.handleError(error, 'getOrganizationStats', { organizationId });
    }
  }

  /**
   * 조직 대시보드 데이터 조회
   * @param organizationId 조직 ID
   * @returns 대시보드 데이터
   */
  async getOrganizationDashboardData(organizationId: string): Promise<OrganizationDashboardData> {
    try {
      this.validateId(organizationId, '조직 ID');

      // 병렬로 데이터 수집
      const [organization, stats] = await Promise.all([
        this.getOrganization(organizationId),
        this.getOrganizationStats(organizationId)
      ]);

      // TODO: 실제 데이터 수집 구현
      const dashboardData: OrganizationDashboardData = {
        organization,
        stats,
        recentActivity: [],
        alerts: [],
        trends: [],
        topRiskMembers: [],
        departmentHealth: [],
        systemNotifications: []
      };

      this.log('대시보드 데이터 조회 완료', { organizationId });
      return dashboardData;

    } catch (error) {
      this.handleError(error, 'getOrganizationDashboardData', { organizationId });
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const organizationService = new OrganizationService();
export default organizationService; 