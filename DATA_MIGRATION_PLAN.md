# MeasurementUser 중심 데이터 구조 통합 마이그레이션 계획

## 🚨 문제 상황

### 현재 데이터 구조 문제점
1. **MeasurementUser**: 이미 정의되어 있지만 다른 컬렉션과 연결되지 않음
2. **ai_analysis_results**: PersonalInfo로 개별 저장, MeasurementUser 연결 없음
3. **measurementSessions**: MeasurementUser 연결 불명확
4. **shared_reports**: MeasurementUser 연결 불명확
5. **healthReports**: userId가 default로 설정되어 있음

## 📋 마이그레이션 단계

### Phase 1: 백업 및 현재 상태 분석 (안전장치)
```typescript
// 1-1. 모든 기존 데이터 백업
await backupCollections([
  'ai_analysis_results',
  'measurementSessions', 
  'shared_reports',
  'healthReports'
]);

// 1-2. 현재 데이터 구조 분석
await analyzeCurrentDataStructure();
```

### Phase 2: MeasurementUser 통합 서비스 구현
```typescript
// 2-1. MeasurementUser 통합 서비스 생성
export class MeasurementUserIntegrationService {
  
  // PersonalInfo → MeasurementUser 매칭/생성
  async findOrCreateMeasurementUser(
    personalInfo: PersonalInfo, 
    organizationId: string
  ): Promise<string> {
    // 이메일과 organizationId로 기존 사용자 찾기
    const existing = await measurementUserService.findByEmail(
      personalInfo.email, 
      organizationId
    );
    
    if (existing) {
      return existing.id;
    }
    
    // 새 MeasurementUser 생성
    const userData = this.convertPersonalInfoToMeasurementUser(personalInfo);
    return await measurementUserService.createMeasurementUser(userData);
  }
  
  // PersonalInfo → MeasurementUser 데이터 변환
  private convertPersonalInfoToMeasurementUser(personalInfo: PersonalInfo): CreateMeasurementUserData {
    return {
      email: personalInfo.email,
      displayName: personalInfo.name,
      age: personalInfo.birthDate ? 
        new Date().getFullYear() - personalInfo.birthDate.getFullYear() : undefined,
      gender: personalInfo.gender === 'MALE' ? 'MALE' : 
             personalInfo.gender === 'FEMALE' ? 'FEMALE' : 'OTHER',
      notes: `자동 마이그레이션: ${personalInfo.occupation || ''} ${personalInfo.department || ''}`
    };
  }
}
```

### Phase 3: AI 분석 결과 연결 수정
```typescript
// 3-1. AnalysisScreen 수정 - MeasurementUser 연결
export function AnalysisScreen({ personalInfo, measurementData, organizationId }: AnalysisScreenProps) {
  
  const startAnalysis = async () => {
    try {
      // 🔥 MeasurementUser 찾기/생성
      const integrationService = new MeasurementUserIntegrationService();
      const measurementUserId = await integrationService.findOrCreateMeasurementUser(
        personalInfo, 
        organizationId
      );
      
      // AI 분석 실행
      const analysisResult = await selectedEngine.generateReport({
        personalInfo: convertedPersonalInfo,
        measurementData
      });
      
      // 🔥 분석 결과에 measurementUserId 포함
      const analysisRecord = {
        ...analysisResult,
        measurementUserId,        // 🔑 핵심: MeasurementUser 연결
        personalInfo: convertedPersonalInfo,  // 호환성을 위해 유지
        organizationId,
        sessionId: measurementData.sessionId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Firestore에 저장
      const analysisId = await FirebaseService.addDocument('ai_analysis_results', analysisRecord);
      
      // 🔥 MeasurementUser의 reportIds 업데이트
      await measurementUserService.addReportId(measurementUserId, analysisId);
      
    } catch (error) {
      console.error('분석 실패:', error);
    }
  };
}
```

### Phase 4: 기존 데이터 마이그레이션 스크립트
```typescript
// 4-1. 기존 ai_analysis_results 마이그레이션
export class DataMigrationService {
  
  async migrateAIAnalysisResults() {
    console.log('🔄 AI 분석 결과 마이그레이션 시작...');
    
    const allResults = await FirebaseService.getDocuments('ai_analysis_results');
    const integrationService = new MeasurementUserIntegrationService();
    
    for (const result of allResults) {
      try {
        if (result.measurementUserId) {
          console.log(`✅ 이미 마이그레이션됨: ${result.id}`);
          continue;
        }
        
        // PersonalInfo에서 MeasurementUser 찾기/생성
        const personalInfo = result.personalInfo || result.rawData?.personalInfo;
        if (!personalInfo || !personalInfo.email) {
          console.warn(`⚠️ PersonalInfo 없음: ${result.id}`);
          continue;
        }
        
        const measurementUserId = await integrationService.findOrCreateMeasurementUser(
          personalInfo,
          result.organizationId || 'default'
        );
        
        // ai_analysis_results 업데이트
        await FirebaseService.updateDocument('ai_analysis_results', result.id, {
          measurementUserId,
          migratedAt: new Date()
        });
        
        // MeasurementUser의 reportIds 업데이트
        await measurementUserService.addReportId(measurementUserId, result.id);
        
        console.log(`✅ 마이그레이션 완료: ${result.id} → ${measurementUserId}`);
        
      } catch (error) {
        console.error(`❌ 마이그레이션 실패: ${result.id}`, error);
      }
    }
  }
  
  async migrateMeasurementSessions() {
    // 비슷한 로직으로 measurementSessions 마이그레이션
  }
  
  async migrateSharedReports() {
    // 비슷한 로직으로 shared_reports 마이그레이션  
  }
}
```

### Phase 5: 새로운 통합 조회 서비스
```typescript
// 5-1. MeasurementUser 중심 조회 서비스
export class MeasurementUserDataService {
  
  // 사용자의 모든 AI 분석 결과 조회
  async getAIAnalysisResults(measurementUserId: string) {
    return await FirebaseService.getDocuments('ai_analysis_results', [
      where('measurementUserId', '==', measurementUserId)
    ]);
  }
  
  // 사용자의 모든 측정 세션 조회
  async getMeasurementSessions(measurementUserId: string) {
    return await FirebaseService.getDocuments('measurementSessions', [
      where('measurementUserId', '==', measurementUserId)
    ]);
  }
  
  // 사용자의 공유 리포트 조회
  async getSharedReports(measurementUserId: string) {
    return await FirebaseService.getDocuments('shared_reports', [
      where('measurementUserId', '==', measurementUserId)
    ]);
  }
  
  // 사용자의 전체 건강 이력 조회 (통합)
  async getUserHealthHistory(measurementUserId: string) {
    const [analysisResults, sessions, sharedReports] = await Promise.all([
      this.getAIAnalysisResults(measurementUserId),
      this.getMeasurementSessions(measurementUserId),
      this.getSharedReports(measurementUserId)
    ]);
    
    return {
      measurementUser: await measurementUserService.getMeasurementUser(measurementUserId),
      analysisResults,
      sessions,
      sharedReports,
      totalMeasurements: sessions.length,
      totalReports: analysisResults.length
    };
  }
}
```

## 🛡️ 안전장치

### 1. 점진적 마이그레이션
```typescript
// 배치 단위로 안전하게 마이그레이션
const MIGRATION_BATCH_SIZE = 10;

async function safeMigration() {
  const totalCount = await getTotalRecordsCount();
  const batches = Math.ceil(totalCount / MIGRATION_BATCH_SIZE);
  
  for (let i = 0; i < batches; i++) {
    console.log(`🔄 배치 ${i + 1}/${batches} 처리 중...`);
    
    try {
      await migrateBatch(i * MIGRATION_BATCH_SIZE, MIGRATION_BATCH_SIZE);
      await delay(1000); // 1초 대기로 Firestore 부하 방지
    } catch (error) {
      console.error(`❌ 배치 ${i + 1} 실패:`, error);
      // 실패한 배치는 별도 로그에 기록하여 나중에 재시도
      await logFailedBatch(i, error);
    }
  }
}
```

### 2. 롤백 기능
```typescript
async function rollbackMigration() {
  console.log('🔙 마이그레이션 롤백 시작...');
  
  // 백업에서 원본 데이터 복원
  await restoreFromBackup([
    'ai_analysis_results',
    'measurementSessions',
    'shared_reports'
  ]);
  
  // 마이그레이션 중 생성된 MeasurementUser 제거 (필요시)
  await cleanupMigrationUsers();
}
```

### 3. 검증 스크립트
```typescript
async function validateMigration() {
  console.log('🔍 마이그레이션 검증 시작...');
  
  // 1. 모든 ai_analysis_results에 measurementUserId가 있는지 확인
  const resultsWithoutUserId = await FirebaseService.getDocuments('ai_analysis_results', [
    where('measurementUserId', '==', null)
  ]);
  
  if (resultsWithoutUserId.length > 0) {
    console.error(`❌ measurementUserId가 없는 결과: ${resultsWithoutUserId.length}개`);
    return false;
  }
  
  // 2. MeasurementUser의 reportIds와 실제 리포트 수 일치 확인
  const allUsers = await measurementUserService.getMeasurementUsers();
  for (const user of allUsers) {
    const actualReports = await FirebaseService.getDocuments('ai_analysis_results', [
      where('measurementUserId', '==', user.id)
    ]);
    
    if (user.reportIds.length !== actualReports.length) {
      console.error(`❌ 사용자 ${user.id}의 reportIds 불일치`);
      return false;
    }
  }
  
  console.log('✅ 마이그레이션 검증 성공');
  return true;
}
```

## 📅 실행 계획

### 1단계: 개발 환경에서 테스트 (1일)
- 백업/복원 스크립트 테스트
- 마이그레이션 로직 검증
- 롤백 기능 테스트

### 2단계: 스테이징 환경 마이그레이션 (1일)  
- 실제 데이터로 마이그레이션 테스트
- 성능 최적화
- 검증 스크립트 실행

### 3단계: 프로덕션 마이그레이션 (1일)
- 서비스 점검 시간에 실행
- 실시간 모니터링
- 즉시 롤백 준비

## 🔄 호환성 유지

마이그레이션 중에도 기존 코드가 작동하도록:

```typescript
// 임시 호환성 함수
export function getPersonalInfoFromAnySource(record: any): PersonalInfo | null {
  // 1순위: 새로운 measurementUserId 기반 조회
  if (record.measurementUserId) {
    const user = await measurementUserService.getMeasurementUser(record.measurementUserId);
    return convertMeasurementUserToPersonalInfo(user);
  }
  
  // 2순위: 기존 personalInfo 필드 사용 (호환성)
  return record.personalInfo || record.rawData?.personalInfo || null;
}
```

이 마이그레이션 계획을 실행하시겠습니까? [[memory:3144075]] 각 단계별로 git commit을 하면서 진행하겠습니다. 