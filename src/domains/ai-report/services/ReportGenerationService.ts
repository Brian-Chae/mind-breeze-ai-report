/**
 * AI 리포트 생성 오케스트레이션 서비스
 * 전체 리포트 생성 프로세스를 관리하고 조율
 */

import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { BaseService } from '../../../core/services/BaseService';
import { MeasurementDataService } from './MeasurementDataService';
import { AIEngineService } from './AIEngineService';
import { 
  ReportGenerationRequest,
  ReportGenerationResponse,
  ReportInstance,
  MeasurementData,
  AIEngine,
  ReportRenderer,
  CostBreakdown,
  ProcessingStatus,
  AIAnalysisResult,
  RenderedOutput
} from '../types';

export class ReportGenerationService extends BaseService {
  private static readonly COLLECTION_NAME = 'reportInstances';
  
  private measurementDataService: MeasurementDataService;
  private aiEngineService: AIEngineService;
  
  constructor() {
    super();
    this.measurementDataService = new MeasurementDataService();
    this.aiEngineService = new AIEngineService();
  }
  
  /**
   * 리포트 생성 요청 처리
   */
  async generateReport(request: ReportGenerationRequest): Promise<ReportGenerationResponse> {
    try {
      
      // 1. 요청 검증
      await this.validateRequest(request);
      
      // 2. 비용 계산
      const estimatedCost = await this.calculateCost(request);
      
      // 3. 크레딧 확인 및 예약
      await this.reserveCredits(request, estimatedCost);
      
      // 4. 리포트 인스턴스 생성
      const reportInstance = await this.createReportInstance(request, estimatedCost);
      
      // 5. 백그라운드에서 실제 처리 시작
      this.processReportAsync(reportInstance.id).catch(error => {
        this.handleProcessingError(reportInstance.id, error);
      });
      
      return {
        reportInstanceId: reportInstance.id,
        estimatedCost,
        estimatedProcessingTime: await this.estimateProcessingTime(request),
        queuePosition: await this.getQueuePosition()
      };
      
    } catch (error: any) {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }
  
  /**
   * 리포트 인스턴스 조회
   */
  async getReportInstance(reportId: string): Promise<ReportInstance | null> {
    try {
      const docSnap = await this.getDocument<ReportInstance>(
        ReportGenerationService.COLLECTION_NAME,
        reportId
      );
      
      if (!docSnap) {
        return null;
      }
      
      return {
        ...docSnap,
        createdAt: (docSnap.createdAt as any).toDate(),
        updatedAt: (docSnap.updatedAt as any).toDate(),
        processingStatus: {
          ...docSnap.processingStatus,
          queuedAt: (docSnap.processingStatus.queuedAt as any).toDate(),
          aiProcessingStartedAt: docSnap.processingStatus.aiProcessingStartedAt 
            ? (docSnap.processingStatus.aiProcessingStartedAt as any).toDate() 
            : undefined,
          aiProcessingCompletedAt: docSnap.processingStatus.aiProcessingCompletedAt 
            ? (docSnap.processingStatus.aiProcessingCompletedAt as any).toDate() 
            : undefined,
          renderingStartedAt: docSnap.processingStatus.renderingStartedAt 
            ? (docSnap.processingStatus.renderingStartedAt as any).toDate() 
            : undefined,
          renderingCompletedAt: docSnap.processingStatus.renderingCompletedAt 
            ? (docSnap.processingStatus.renderingCompletedAt as any).toDate() 
            : undefined
        }
      };
      
    } catch (error: any) {
      throw new Error(`Failed to get report instance: ${error.message}`);
    }
  }
  
  /**
   * 사용자별 리포트 목록 조회
   */
  async getUserReports(
    userId: string,
    organizationId?: string,
    limit: number = 20
  ): Promise<ReportInstance[]> {
    try {
      const constraints = [
        ['userId', '==', userId],
        ['createdAt', 'desc']
      ];
      
      if (organizationId) {
        constraints.unshift(['organizationId', '==', organizationId]);
      }
      
      return await this.queryDocuments<ReportInstance>(
        ReportGenerationService.COLLECTION_NAME,
        constraints.map(([field, op, value]) => ({ field, operator: op as any, value }))
      );
      
    } catch (error: any) {
      throw new Error(`Failed to get user reports: ${error.message}`);
    }
  }
  
  /**
   * 비동기 리포트 처리
   */
  private async processReportAsync(reportId: string): Promise<void> {
    try {
      
      // 1. 리포트 인스턴스 조회
      const reportInstance = await this.getReportInstance(reportId);
      if (!reportInstance) {
        throw new Error('Report instance not found');
      }
      
      // 2. 측정 데이터 조회
      await this.updateProcessingStage(reportId, 'AI_PROCESSING', 10);
      const measurementData = await this.measurementDataService.getMeasurementData(
        reportInstance.measurementDataId
      );
      
      if (!measurementData) {
        throw new Error('Measurement data not found');
      }
      
      // 3. AI 엔진 실행
      await this.updateProcessingStage(reportId, 'AI_PROCESSING', 30);
      const aiResult = await this.executeAIEngine(reportInstance, measurementData);
      
      // 4. AI 결과 저장
      await this.saveAIResult(reportId, aiResult);
      await this.updateProcessingStage(reportId, 'RENDERING', 70);
      
      // 5. 렌더링 실행
      const renderedOutput = await this.executeRenderer(reportInstance, aiResult);
      
      // 6. 렌더링 결과 저장
      await this.saveRenderedOutput(reportId, renderedOutput);
      
      // 7. 완료 처리
      await this.completeProcessing(reportId);
      
      
    } catch (error: any) {
      await this.handleProcessingError(reportId, error);
    }
  }
  
  /**
   * 요청 검증
   */
  private async validateRequest(request: ReportGenerationRequest): Promise<void> {
    // 측정 데이터 존재 확인
    const measurementData = await this.measurementDataService.getMeasurementData(
      request.measurementDataId
    );
    
    if (!measurementData) {
      throw new Error('Measurement data not found');
    }
    
    // 데이터 품질 확인
    if (!this.measurementDataService.isAnalyzable(measurementData)) {
      throw new Error('Measurement data quality is insufficient for analysis');
    }
    
    // AI 엔진 존재 및 접근 권한 확인
    const engine = await this.aiEngineService.getEngine(request.engineId);
    if (!engine) {
      throw new Error('AI engine not found');
    }
    
    if (engine.status !== 'ACTIVE') {
      throw new Error('AI engine is not active');
    }
    
    // 렌더러 확인 (별도 서비스에서 구현)
    // TODO: RendererService 구현 후 추가
  }
  
  /**
   * 비용 계산
   */
  private async calculateCost(request: ReportGenerationRequest): Promise<CostBreakdown> {
    try {
      // AI 엔진 비용
      const engine = await this.aiEngineService.getEngine(request.engineId);
      const engineCost = engine?.creditCost || 0;
      
      // 렌더러 비용 (TODO: RendererService에서 조회)
      const rendererCost = 0; // 임시값
      
      return {
        engineCost,
        rendererCost,
        totalCost: engineCost + rendererCost,
        paidBy: request.organizationId || request.userId,
        paymentMethod: request.organizationId ? 'ORGANIZATION_CREDIT' : 'INDIVIDUAL_CREDIT'
      };
      
    } catch (error: any) {
      throw new Error(`Failed to calculate cost: ${error.message}`);
    }
  }
  
  /**
   * 크레딧 예약
   */
  private async reserveCredits(
    request: ReportGenerationRequest,
    cost: CostBreakdown
  ): Promise<void> {
    // TODO: CreditManagementService 구현 후 크레딧 예약 로직 추가
  }
  
  /**
   * 리포트 인스턴스 생성
   */
  private async createReportInstance(
    request: ReportGenerationRequest,
    estimatedCost: CostBreakdown
  ): Promise<ReportInstance> {
    const reportInstance: Omit<ReportInstance, 'id'> = {
      measurementDataId: request.measurementDataId,
      sessionId: '', // TODO: 측정 데이터에서 sessionId 조회
      userId: request.userId,
      organizationId: request.organizationId,
      
      engineId: request.engineId,
      rendererId: request.rendererId,
      
      aiAnalysisResult: {
        rawOutput: null,
        parsedResult: {
          overallScore: 0,
          riskLevel: 'LOW',
          recommendations: [],
          warnings: [],
          confidence: 0,
          analysisVersion: ''
        }
      },
      
      renderedOutput: {
        content: '',
        contentType: '',
        renderingTime: 0,
        renderingVersion: ''
      },
      
      costBreakdown: estimatedCost,
      
      processingStatus: {
        stage: 'QUEUED',
        progress: 0,
        queuedAt: new Date(),
        retryCount: 0
      },
      
      accessControl: {
        isPublic: false,
        sharedWith: []
      },
      
      viewCount: 0,
      downloadCount: 0,
      
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = doc(collection(this.db, ReportGenerationService.COLLECTION_NAME));
    await setDoc(docRef, {
      ...reportInstance,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      processingStatus: {
        ...reportInstance.processingStatus,
        queuedAt: Timestamp.now()
      }
    });
    
    return {
      id: docRef.id,
      ...reportInstance
    };
  }
  
  /**
   * AI 엔진 실행
   */
  private async executeAIEngine(
    reportInstance: ReportInstance,
    measurementData: MeasurementData
  ): Promise<AIAnalysisResult> {
    try {
      await this.updateProcessingTimestamp(reportInstance.id, 'aiProcessingStartedAt');
      
      const result = await this.aiEngineService.executeEngine(
        reportInstance.engineId,
        measurementData,
        undefined, // customSettings
        undefined  // organizationConfig
      );
      
      await this.updateProcessingTimestamp(reportInstance.id, 'aiProcessingCompletedAt');
      
      return result;
      
    } catch (error: any) {
      throw error;
    }
  }
  
  /**
   * 렌더러 실행
   */
  private async executeRenderer(
    reportInstance: ReportInstance,
    aiResult: AIAnalysisResult
  ): Promise<RenderedOutput> {
    try {
      await this.updateProcessingTimestamp(reportInstance.id, 'renderingStartedAt');
      
      // TODO: RendererService 구현 후 실제 렌더링 로직 추가
      const mockRenderedOutput: RenderedOutput = {
        content: '<html><body>Mock Report</body></html>',
        contentType: 'text/html',
        renderingTime: 1000,
        renderingVersion: '1.0.0'
      };
      
      await this.updateProcessingTimestamp(reportInstance.id, 'renderingCompletedAt');
      
      return mockRenderedOutput;
      
    } catch (error: any) {
      throw error;
    }
  }
  
  /**
   * 처리 단계 업데이트
   */
  private async updateProcessingStage(
    reportId: string,
    stage: ProcessingStatus['stage'],
    progress: number
  ): Promise<void> {
    try {
      await updateDoc(doc(this.db, ReportGenerationService.COLLECTION_NAME, reportId), {
        'processingStatus.stage': stage,
        'processingStatus.progress': progress,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
    }
  }
  
  /**
   * 처리 타임스탬프 업데이트
   */
  private async updateProcessingTimestamp(
    reportId: string,
    field: string
  ): Promise<void> {
    try {
      await updateDoc(doc(this.db, ReportGenerationService.COLLECTION_NAME, reportId), {
        [`processingStatus.${field}`]: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
    }
  }
  
  /**
   * AI 결과 저장
   */
  private async saveAIResult(reportId: string, aiResult: AIAnalysisResult): Promise<void> {
    try {
      await updateDoc(doc(this.db, ReportGenerationService.COLLECTION_NAME, reportId), {
        aiAnalysisResult: aiResult,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 렌더링 결과 저장
   */
  private async saveRenderedOutput(
    reportId: string,
    renderedOutput: RenderedOutput
  ): Promise<void> {
    try {
      await updateDoc(doc(this.db, ReportGenerationService.COLLECTION_NAME, reportId), {
        renderedOutput,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 처리 완료
   */
  private async completeProcessing(reportId: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, ReportGenerationService.COLLECTION_NAME, reportId), {
        'processingStatus.stage': 'COMPLETED',
        'processingStatus.progress': 100,
        updatedAt: Timestamp.now()
      });
      
      // TODO: 완료 알림 발송
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 처리 오류 핸들링
   */
  private async handleProcessingError(reportId: string, error: any): Promise<void> {
    try {
      await updateDoc(doc(this.db, ReportGenerationService.COLLECTION_NAME, reportId), {
        'processingStatus.stage': 'FAILED',
        'processingStatus.errorMessage': error.message,
        'processingStatus.errorCode': error.code || 'UNKNOWN_ERROR',
        updatedAt: Timestamp.now()
      });
      
      // TODO: 오류 알림 발송
      
    } catch (updateError) {
    }
  }
  
  /**
   * 처리 시간 추정
   */
  private async estimateProcessingTime(request: ReportGenerationRequest): Promise<number> {
    try {
      const engine = await this.aiEngineService.getEngine(request.engineId);
      const baseTime = engine?.averageProcessingTime || 30000; // 기본 30초
      
      // TODO: 렌더러 평균 시간 추가
      const renderingTime = 5000; // 기본 5초
      
      return baseTime + renderingTime;
      
    } catch (error) {
      return 35000; // 기본값
    }
  }
  
  /**
   * 큐 대기 순서 조회
   */
  private async getQueuePosition(): Promise<number> {
    try {
      // TODO: 실제 큐 관리 시스템 구현
      return 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * BaseService의 추상 메서드 구현
   */
  protected async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(this.db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return null;
      }
      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (error) {
      return null;
    }
  }
  
  protected async queryDocuments<T>(
    collectionName: string,
    constraints: Array<{ field: string; operator: any; value: any }>
  ): Promise<T[]> {
    try {
      // TODO: Firestore v9 쿼리 구문으로 구현
      return [];
    } catch (error) {
      return [];
    }
  }
} 