import { PersonalInfo } from '@domains/ai-report/components/AIHealthReportApp';
import measurementUserManagementService, { 
  MeasurementUser, 
  CreateMeasurementUserData 
} from './MeasurementUserManagementService';

/**
 * PersonalInfo와 MeasurementUser를 연결하는 통합 서비스
 * AI 리포트 생성 시 PersonalInfo를 MeasurementUser로 변환/매칭
 */
export class MeasurementUserIntegrationService {
  
  /**
   * PersonalInfo를 기반으로 MeasurementUser를 찾거나 생성
   */
  async findOrCreateMeasurementUser(
    personalInfo: PersonalInfo, 
    organizationId?: string
  ): Promise<string> {
    try {
      console.log('🔍 MeasurementUser 찾기/생성 시작:', { 
        email: personalInfo.email, 
        name: personalInfo.name,
        organizationId 
      });

      // organizationId 기본값 설정
      const finalOrganizationId = organizationId || 'default';

      // 이메일과 organizationId로 기존 사용자 찾기
      const existing = await this.findExistingMeasurementUser(
        personalInfo.email || '', 
        finalOrganizationId
      );
      
      if (existing) {
        console.log('✅ 기존 MeasurementUser 발견:', existing.id);
        return existing.id;
      }
      
      // 새 MeasurementUser 생성
      console.log('➕ 새 MeasurementUser 생성 중...');
      const userData = this.convertPersonalInfoToMeasurementUser(personalInfo);
      const newUser = await measurementUserManagementService.createMeasurementUser(userData);
      
      console.log('✅ 새 MeasurementUser 생성 완료:', newUser.id);
      return newUser.id;
      
    } catch (error) {
      console.error('❌ MeasurementUser 찾기/생성 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(`MeasurementUser 처리 실패: ${errorMessage}`);
    }
  }

  /**
   * 기존 MeasurementUser 찾기
   */
  private async findExistingMeasurementUser(
    email: string, 
    organizationId: string
  ): Promise<MeasurementUser | null> {
    try {
      // email로 사용자 검색 (measurementUserManagementService의 getMeasurementUsers 사용)
      const users = await measurementUserManagementService.getMeasurementUsers({
        organizationId,
        searchTerm: email
      });
      
      // 정확한 이메일 매칭
      const exactMatch = users.find(user => 
        user.email.toLowerCase() === email.toLowerCase()
      );
      
      return exactMatch || null;
    } catch (error) {
      console.warn('⚠️ 기존 사용자 찾기 실패:', error);
      return null;
    }
  }

  /**
   * PersonalInfo를 MeasurementUser 생성 데이터로 변환
   */
  private convertPersonalInfoToMeasurementUser(personalInfo: PersonalInfo): CreateMeasurementUserData {
    const age = personalInfo.birthDate ? 
      new Date().getFullYear() - personalInfo.birthDate.getFullYear() : undefined;

    const gender = this.convertGender(personalInfo.gender);
    
    const notes = this.buildNotes(personalInfo);

    return {
      email: personalInfo.email || '',
      displayName: personalInfo.name || '익명',
      age,
      gender,
      notes
    };
  }

  /**
   * 성별 변환 (PersonalInfo → MeasurementUser)
   */
  private convertGender(gender?: string): 'MALE' | 'FEMALE' | 'OTHER' | undefined {
    if (!gender) return undefined;
    
    const normalizedGender = gender.toUpperCase();
    if (normalizedGender === 'MALE' || normalizedGender === 'M') return 'MALE';
    if (normalizedGender === 'FEMALE' || normalizedGender === 'F') return 'FEMALE';
    return 'OTHER';
  }

  /**
   * PersonalInfo에서 메모 필드 생성
   */
  private buildNotes(personalInfo: PersonalInfo): string {
    const parts = ['AI 리포트 자동 생성'];
    
    if (personalInfo.occupation) {
      parts.push(`직업: ${personalInfo.occupation}`);
    }
    
    if (personalInfo.department) {
      parts.push(`부서: ${personalInfo.department}`);
    }
    
    return parts.join(' | ');
  }

  /**
   * MeasurementUser를 PersonalInfo로 변환 (호환성)
   */
  async convertMeasurementUserToPersonalInfo(measurementUser: MeasurementUser): Promise<PersonalInfo> {
    const birthDate = measurementUser.age ? 
      new Date(new Date().getFullYear() - measurementUser.age, 0, 1) : undefined;

    return {
      name: measurementUser.displayName,
      email: measurementUser.email,
      gender: measurementUser.gender || 'OTHER',
      birthDate: birthDate,
      occupation: this.extractOccupationFromNotes(measurementUser.notes),
      department: this.extractDepartmentFromNotes(measurementUser.notes)
    };
  }

  /**
   * MeasurementUser notes에서 직업 정보 추출
   */
  private extractOccupationFromNotes(notes?: string): string | undefined {
    if (!notes) return undefined;
    
    const occupationMatch = notes.match(/직업:\s*([^|]+)/);
    return occupationMatch ? occupationMatch[1].trim() : undefined;
  }

  /**
   * MeasurementUser notes에서 부서 정보 추출
   */
  private extractDepartmentFromNotes(notes?: string): string | undefined {
    if (!notes) return undefined;
    
    const departmentMatch = notes.match(/부서:\s*([^|]+)/);
    return departmentMatch ? departmentMatch[1].trim() : undefined;
  }

  /**
   * PersonalInfo와 MeasurementUser ID가 일치하는지 확인
   */
  async validatePersonalInfoMatch(
    personalInfo: PersonalInfo, 
    measurementUserId: string
  ): Promise<boolean> {
    try {
      const measurementUser = await measurementUserManagementService.getMeasurementUser(measurementUserId);
      if (!measurementUser || !personalInfo.email) return false;

      // 이메일 기준으로 일치 확인
      return measurementUser.email.toLowerCase() === personalInfo.email.toLowerCase();
    } catch (error) {
      console.error('❌ PersonalInfo 매칭 검증 실패:', error);
      return false;
    }
  }

  /**
   * 호환성을 위한 PersonalInfo 추출 함수
   */
  async getPersonalInfoFromAnySource(record: any): Promise<PersonalInfo | null> {
    try {
      // 1순위: measurementUserId 기반 조회
      if (record.measurementUserId) {
        const measurementUser = await measurementUserManagementService.getMeasurementUser(record.measurementUserId);
        if (measurementUser) {
          return await this.convertMeasurementUserToPersonalInfo(measurementUser);
        }
      }
      
      // 2순위: 기존 personalInfo 필드 사용 (호환성)
      const personalInfo = record.personalInfo || record.rawData?.personalInfo;
      if (personalInfo && personalInfo.email) {
        return personalInfo;
      }
      
      console.warn('⚠️ PersonalInfo를 찾을 수 없음:', record.id);
      return null;
      
    } catch (error) {
      console.error('❌ PersonalInfo 추출 실패:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스 생성
const measurementUserIntegrationService = new MeasurementUserIntegrationService();
export default measurementUserIntegrationService; 