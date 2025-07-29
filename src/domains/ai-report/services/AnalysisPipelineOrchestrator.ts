/**
 * 분석 파이프라인 오케스트레이터
 * EEG, PPG, 통합 분석을 순차적/병렬적으로 실행하는 시스템
 */

import { IAIEngine } from '../core/interfaces/IAIEngine';
import { aiEngineRegistry } from '../core/registry/AIEngineRegistry';
import { PersonalInfo, IntegratedAnalysisInput } from '../ai-engines/IntegratedAdvancedGeminiEngine';

// 파이프라인 설정 인터페이스
export interface PipelineConfig {
  personalInfo: PersonalInfo;
  measurementData: {
    eeg?: any; // EEG 데이터
    ppg?: any; // PPG 데이터
  };
  options?: {
    skipEEG?: boolean;
    skipPPG?: boolean;
    includeDetailedAnalysis?: boolean;
    preferredEngines?: {
      eeg?: string;
      ppg?: string;
      integrated?: string;
    };
  };
}

// 파이프라인 상태
export enum PipelineStatus {
  IDLE = 'idle',
  RUNNING_EEG = 'running_eeg',
  RUNNING_PPG = 'running_ppg',
  RUNNING_INTEGRATED = 'running_integrated',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// 파이프라인 결과 인터페이스
export interface PipelineResult {
  eegAnalysis?: any; // EEGAdvancedAnalysisResult
  ppgAnalysis?: any; // PPGAdvancedAnalysisResult
  integratedAnalysis: any; // IntegratedAnalysisResult
  metadata: {
    totalDuration: number;
    apiCalls: number;
    timestamp: string;
    pipelineId: string;
    status: PipelineStatus;
    errors?: string[];
  };
}

// 파이프라인 진행 상황 콜백
export type PipelineProgressCallback = (status: PipelineStatus, progress: number, message: string) => void;

export class AnalysisPipelineOrchestrator {
  private eegEngine: IAIEngine | null = null;
  private ppgEngine: IAIEngine | null = null;
  private integratedEngine: IAIEngine | null = null;
  private currentStatus: PipelineStatus = PipelineStatus.IDLE;
  private progressCallback?: PipelineProgressCallback;

  constructor() {
    this.initializeEngines();
  }

  /**
   * 엔진 초기화
   */
  private initializeEngines(): void {
    // 기본 엔진 설정
    this.eegEngine = aiEngineRegistry.get('eeg-advanced-gemini-v1');
    this.ppgEngine = aiEngineRegistry.get('ppg-advanced-gemini-v1');
    this.integratedEngine = aiEngineRegistry.get('integrated-advanced-gemini-v1');

    if (!this.eegEngine) {
      console.warn('⚠️ EEG Advanced 엔진을 찾을 수 없습니다.');
    }
    if (!this.ppgEngine) {
      console.warn('⚠️ PPG Advanced 엔진을 찾을 수 없습니다.');
    }
    if (!this.integratedEngine) {
      console.error('❌ Integrated Advanced 엔진을 찾을 수 없습니다!');
      throw new Error('통합 분석 엔진이 등록되지 않았습니다.');
    }
  }

  /**
   * 진행 상황 콜백 설정
   */
  public setProgressCallback(callback: PipelineProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * 진행 상황 업데이트
   */
  private updateProgress(status: PipelineStatus, progress: number, message: string): void {
    this.currentStatus = status;
    if (this.progressCallback) {
      this.progressCallback(status, progress, message);
    }
    console.log(`📊 파이프라인 진행: [${status}] ${progress}% - ${message}`);
  }

  /**
   * 파이프라인 실행
   */
  public async runPipeline(config: PipelineConfig): Promise<PipelineResult> {
    const startTime = Date.now();
    const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const results: Partial<PipelineResult> = {
      metadata: {
        totalDuration: 0,
        apiCalls: 0,
        timestamp: new Date().toISOString(),
        pipelineId,
        status: PipelineStatus.IDLE,
        errors: []
      }
    };

    try {
      this.updateProgress(PipelineStatus.IDLE, 0, '파이프라인 시작 준비 중...');

      // 선호 엔진 설정
      if (config.options?.preferredEngines) {
        if (config.options.preferredEngines.eeg) {
          const customEEGEngine = aiEngineRegistry.get(config.options.preferredEngines.eeg);
          if (customEEGEngine) this.eegEngine = customEEGEngine;
        }
        if (config.options.preferredEngines.ppg) {
          const customPPGEngine = aiEngineRegistry.get(config.options.preferredEngines.ppg);
          if (customPPGEngine) this.ppgEngine = customPPGEngine;
        }
        if (config.options.preferredEngines.integrated) {
          const customIntegratedEngine = aiEngineRegistry.get(config.options.preferredEngines.integrated);
          if (customIntegratedEngine) this.integratedEngine = customIntegratedEngine;
        }
      }

      // Step 1 & 2: EEG와 PPG 분석 병렬 실행
      const analysisPromises: Promise<any>[] = [];
      
      if (!config.options?.skipEEG && config.measurementData.eeg && this.eegEngine) {
        this.updateProgress(PipelineStatus.RUNNING_EEG, 10, 'EEG 분석 시작...');
        analysisPromises.push(this.runEEGAnalysis(config.measurementData.eeg));
      }

      if (!config.options?.skipPPG && config.measurementData.ppg && this.ppgEngine) {
        this.updateProgress(PipelineStatus.RUNNING_PPG, 10, 'PPG 분석 시작...');
        analysisPromises.push(this.runPPGAnalysis(config.measurementData.ppg));
      }

      // 병렬 실행 및 결과 수집
      const analysisResults = await Promise.all(analysisPromises);
      
      // 결과 분리
      let eegResult = null;
      let ppgResult = null;
      let currentIndex = 0;

      if (!config.options?.skipEEG && config.measurementData.eeg && this.eegEngine) {
        eegResult = analysisResults[currentIndex++];
        results.eegAnalysis = eegResult;
        results.metadata!.apiCalls++;
        this.updateProgress(PipelineStatus.RUNNING_EEG, 40, 'EEG 분석 완료');
      }

      if (!config.options?.skipPPG && config.measurementData.ppg && this.ppgEngine) {
        ppgResult = analysisResults[currentIndex++];
        results.ppgAnalysis = ppgResult;
        results.metadata!.apiCalls++;
        this.updateProgress(PipelineStatus.RUNNING_PPG, 40, 'PPG 분석 완료');
      }

      // Step 3: 통합 분석
      this.updateProgress(PipelineStatus.RUNNING_INTEGRATED, 50, '통합 분석 시작...');
      
      const integratedInput: IntegratedAnalysisInput = {
        eegAnalysis: results.eegAnalysis,
        ppgAnalysis: results.ppgAnalysis,
        personalInfo: config.personalInfo,
        metadata: {
          measurementDuration: this.calculateMeasurementDuration(config.measurementData),
          measurementTime: new Date().toISOString(),
          deviceInfo: {
            eeg: config.measurementData.eeg?.deviceInfo,
            ppg: config.measurementData.ppg?.deviceInfo
          }
        }
      };

      const integratedResult = await this.runIntegratedAnalysis(integratedInput);
      results.integratedAnalysis = integratedResult;
      results.metadata!.apiCalls++;

      // 완료
      this.updateProgress(PipelineStatus.COMPLETED, 100, '파이프라인 완료!');
      
      // 메타데이터 업데이트
      results.metadata!.totalDuration = Date.now() - startTime;
      results.metadata!.status = PipelineStatus.COMPLETED;

      console.log('✅ 파이프라인 실행 완료:', {
        pipelineId,
        duration: `${results.metadata!.totalDuration}ms`,
        apiCalls: results.metadata!.apiCalls
      });

      return results as PipelineResult;

    } catch (error) {
      console.error('❌ 파이프라인 실행 중 오류:', error);
      
      this.updateProgress(PipelineStatus.ERROR, 0, `오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      
      results.metadata!.status = PipelineStatus.ERROR;
      results.metadata!.errors!.push(error instanceof Error ? error.message : '알 수 없는 오류');
      results.metadata!.totalDuration = Date.now() - startTime;
      
      // 오류가 발생해도 부분적인 결과는 반환
      if (!results.integratedAnalysis) {
        // 통합 분석이 실패한 경우 기본값 제공
        results.integratedAnalysis = {
          type: 'integrated-analysis',
          summary: '분석 중 오류가 발생했습니다.',
          overallSummary: {
            healthScore: 0,
            mainFindings: ['분석을 완료할 수 없습니다.'],
            urgentIssues: [],
            positiveAspects: []
          },
          personalizedAnalysis: {
            ageGenderAnalysis: {
              comparison: '분석 불가',
              risks: [],
              recommendations: []
            }
          },
          improvementPlan: {
            immediate: [],
            shortTerm: [],
            longTerm: []
          },
          confidence: 0,
          metadata: {
            analysisDate: new Date().toISOString(),
            engineVersion: '1.0.0',
            processingTime: 0,
            dataQuality: 'poor'
          }
        };
      }
      
      return results as PipelineResult;
    }
  }

  /**
   * EEG 분석 실행
   */
  private async runEEGAnalysis(eegData: any): Promise<any> {
    if (!this.eegEngine) {
      throw new Error('EEG 엔진이 초기화되지 않았습니다.');
    }

    console.log('🧠 EEG 분석 실행 중...');
    
    try {
      const result = await this.eegEngine.analyze(eegData);
      console.log('✅ EEG 분석 완료');
      return result;
    } catch (error) {
      console.error('❌ EEG 분석 실패:', error);
      throw error;
    }
  }

  /**
   * PPG 분석 실행
   */
  private async runPPGAnalysis(ppgData: any): Promise<any> {
    if (!this.ppgEngine) {
      throw new Error('PPG 엔진이 초기화되지 않았습니다.');
    }

    console.log('💓 PPG 분석 실행 중...');
    
    try {
      const result = await this.ppgEngine.analyze(ppgData);
      console.log('✅ PPG 분석 완료');
      return result;
    } catch (error) {
      console.error('❌ PPG 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 통합 분석 실행
   */
  private async runIntegratedAnalysis(input: IntegratedAnalysisInput): Promise<any> {
    if (!this.integratedEngine) {
      throw new Error('통합 분석 엔진이 초기화되지 않았습니다.');
    }

    console.log('🔄 통합 분석 실행 중...');
    
    try {
      const result = await this.integratedEngine.analyze(input);
      console.log('✅ 통합 분석 완료');
      return result;
    } catch (error) {
      console.error('❌ 통합 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 시간 계산
   */
  private calculateMeasurementDuration(measurementData: any): number {
    let duration = 0;
    
    if (measurementData.eeg?.duration) {
      duration = Math.max(duration, measurementData.eeg.duration);
    }
    
    if (measurementData.ppg?.duration) {
      duration = Math.max(duration, measurementData.ppg.duration);
    }
    
    return duration || 60; // 기본값 60초
  }

  /**
   * 현재 파이프라인 상태 조회
   */
  public getCurrentStatus(): PipelineStatus {
    return this.currentStatus;
  }

  /**
   * 파이프라인 재설정
   */
  public reset(): void {
    this.currentStatus = PipelineStatus.IDLE;
    this.progressCallback = undefined;
  }
}

// 싱글톤 인스턴스 export
export const pipelineOrchestrator = new AnalysisPipelineOrchestrator();