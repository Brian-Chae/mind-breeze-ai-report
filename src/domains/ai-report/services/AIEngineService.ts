/**
 * AI 엔진 관리 및 실행 서비스
 * AI 엔진 등록, 실행, 결과 처리를 담당
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { BaseService } from '../../../core/services/BaseService';
import { 
  AIEngine, 
  MeasurementData, 
  AIAnalysisResult, 
  EngineExecutionContext,
  AIReportError
} from '../types';

// AI 엔진 인터페이스
interface AIEngineExecutor {
  execute(context: EngineExecutionContext): Promise<AIAnalysisResult>;
  validate(measurementData: MeasurementData): boolean;
}

// AI 엔진 레지스트리
class AIEngineRegistry {
  private static engines: Map<string, AIEngineExecutor> = new Map();
  
  static register(engineId: string, executor: AIEngineExecutor): void {
    this.engines.set(engineId, executor);
  }
  
  static get(engineId: string): AIEngineExecutor | undefined {
    return this.engines.get(engineId);
  }
  
  static getAll(): string[] {
    return Array.from(this.engines.keys());
  }
}

export class AIEngineService extends BaseService {
  private static readonly COLLECTION_NAME = 'aiEngines';
  
  /**
   * 사용 가능한 AI 엔진 목록 조회
   */
  async getAvailableEngines(
    organizationId?: string,
    userType?: string
  ): Promise<AIEngine[]> {
    try {
      const constraints = [
        where('status', '==', 'ACTIVE'),
        orderBy('name', 'asc')
      ];
      
      const q = query(
        collection(this.db, AIEngineService.COLLECTION_NAME),
        ...constraints
      );
      
      const snapshot = await getDocs(q);
      const engines = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        lastUsedAt: doc.data().lastUsedAt?.toDate()
      })) as AIEngine[];
      
      // 접근 권한 필터링
      return engines.filter(engine => 
        this.hasAccessToEngine(engine, organizationId, userType)
      );
      
    } catch (error: any) {
      console.error('Failed to get available engines:', error);
      throw new Error(`Failed to get available engines: ${error.message}`);
    }
  }
  
  /**
   * 특정 AI 엔진 조회
   */
  async getEngine(engineId: string): Promise<AIEngine | null> {
    try {
      const docSnap = await getDoc(
        doc(this.db, AIEngineService.COLLECTION_NAME, engineId)
      );
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        lastUsedAt: data.lastUsedAt?.toDate()
      } as AIEngine;
      
    } catch (error: any) {
      console.error('Failed to get engine:', error);
      throw new Error(`Failed to get engine: ${error.message}`);
    }
  }
  
  /**
   * AI 엔진 실행
   */
  async executeEngine(
    engineId: string,
    measurementData: MeasurementData,
    customSettings?: any,
    organizationConfig?: any
  ): Promise<AIAnalysisResult> {
    try {
      // 엔진 정보 조회
      const engine = await this.getEngine(engineId);
      if (!engine) {
        throw new Error(`Engine not found: ${engineId}`);
      }
      
      // 엔진 상태 확인
      if (engine.status !== 'ACTIVE') {
        throw new Error(`Engine is not active: ${engine.status}`);
      }
      
      // 데이터 품질 검증
      if (!this.validateDataQuality(measurementData, engine)) {
        throw new Error('Measurement data does not meet engine requirements');
      }
      
      // 실행 컨텍스트 생성
      const context: EngineExecutionContext = {
        measurementData,
        engine,
        customSettings,
        organizationConfig
      };
      
      // 엔진 실행
      const executor = AIEngineRegistry.get(engineId);
      if (!executor) {
        throw new Error(`Engine executor not registered: ${engineId}`);
      }
      
      const startTime = Date.now();
      const result = await executor.execute(context);
      const executionTime = Date.now() - startTime;
      
      // 결과 검증
      this.validateEngineResult(result, engine);
      
      console.log(`Engine ${engineId} executed successfully in ${executionTime}ms`);
      
      // 사용 통계 업데이트 (백그라운드)
      this.updateEngineUsageStats(engineId, executionTime, true).catch(console.error);
      
      return result;
      
    } catch (error: any) {
      console.error(`Engine execution failed for ${engineId}:`, error);
      
      // 실패 통계 업데이트 (백그라운드)
      this.updateEngineUsageStats(engineId, 0, false).catch(console.error);
      
      throw new Error(`Engine execution failed: ${error.message}`);
    }
  }
  
  /**
   * 엔진별 프롬프트 생성
   */
  generatePrompt(
    engine: AIEngine,
    measurementData: MeasurementData,
    customSettings?: any
  ): { systemPrompt: string; userPrompt: string } {
    try {
      const template = engine.promptTemplate;
      
      // 변수 데이터 준비
      const variables = this.preparePromptVariables(measurementData);
      
      // 커스텀 설정 적용
      if (customSettings?.promptOverrides) {
        Object.assign(variables, customSettings.promptOverrides);
      }
      
      // 사용자 프롬프트 템플릿 처리
      let userPrompt = template.userPromptTemplate;
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        userPrompt = userPrompt.replace(
          new RegExp(placeholder, 'g'), 
          JSON.stringify(value, null, 2)
        );
      }
      
      return {
        systemPrompt: template.systemPrompt,
        userPrompt
      };
      
    } catch (error: any) {
      console.error('Failed to generate prompt:', error);
      throw new Error(`Failed to generate prompt: ${error.message}`);
    }
  }
  
  /**
   * 엔진 결과 파싱 및 검증
   */
  parseEngineResult(
    rawOutput: any,
    engine: AIEngine
  ): AIAnalysisResult {
    try {
      // 출력 형식에 따른 파싱
      let parsedOutput;
      switch (engine.outputFormat.type) {
        case 'JSON':
          parsedOutput = typeof rawOutput === 'string' 
            ? JSON.parse(rawOutput) 
            : rawOutput;
          break;
        case 'MARKDOWN':
          // 마크다운 파싱 로직 (필요 시 구현)
          parsedOutput = { content: rawOutput };
          break;
        default:
          parsedOutput = rawOutput;
      }
      
      // 스키마 검증
      if (engine.outputFormat.schema) {
        this.validateAgainstSchema(parsedOutput, engine.outputFormat.schema);
      }
      
      // 표준 형식으로 변환
      const result: AIAnalysisResult = {
        rawOutput,
        parsedResult: {
          overallScore: parsedOutput.overallScore || 0,
          riskLevel: parsedOutput.riskLevel || 'LOW',
          stressAnalysis: parsedOutput.stressAnalysis,
          focusAnalysis: parsedOutput.focusAnalysis,
          healthRiskAnalysis: parsedOutput.healthRiskAnalysis,
          recommendations: parsedOutput.recommendations || [],
          warnings: parsedOutput.warnings || [],
          confidence: parsedOutput.confidence || 0.8,
          analysisVersion: engine.version
        }
      };
      
      return result;
      
    } catch (error: any) {
      console.error('Failed to parse engine result:', error);
      throw new Error(`Failed to parse engine result: ${error.message}`);
    }
  }
  
  /**
   * 엔진 접근 권한 확인
   */
  private hasAccessToEngine(
    engine: AIEngine,
    organizationId?: string,
    userType?: string
  ): boolean {
    const access = engine.accessControl;
    
    // 공개 엔진인 경우
    if (access.isPublic) {
      return true;
    }
    
    // 조직 제한 확인
    if (organizationId && access.allowedOrganizations.length > 0) {
      if (!access.allowedOrganizations.includes(organizationId)) {
        return false;
      }
    }
    
    // 사용자 유형 제한 확인
    if (userType && access.userTypes.length > 0) {
      if (!access.userTypes.includes(userType)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 데이터 품질 검증
   */
  private validateDataQuality(
    measurementData: MeasurementData,
    engine: AIEngine
  ): boolean {
    const restrictions = engine.restrictions;
    
    // 최소 품질 요구사항 확인
    if (measurementData.dataQuality.overallScore < restrictions.minDataQuality) {
      return false;
    }
    
    // 필수 메트릭 확인
    for (const requiredMetric of restrictions.requiredMetrics) {
      if (!this.hasRequiredMetric(measurementData, requiredMetric)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 필수 메트릭 보유 확인
   */
  private hasRequiredMetric(
    measurementData: MeasurementData,
    metricName: string
  ): boolean {
    switch (metricName) {
      case 'eegMetrics':
        return measurementData.eegMetrics !== undefined;
      case 'ppgMetrics':
        return measurementData.ppgMetrics !== undefined;
      case 'accMetrics':
        return measurementData.accMetrics !== undefined;
      case 'heartRate':
        return measurementData.ppgMetrics?.heartRate !== undefined;
      case 'stressIndex':
        return measurementData.eegMetrics?.stressIndex !== undefined;
      default:
        return true;
    }
  }
  
  /**
   * 엔진 결과 검증
   */
  private validateEngineResult(result: AIAnalysisResult, engine: AIEngine): void {
    const parsed = result.parsedResult;
    
    // 필수 필드 확인
    if (parsed.overallScore < 0 || parsed.overallScore > 100) {
      throw new Error('Invalid overall score range');
    }
    
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.riskLevel)) {
      throw new Error('Invalid risk level');
    }
    
    if (parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('Invalid confidence range');
    }
    
    // 엔진별 검증 규칙 적용
    if (engine.outputFormat.validationRules) {
      for (const rule of engine.outputFormat.validationRules) {
        // 검증 규칙 실행 (예: 최소 추천사항 개수 등)
        this.applyValidationRule(result, rule);
      }
    }
  }
  
  /**
   * 프롬프트 변수 준비
   */
  private preparePromptVariables(measurementData: MeasurementData): any {
    return {
      measurementDate: measurementData.measurementDate.toISOString(),
      duration: measurementData.duration,
      deviceModel: measurementData.deviceInfo.model,
      eegMetrics: measurementData.eegMetrics,
      ppgMetrics: measurementData.ppgMetrics,
      accMetrics: measurementData.accMetrics,
      dataQuality: measurementData.dataQuality,
      environment: measurementData.environmentInfo
    };
  }
  
  /**
   * 스키마 검증
   */
  private validateAgainstSchema(data: any, schema: any): void {
    // JSON Schema 검증 로직 (ajv 등 라이브러리 사용 가능)
    // 간단한 구현으로 대체
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
    }
  }
  
  /**
   * 검증 규칙 적용
   */
  private applyValidationRule(result: AIAnalysisResult, rule: string): void {
    switch (rule) {
      case 'min_recommendations_3':
        if (result.parsedResult.recommendations.length < 3) {
          throw new Error('Minimum 3 recommendations required');
        }
        break;
      case 'require_stress_analysis':
        if (!result.parsedResult.stressAnalysis) {
          throw new Error('Stress analysis is required');
        }
        break;
      // 추가 규칙들...
    }
  }
  
  /**
   * 엔진 사용 통계 업데이트
   */
  private async updateEngineUsageStats(
    engineId: string,
    executionTime: number,
    success: boolean
  ): Promise<void> {
    try {
      // 백그라운드에서 실행되는 통계 업데이트 로직
      // 성공률, 평균 처리 시간 등 업데이트
    } catch (error) {
      console.error('Failed to update engine usage stats:', error);
    }
  }
}

// 기본 AI 엔진 구현체들
export { AIEngineRegistry }; 