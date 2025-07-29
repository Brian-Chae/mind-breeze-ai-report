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
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
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
      
      // Firestore에 저장
      await setDoc(
        doc(db, PipelineReportService.COLLECTION_NAME, reportId),
        pipelineReport
      );
      
      console.log('✅ 파이프라인 리포트 저장 완료:', reportId);
      return pipelineReport;
      
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
      const q = query(
        collection(db, PipelineReportService.COLLECTION_NAME),
        where('measurementDataId', '==', measurementDataId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(10)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as PipelineReport,
        id: doc.id
      }));
      
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
      const q = query(
        collection(db, PipelineReportService.COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as PipelineReport,
        id: doc.id
      }));
      
    } catch (error) {
      console.error('❌ 조직별 파이프라인 리포트 조회 실패:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스 export
export const pipelineReportService = new PipelineReportService();