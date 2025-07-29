/**
 * 분석 파이프라인 사용을 위한 React Hook
 */

import { useState, useCallback, useRef } from 'react';
import { 
  pipelineOrchestrator, 
  PipelineConfig, 
  PipelineResult, 
  PipelineStatus 
} from '../services/AnalysisPipelineOrchestrator';

export interface PipelineProgress {
  status: PipelineStatus;
  progress: number;
  message: string;
  currentStep: 'idle' | 'eeg' | 'ppg' | 'integrated' | 'completed' | 'error';
}

export interface UseAnalysisPipelineReturn {
  // 상태
  isRunning: boolean;
  progress: PipelineProgress;
  result: PipelineResult | null;
  error: string | null;
  
  // 액션
  runPipeline: (config: PipelineConfig) => Promise<PipelineResult | null>;
  cancelPipeline: () => void;
  reset: () => void;
}

export function useAnalysisPipeline(): UseAnalysisPipelineReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress>({
    status: PipelineStatus.IDLE,
    progress: 0,
    message: '대기 중...',
    currentStep: 'idle'
  });
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 취소 플래그
  const isCancelledRef = useRef(false);

  /**
   * 상태를 단계로 변환
   */
  const statusToStep = (status: PipelineStatus): PipelineProgress['currentStep'] => {
    switch (status) {
      case PipelineStatus.IDLE:
        return 'idle';
      case PipelineStatus.RUNNING_EEG:
        return 'eeg';
      case PipelineStatus.RUNNING_PPG:
        return 'ppg';
      case PipelineStatus.RUNNING_INTEGRATED:
        return 'integrated';
      case PipelineStatus.COMPLETED:
        return 'completed';
      case PipelineStatus.ERROR:
        return 'error';
      default:
        return 'idle';
    }
  };

  /**
   * 파이프라인 실행
   */
  const runPipeline = useCallback(async (config: PipelineConfig): Promise<PipelineResult | null> => {
    // 초기화
    setIsRunning(true);
    setError(null);
    setResult(null);
    isCancelledRef.current = false;
    
    // 진행 상황 콜백 설정
    pipelineOrchestrator.setProgressCallback((status, progressPercent, message) => {
      if (!isCancelledRef.current) {
        setProgress({
          status,
          progress: progressPercent,
          message,
          currentStep: statusToStep(status)
        });
      }
    });

    try {
      console.log('🚀 파이프라인 시작:', config);
      
      const pipelineResult = await pipelineOrchestrator.runPipeline(config);
      
      if (!isCancelledRef.current) {
        setResult(pipelineResult);
        setProgress({
          status: PipelineStatus.COMPLETED,
          progress: 100,
          message: '분석 완료!',
          currentStep: 'completed'
        });
        
        console.log('✅ 파이프라인 완료:', pipelineResult);
        return pipelineResult;
      }
      
      return null;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      
      if (!isCancelledRef.current) {
        setError(errorMessage);
        setProgress({
          status: PipelineStatus.ERROR,
          progress: 0,
          message: errorMessage,
          currentStep: 'error'
        });
      }
      
      console.error('❌ 파이프라인 오류:', err);
      return null;
      
    } finally {
      setIsRunning(false);
    }
  }, []);

  /**
   * 파이프라인 취소
   */
  const cancelPipeline = useCallback(() => {
    isCancelledRef.current = true;
    setIsRunning(false);
    setProgress({
      status: PipelineStatus.IDLE,
      progress: 0,
      message: '취소됨',
      currentStep: 'idle'
    });
    pipelineOrchestrator.reset();
  }, []);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setIsRunning(false);
    setProgress({
      status: PipelineStatus.IDLE,
      progress: 0,
      message: '대기 중...',
      currentStep: 'idle'
    });
    setResult(null);
    setError(null);
    isCancelledRef.current = false;
    pipelineOrchestrator.reset();
  }, []);

  return {
    isRunning,
    progress,
    result,
    error,
    runPipeline,
    cancelPipeline,
    reset
  };
}