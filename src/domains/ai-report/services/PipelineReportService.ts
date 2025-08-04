/**
 * 파이프라인 분석 결과를 Firestore에 저장하는 서비스
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@core/services/firebase';
import { PipelineResult } from './AnalysisPipelineOrchestrator';

export interface PipelineReport {
  id: string;
  organizationId: string;
  userId?: string;
  measurementDataId: string;
  personalInfo: any;
  
  // 개별 분석 결과
  eegAnalysisId?: string;
  eegAnalysisResult?: any;
  ppgAnalysisId?: string;
  ppgAnalysisResult?: any;
  
  // 통합 분석 결과
  integratedAnalysisId: string;
  integratedAnalysisResult: any;
  
  // 메타데이터
  metadata: {
    pipelineId: string;
    totalDuration: number;
    apiCalls: number;
    timestamp: string;
    status: string;
    errors?: string[];
  };
  
  // 엔진 정보
  engineInfo: {
    eegEngine?: string;
    ppgEngine?: string;
    integratedEngine: string;
  };
  
  // 타임스탬프
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class PipelineReportService {
  private static readonly COLLECTION_NAME = 'pipelineReports';
  
  /**
   * 재귀적으로 객체에서 undefined 값을 제거
   */
  private removeUndefinedValues(obj: any): any {
    if (obj === null) return null;
    if (obj === undefined) return null;
    if (obj instanceof Date || obj instanceof Timestamp) return obj;
    if (typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item))
        .filter(item => item !== undefined);
    }
    
    const cleanedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined) {
          const cleanedValue = this.removeUndefinedValues(value);
          if (cleanedValue !== undefined) {
            cleanedObj[key] = cleanedValue;
          }
        }
      }
    }
    return cleanedObj;
  }
  
  /**
   * 파이프라인 결과를 Firestore에 저장
   */
  async savePipelineReport(
    pipelineResult: PipelineResult,
    organizationId: string,
    userId?: string,
    measurementDataId?: string,
    personalInfo?: any
  ): Promise<PipelineReport> {
    try {
      const reportId = `pipeline_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const pipelineReport: PipelineReport = {
        id: reportId,
        organizationId,
        userId,
        measurementDataId: measurementDataId || '',
        personalInfo: personalInfo || {},
        
        // 개별 분석 결과
        eegAnalysisId: pipelineResult.eegAnalysis?.analysisId,
        eegAnalysisResult: pipelineResult.eegAnalysis,
        ppgAnalysisId: pipelineResult.ppgAnalysis?.analysisId,
        ppgAnalysisResult: pipelineResult.ppgAnalysis,
        
        // 통합 분석 결과
        integratedAnalysisId: pipelineResult.integratedAnalysis?.analysisId || reportId,
        integratedAnalysisResult: pipelineResult.integratedAnalysis,
        
        // 메타데이터
        metadata: pipelineResult.metadata,
        
        // 엔진 정보
        engineInfo: {
          eegEngine: pipelineResult.eegAnalysis?.engineId,
          ppgEngine: pipelineResult.ppgAnalysis?.engineId,
          integratedEngine: 'integrated-advanced-gemini-v1'
        },
        
        // 타임스탬프
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // undefined 값 제거
      const cleanedReport = this.removeUndefinedValues(pipelineReport);
      
      // Firestore에 저장
      await setDoc(
        doc(db, PipelineReportService.COLLECTION_NAME, reportId),
        cleanedReport
      );
      
      console.log('✅ 파이프라인 리포트 저장 완료:', {
        reportId: reportId,
        organizationId: cleanedReport.organizationId,
        measurementDataId: cleanedReport.measurementDataId,
        hasEEG: !!cleanedReport.eegAnalysisResult,
        hasPPG: !!cleanedReport.ppgAnalysisResult,
        hasIntegrated: !!cleanedReport.integratedAnalysisResult
      });
      return cleanedReport as PipelineReport;
      
    } catch (error) {
      console.error('❌ 파이프라인 리포트 저장 실패:', error);
      throw new Error(`파이프라인 리포트 저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }
  
  /**
   * 파이프라인 리포트 조회
   */
  async getPipelineReport(reportId: string): Promise<PipelineReport | null> {
    try {
      const docRef = doc(db, PipelineReportService.COLLECTION_NAME, reportId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        ...docSnap.data() as PipelineReport,
        id: docSnap.id
      };
      
    } catch (error) {
      console.error('❌ 파이프라인 리포트 조회 실패:', error);
      throw new Error(`파이프라인 리포트 조회에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }
  
  /**
   * 측정 데이터별 파이프라인 리포트 목록 조회
   */
  async getPipelineReportsByMeasurementData(
    measurementDataId: string
  ): Promise<PipelineReport[]> {
    try {
      // 인덱스 없이 조회하기 위해 orderBy 제거
      const q = query(
        collection(db, PipelineReportService.COLLECTION_NAME),
        where('measurementDataId', '==', measurementDataId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // 클라이언트 측에서 정렬
      const reports = querySnapshot.docs.map(doc => ({
        ...doc.data() as PipelineReport,
        id: doc.id
      }));
      
      // createdAt 기준으로 내림차순 정렬
      return reports.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
    } catch (error) {
      console.error('❌ 측정 데이터별 파이프라인 리포트 조회 실패:', error);
      return [];
    }
  }
  
  /**
   * 조직별 파이프라인 리포트 목록 조회
   */
  async getPipelineReportsByOrganization(
    organizationId: string,
    limitCount: number = 20
  ): Promise<PipelineReport[]> {
    try {
      // 인덱스 없이 조회하기 위해 orderBy와 limit 제거
      const q = query(
        collection(db, PipelineReportService.COLLECTION_NAME),
        where('organizationId', '==', organizationId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // 클라이언트 측에서 정렬 및 제한
      const reports = querySnapshot.docs.map(doc => ({
        ...doc.data() as PipelineReport,
        id: doc.id
      }));
      
      // createdAt 기준으로 내림차순 정렬 후 limitCount만큼 자르기
      return reports
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        })
        .slice(0, limitCount);
      
    } catch (error) {
      console.error('❌ 조직별 파이프라인 리포트 조회 실패:', error);
      return [];
    }
  }

  /**
   * 파이프라인 리포트 삭제
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      console.log('🗑️ 파이프라인 리포트 삭제 시작:', reportId);
      
      await deleteDoc(doc(db, PipelineReportService.COLLECTION_NAME, reportId));
      
      console.log('✅ 파이프라인 리포트 삭제 완료:', reportId);
    } catch (error) {
      console.error('❌ 파이프라인 리포트 삭제 실패:', error);
      throw new Error(`파이프라인 리포트 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }
}

// 싱글톤 인스턴스 export
export const pipelineReportService = new PipelineReportService();