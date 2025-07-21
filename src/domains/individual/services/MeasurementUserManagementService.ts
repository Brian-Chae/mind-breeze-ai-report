/**
 * 측정 대상자(MEASUREMENT_USER) 관리 서비스
 * 
 * ORGANIZATION_ADMIN과 ORGANIZATION_MEMBER가 측정 대상자를 등록, 관리하는 기능 제공
 * - ORGANIZATION_ADMIN: 모든 측정 대상자 관리 (전체 접근)
 * - ORGANIZATION_MEMBER: 자신이 등록한 측정 대상자만 관리 (제한된 접근)
 */

import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@core/services/firebase';
import enterpriseAuthService from '@domains/organization/services/EnterpriseAuthService';
import { createMeasurementAccessUrl } from '@/core/utils';

export interface MeasurementUser {
  id: string;
  email: string;
  displayName: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  address?: string;
  
  // 조직 관련
  organizationId: string;
  createdByUserId: string;        // 등록한 운영자 ID
  createdByUserName: string;      // 등록한 운영자 이름
  
  // 측정 관련
  measurementCount: number;       // 총 측정 횟수
  lastMeasurementDate?: Date;     // 마지막 측정 일시
  nextScheduledDate?: Date;       // 다음 예정 측정 일시
  
  // 리포트 관련
  reportIds: string[];            // 생성된 리포트 ID 목록
  lastReportDate?: Date;         // 마지막 리포트 생성 일시
  
  // 상태
  isActive: boolean;             // 활성 상태
  status: 'REGISTERED' | 'MEASURING' | 'COMPLETED' | 'INACTIVE';
  
  // 토큰 관련 (MEASUREMENT_SUBJECT로 접속할 때)
  accessToken?: string;
  tokenExpiresAt?: Date;
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  notes?: string;               // 특이사항 메모
}

export interface CreateMeasurementUserData {
  email: string;
  displayName: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  address?: string;
  notes?: string;
  nextScheduledDate?: Date;
}

export interface MeasurementUserFilter {
  organizationId?: string;
  createdByUserId?: string;      // ORGANIZATION_MEMBER의 경우 자신이 등록한 것만
  status?: string;
  isActive?: boolean;
  searchTerm?: string;          // 이름, 이메일 검색
}

export interface MeasurementUserStats {
  totalCount: number;
  activeCount: number;
  measuringCount: number;
  completedCount: number;
  thisMonthNewUsers: number;
  thisMonthMeasurements: number;
  averageMeasurementsPerUser: number;
}

class MeasurementUserManagementService {
  private collectionName = 'measurementUsers';

  /**
   * 새로운 측정 대상자 등록
   */
  async createMeasurementUser(data: CreateMeasurementUserData): Promise<MeasurementUser> {
    try {
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      const organization = enterpriseAuthService.getCurrentContext().organization;
      
      if (!currentUser || !organization) {
        throw new Error('로그인이 필요합니다.');
      }

      // 권한 확인
      if (currentUser.userType !== 'ORGANIZATION_ADMIN' && currentUser.userType !== 'SYSTEM_ADMIN' && !enterpriseAuthService.hasPermission('measurement_users.create')) {
        throw new Error('측정 대상자 등록 권한이 없습니다.');
      }

      // 이메일 중복 확인
      const existingUser = await this.findByEmail(data.email, organization.id);
      if (existingUser) {
        throw new Error('이미 등록된 이메일입니다.');
      }

      // 토큰 생성
      const accessToken = this.generateAccessToken();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 90); // 90일 유효

      const now = new Date();
      const measurementUserData = {
        email: data.email,
        displayName: data.displayName,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        address: data.address,
        
        organizationId: organization.id,
        createdByUserId: currentUser.id,
        createdByUserName: currentUser.displayName,
        
        measurementCount: 0,
        reportIds: [],
        
        isActive: true,
        status: 'REGISTERED' as const,
        
        accessToken,
        tokenExpiresAt: Timestamp.fromDate(tokenExpiresAt),
        
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        notes: data.notes || '',
        
        ...(data.nextScheduledDate && {
          nextScheduledDate: Timestamp.fromDate(data.nextScheduledDate)
        })
      };

      const docRef = await addDoc(collection(db, this.collectionName), measurementUserData);
      
      console.log('✅ 측정 대상자 등록 완료:', data.displayName);
      
      return {
        id: docRef.id,
        ...data,
        organizationId: organization.id,
        createdByUserId: currentUser.id,
        createdByUserName: currentUser.displayName,
        measurementCount: 0,
        reportIds: [],
        isActive: true,
        status: 'REGISTERED',
        accessToken,
        tokenExpiresAt,
        createdAt: now,
        updatedAt: now
      } as MeasurementUser;

    } catch (error) {
      console.error('❌ 측정 대상자 등록 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 대상자 목록 조회 (권한별 필터링)
   */
  async getMeasurementUsers(filter: MeasurementUserFilter = {}): Promise<MeasurementUser[]> {
    try {
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      const organization = enterpriseAuthService.getCurrentContext().organization;
      
      if (!currentUser || !organization) {
        throw new Error('로그인이 필요합니다.');
      }

      let queryConstraints = [
        where('organizationId', '==', organization.id)
      ];

      // 권한에 따른 필터링
      if (currentUser.userType === 'ORGANIZATION_ADMIN' || currentUser.userType === 'SYSTEM_ADMIN' || enterpriseAuthService.hasPermission('measurement_users.view.all')) {
        // ORGANIZATION_ADMIN/SYSTEM_ADMIN: 모든 데이터 접근 가능
      } else if (enterpriseAuthService.hasPermission('measurement_users.view.own')) {
        // ORGANIZATION_MEMBER: 자신이 등록한 것만
        queryConstraints.push(where('createdByUserId', '==', currentUser.id));
      } else {
        throw new Error('측정 대상자 조회 권한이 없습니다.');
      }

      // 추가 필터링
      if (filter.createdByUserId) {
        queryConstraints.push(where('createdByUserId', '==', filter.createdByUserId));
      }
      
      if (filter.status) {
        queryConstraints.push(where('status', '==', filter.status));
      }
      
      if (filter.isActive !== undefined) {
        queryConstraints.push(where('isActive', '==', filter.isActive));
      }

      // 쿼리 생성 (where 조건들만 먼저)
      const whereConstraints = queryConstraints;
      const q = query(
        collection(db, this.collectionName), 
        ...whereConstraints,
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      let users: MeasurementUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastMeasurementDate: doc.data().lastMeasurementDate?.toDate(),
        nextScheduledDate: doc.data().nextScheduledDate?.toDate(),
        lastReportDate: doc.data().lastReportDate?.toDate(),
        tokenExpiresAt: doc.data().tokenExpiresAt?.toDate()
      })) as MeasurementUser[];

      // 클라이언트 사이드 텍스트 검색
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        users = users.filter(user => 
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }

      return users;

    } catch (error) {
      console.error('❌ 측정 대상자 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 대상자 상세 조회
   */
  async getMeasurementUser(userId: string): Promise<MeasurementUser | null> {
    try {
      const docRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const userData = docSnap.data();
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      
      // 권한 확인
      if (currentUser?.userType !== 'ORGANIZATION_ADMIN' && currentUser?.userType !== 'SYSTEM_ADMIN' && 
          !enterpriseAuthService.hasPermission('measurement_users.view.all') && 
          userData.createdByUserId !== currentUser?.id) {
        throw new Error('해당 측정 대상자에 대한 접근 권한이 없습니다.');
      }

      return {
        id: docSnap.id,
        ...userData,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
        lastMeasurementDate: userData.lastMeasurementDate?.toDate(),
        nextScheduledDate: userData.nextScheduledDate?.toDate(),
        lastReportDate: userData.lastReportDate?.toDate(),
        tokenExpiresAt: userData.tokenExpiresAt?.toDate()
      } as MeasurementUser;

    } catch (error) {
      console.error('❌ 측정 대상자 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 대상자 정보 수정
   */
  async updateMeasurementUser(userId: string, updates: Partial<CreateMeasurementUserData>): Promise<void> {
    try {
      const existing = await this.getMeasurementUser(userId);
      if (!existing) {
        throw new Error('측정 대상자를 찾을 수 없습니다.');
      }

      // 권한 확인
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      const hasEditAll = currentUser?.userType === 'ORGANIZATION_ADMIN' || currentUser?.userType === 'SYSTEM_ADMIN' || enterpriseAuthService.hasPermission('measurement_users.edit.all');
      const hasEditOwn = enterpriseAuthService.hasPermission('measurement_users.edit.own');
      
      if (!hasEditAll && !(hasEditOwn && existing.createdByUserId === currentUser?.id)) {
        throw new Error('수정 권한이 없습니다.');
      }

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (updates.nextScheduledDate) {
        updateData.nextScheduledDate = Timestamp.fromDate(updates.nextScheduledDate);
      }

      await updateDoc(doc(db, this.collectionName, userId), updateData);
      
      console.log('✅ 측정 대상자 정보 수정 완료:', userId);

    } catch (error) {
      console.error('❌ 측정 대상자 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 대상자 삭제
   */
  async deleteMeasurementUser(userId: string): Promise<void> {
    try {
      const existing = await this.getMeasurementUser(userId);
      if (!existing) {
        throw new Error('측정 대상자를 찾을 수 없습니다.');
      }

      // 권한 확인
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      const hasDeleteAll = currentUser?.userType === 'ORGANIZATION_ADMIN' || currentUser?.userType === 'SYSTEM_ADMIN' || enterpriseAuthService.hasPermission('measurement_users.delete.all');
      const hasDeleteOwn = enterpriseAuthService.hasPermission('measurement_users.delete.own');
      
      if (!hasDeleteAll && !(hasDeleteOwn && existing.createdByUserId === currentUser?.id)) {
        throw new Error('삭제 권한이 없습니다.');
      }

      await deleteDoc(doc(db, this.collectionName, userId));
      
      console.log('✅ 측정 대상자 삭제 완료:', userId);

    } catch (error) {
      console.error('❌ 측정 대상자 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 대상자 통계 조회
   */
  async getMeasurementUserStats(): Promise<MeasurementUserStats> {
    try {
      const users = await this.getMeasurementUsers();
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        totalCount: users.length,
        activeCount: users.filter(u => u.isActive).length,
        measuringCount: users.filter(u => u.status === 'MEASURING').length,
        completedCount: users.filter(u => u.status === 'COMPLETED').length,
        thisMonthNewUsers: users.filter(u => u.createdAt >= thisMonth).length,
        thisMonthMeasurements: users.reduce((sum, u) => {
          if (u.lastMeasurementDate && u.lastMeasurementDate >= thisMonth) {
            return sum + u.measurementCount;
          }
          return sum;
        }, 0),
        averageMeasurementsPerUser: users.length > 0 
          ? users.reduce((sum, u) => sum + u.measurementCount, 0) / users.length 
          : 0
      };

      return stats;

    } catch (error) {
      console.error('❌ 측정 대상자 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 이메일로 측정 대상자 검색
   */
  private async findByEmail(email: string, organizationId: string): Promise<MeasurementUser | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email),
        where('organizationId', '==', organizationId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastMeasurementDate: doc.data().lastMeasurementDate?.toDate(),
        nextScheduledDate: doc.data().nextScheduledDate?.toDate(),
        lastReportDate: doc.data().lastReportDate?.toDate(),
        tokenExpiresAt: doc.data().tokenExpiresAt?.toDate()
      } as MeasurementUser;

    } catch (error) {
      console.error('❌ 이메일로 측정 대상자 검색 실패:', error);
      return null;
    }
  }

  /**
   * 접속 토큰 생성
   */
  private generateAccessToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  /**
   * 측정 완료 처리
   */
  async recordMeasurement(userId: string, reportId?: string): Promise<void> {
    try {
      const updateData: any = {
        measurementCount: (await this.getMeasurementUser(userId))!.measurementCount + 1,
        lastMeasurementDate: Timestamp.fromDate(new Date()),
        status: 'MEASURING',
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (reportId) {
        const existing = await this.getMeasurementUser(userId);
        updateData.reportIds = [...(existing?.reportIds || []), reportId];
        updateData.lastReportDate = Timestamp.fromDate(new Date());
      }

      await updateDoc(doc(db, this.collectionName, userId), updateData);
      
      console.log('✅ 측정 기록 완료:', userId);

    } catch (error) {
      console.error('❌ 측정 기록 실패:', error);
      throw error;
    }
  }

  /**
   * 리포트 ID를 사용자의 reportIds에 추가
   */
  async addReportId(userId: string, reportId: string): Promise<void> {
    try {
      const existing = await this.getMeasurementUser(userId);
      if (!existing) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const updatedReportIds = [...(existing.reportIds || [])];
      if (!updatedReportIds.includes(reportId)) {
        updatedReportIds.push(reportId);
      }

      const updateData = {
        reportIds: updatedReportIds,
        lastReportDate: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(doc(db, this.collectionName, userId), updateData);
      
      console.log('✅ 리포트 ID 추가 완료:', { userId, reportId });

    } catch (error) {
      console.error('❌ 리포트 ID 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 접속 링크 생성
   */
  generateAccessLink(accessToken: string): string {
    return createMeasurementAccessUrl(accessToken);
  }

  /**
   * CSV 데이터 검증
   */
  async validateCSVData(csvData: string): Promise<CSVValidationResult> {
    try {
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV 파일이 비어있거나 헤더만 있습니다.');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['displayName', 'email', 'phone'];
      const optionalHeaders = ['age', 'gender', 'notes', 'nextScheduledDate'];
      
      // 필수 헤더 확인
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`필수 헤더가 누락되었습니다: ${missingHeaders.join(', ')}`);
      }

      const validatedRows: CSVUserData[] = [];
      const errors: CSVError[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          errors.push({
            row: i + 1,
            field: '',
            message: '컬럼 수가 헤더와 일치하지 않습니다.'
          });
          continue;
        }

        const rowData: CSVUserData = { row: i + 1 };
        
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = values[j];

          // 필수 필드 검증
          if (requiredHeaders.includes(header) && !value) {
            errors.push({
              row: i + 1,
              field: header,
              message: `${header}는 필수 항목입니다.`
            });
            continue;
          }

          // 필드별 검증
          switch (header) {
            case 'displayName':
              if (value.length < 2) {
                errors.push({
                  row: i + 1,
                  field: header,
                  message: '이름은 2글자 이상이어야 합니다.'
                });
              } else {
                rowData.displayName = value;
              }
              break;

            case 'email':
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                errors.push({
                  row: i + 1,
                  field: header,
                  message: '올바른 이메일 형식이 아닙니다.'
                });
              } else {
                rowData.email = value;
              }
              break;

            case 'phone':
              const phoneRegex = /^[0-9-+\s()]+$/;
              if (!phoneRegex.test(value)) {
                errors.push({
                  row: i + 1,
                  field: header,
                  message: '올바른 전화번호 형식이 아닙니다.'
                });
              } else {
                rowData.phone = value;
              }
              break;

            case 'age':
              if (value) {
                const age = parseInt(value);
                if (isNaN(age) || age < 1 || age > 150) {
                  errors.push({
                    row: i + 1,
                    field: header,
                    message: '나이는 1-150 사이의 숫자여야 합니다.'
                  });
                } else {
                  rowData.age = age;
                }
              }
              break;

            case 'gender':
              if (value && !['MALE', 'FEMALE', 'OTHER'].includes(value.toUpperCase())) {
                errors.push({
                  row: i + 1,
                  field: header,
                  message: '성별은 MALE, FEMALE, OTHER 중 하나여야 합니다.'
                });
              } else if (value) {
                rowData.gender = value.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER';
              }
              break;

            case 'notes':
              if (value) rowData.notes = value;
              break;

            case 'nextScheduledDate':
              if (value) {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                  errors.push({
                    row: i + 1,
                    field: header,
                    message: '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD).'
                  });
                } else {
                  rowData.nextScheduledDate = date;
                }
              }
              break;
          }
        }

        if (rowData.displayName && rowData.email && rowData.phone) {
          validatedRows.push(rowData);
        }
      }

      return {
        isValid: errors.length === 0,
        totalRows: lines.length - 1,
        validRows: validatedRows,
        errors
      };

    } catch (error) {
      console.error('❌ CSV 검증 실패:', error);
      throw error;
    }
  }

  /**
   * 대량 사용자 등록 (CSV)
   */
  async bulkCreateMeasurementUsers(csvData: string): Promise<BulkCreateResult> {
    try {
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      const organization = enterpriseAuthService.getCurrentContext().organization;
      
      if (!currentUser || !organization) {
        throw new Error('로그인이 필요합니다.');
      }

      // 권한 확인
      if (currentUser.userType !== 'ORGANIZATION_ADMIN' && currentUser.userType !== 'SYSTEM_ADMIN' && !enterpriseAuthService.hasPermission('measurement_users.create')) {
        throw new Error('측정 대상자 등록 권한이 없습니다.');
      }

      // CSV 데이터 검증
      const validationResult = await this.validateCSVData(csvData);
      if (!validationResult.isValid) {
        return {
          success: false,
          totalRows: validationResult.totalRows,
          successfulRows: [],
          failedRows: validationResult.errors.map(err => ({
            row: err.row,
            data: { row: err.row },
            error: `${err.field}: ${err.message}`
          })),
          errors: validationResult.errors
        };
      }

      const results: BulkCreateResult = {
        success: true,
        totalRows: validationResult.totalRows,
        successfulRows: [],
        failedRows: [],
        errors: []
      };

      // 배치 처리로 대량 등록 (한 번에 10개씩)
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < validationResult.validRows.length; i += batchSize) {
        batches.push(validationResult.validRows.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (userData) => {
          try {
            // 중복 확인
            const existingUser = await this.findByEmail(userData.email!, organization.id);
            if (existingUser) {
              results.failedRows.push({
                row: userData.row,
                data: userData,
                error: '이미 등록된 이메일입니다.'
              });
              return;
            }

            // 사용자 생성
            const createData: CreateMeasurementUserData = {
              email: userData.email!,
              displayName: userData.displayName!,
              age: userData.age,
              gender: userData.gender,
              phone: userData.phone,
              notes: userData.notes,
              nextScheduledDate: userData.nextScheduledDate
            };

            const newUser = await this.createMeasurementUser(createData);
            
            results.successfulRows.push({
              row: userData.row,
              data: userData,
              userId: newUser.id,
              user: newUser
            });

            console.log(`✅ 사용자 등록 완료 (행 ${userData.row}):`, userData.displayName);

          } catch (error) {
            const errorMessage = (error as Error).message;
            results.failedRows.push({
              row: userData.row,
              data: userData,
              error: errorMessage
            });
            
            console.error(`❌ 사용자 등록 실패 (행 ${userData.row}):`, errorMessage);
          }
        });

        // 배치 실행
        await Promise.all(batchPromises);
        
        // 다음 배치 전 잠시 대기 (Rate limiting 방지)
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // 결과 정리
      results.success = results.failedRows.length === 0;
      
      console.log(`✅ 대량 등록 완료: 성공 ${results.successfulRows.length}개, 실패 ${results.failedRows.length}개`);
      
      return results;

    } catch (error) {
      console.error('❌ 대량 사용자 등록 실패:', error);
      throw error;
    }
  }

  /**
   * CSV 템플릿 생성
   */
  generateCSVTemplate(): string {
    const headers = [
      'displayName',
      'email', 
      'phone',
      'age',
      'gender',
      'notes',
      'nextScheduledDate'
    ];
    
    const exampleRow = [
      '홍길동',
      'hong@company.com',
      '010-1234-5678',
      '30',
      'MALE',
      '특이사항 없음',
      '2024-02-01'
    ];

    return headers.join(',') + '\n' + exampleRow.join(',');
  }
}

// 인터페이스 정의
export interface CSVUserData {
  row: number;
  displayName?: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  notes?: string;
  nextScheduledDate?: Date;
}

export interface CSVError {
  row: number;
  field: string;
  message: string;
}

export interface CSVValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: CSVUserData[];
  errors: CSVError[];
}

export interface BulkCreateResult {
  success: boolean;
  totalRows: number;
  successfulRows: {
    row: number;
    data: CSVUserData;
    userId: string;
    user: MeasurementUser;
  }[];
  failedRows: {
    row: number;
    data: CSVUserData;
    error: string;
  }[];
  errors: CSVError[];
}

const measurementUserManagementService = new MeasurementUserManagementService();
export default measurementUserManagementService; 