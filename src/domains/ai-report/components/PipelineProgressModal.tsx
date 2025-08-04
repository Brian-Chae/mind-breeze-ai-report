/**
 * 파이프라인 진행 상황을 표시하는 모달 컴포넌트
 */

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal
} from '@ui/dialog';
import { Progress } from '@ui/progress';
import { Button } from '@ui/button';
import { 
  Brain, 
  Heart, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X
} from 'lucide-react';
import { PipelineProgress } from '../hooks/useAnalysisPipeline';

interface PipelineProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: PipelineProgress;
  onCancel?: () => void;
  isRunning: boolean;
  error?: string | null;
}

export const PipelineProgressModal: React.FC<PipelineProgressModalProps> = ({
  isOpen,
  onClose,
  progress,
  onCancel,
  isRunning,
  error
}) => {
  // 시작 시간과 경과 시간 추적
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = React.useState<number>(0);

  // 분석이 시작될 때 시작 시간 설정
  React.useEffect(() => {
    if (isRunning && !startTime && progress.currentStep !== 'idle') {
      setStartTime(Date.now());
    }
  }, [isRunning, startTime, progress.currentStep]);

  // 경과 시간 업데이트
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (startTime) {
      if (isRunning) {
        interval = setInterval(() => {
          setElapsedTime(Date.now() - startTime);
        }, 1000); // 1초마다 업데이트
      } else if (progress.currentStep === 'completed') {
        // 완료된 경우 최종 시간 설정
        setElapsedTime(Date.now() - startTime);
      }
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, startTime, progress.currentStep]);

  // 모달이 닫힐 때 시간 초기화
  React.useEffect(() => {
    if (!isOpen) {
      setStartTime(null);
      setElapsedTime(0);
    }
  }, [isOpen]);

  // 시간을 mm:ss 형식으로 포맷팅
  const formatElapsedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  // 단계별 아이콘과 색상 정의
  const getStepIcon = (step: string, isActive: boolean, isCompleted: boolean) => {
    const iconClass = `w-6 h-6 ${isActive ? 'animate-pulse' : ''}`;
    
    if (isCompleted) {
      return <CheckCircle className={`${iconClass} text-green-600`} />;
    }
    
    switch (step) {
      case 'eeg':
        return <Brain className={`${iconClass} ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />;
      case 'ppg':
        return <Heart className={`${iconClass} ${isActive ? 'text-red-600' : 'text-gray-400'}`} />;
      case 'integrated':
        return <Sparkles className={`${iconClass} ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />;
      default:
        return <div className={`w-6 h-6 rounded-full ${isActive ? 'bg-gray-600' : 'bg-gray-300'}`} />;
    }
  };
  
  // 단계별 완료 상태 확인
  const isStepCompleted = (step: string): boolean => {
    const stepOrder = ['eeg', 'ppg', 'integrated'];
    const currentIndex = stepOrder.indexOf(progress.currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    return stepIndex < currentIndex || progress.currentStep === 'completed';
  };
  
  const isStepActive = (step: string): boolean => {
    return progress.currentStep === step;
  };
  
  // 전체 진행률 계산
  const getOverallProgress = (): number => {
    if (progress.currentStep === 'completed') return 100;
    if (progress.currentStep === 'error') return progress.progress;
    
    const baseProgress = {
      'idle': 0,
      'eeg': 0,
      'ppg': 33,
      'integrated': 66,
      'completed': 100,
      'error': 0
    };
    
    const base = baseProgress[progress.currentStep] || 0;
    const stepProgress = (progress.progress / 100) * 33; // 각 단계는 전체의 33%
    
    return Math.min(base + stepProgress, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-lg bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-gray-900">
              <span className="text-lg font-semibold">통합 건강 분석 진행 중</span>
              {isRunning && onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              EEG와 PPG 데이터를 분석하여 종합적인 건강 리포트를 생성하는 중입니다.
            </DialogDescription>
          </DialogHeader>
        
        <div className="space-y-6">
          {/* 진행 단계 표시 */}
          <div className="flex items-center justify-between px-4">
            {/* EEG 분석 */}
            <div className="flex flex-col items-center">
              {getStepIcon('eeg', isStepActive('eeg'), isStepCompleted('eeg'))}
              <span className={`text-xs mt-1 font-medium ${
                isStepActive('eeg') ? 'text-purple-700 font-semibold' : 
                isStepCompleted('eeg') ? 'text-green-700 font-semibold' : 'text-gray-600'
              }`}>
                EEG 분석
              </span>
            </div>
            
            {/* 연결선 */}
            <div className={`flex-1 h-0.5 mx-2 ${
              isStepCompleted('ppg') ? 'bg-green-600' : 'bg-gray-300'
            }`} />
            
            {/* PPG 분석 */}
            <div className="flex flex-col items-center">
              {getStepIcon('ppg', isStepActive('ppg'), isStepCompleted('ppg'))}
              <span className={`text-xs mt-1 font-medium ${
                isStepActive('ppg') ? 'text-red-700 font-semibold' : 
                isStepCompleted('ppg') ? 'text-green-700 font-semibold' : 'text-gray-600'
              }`}>
                PPG 분석
              </span>
            </div>
            
            {/* 연결선 */}
            <div className={`flex-1 h-0.5 mx-2 ${
              isStepCompleted('integrated') ? 'bg-green-600' : 'bg-gray-300'
            }`} />
            
            {/* 통합 분석 */}
            <div className="flex flex-col items-center">
              {getStepIcon('integrated', isStepActive('integrated'), isStepCompleted('integrated'))}
              <span className={`text-xs mt-1 font-medium ${
                isStepActive('integrated') ? 'text-blue-700 font-semibold' : 
                isStepCompleted('integrated') ? 'text-green-700 font-semibold' : 'text-gray-600'
              }`}>
                통합 분석
              </span>
            </div>
          </div>
          
          {/* 전체 진행률 바 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">전체 진행률</span>
              <span className="font-semibold text-gray-900">{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
            
            {/* 진행 시간 표시 */}
            {startTime && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {progress.currentStep === 'completed' ? '총 소요 시간' : '진행 시간'}
                </span>
                <span className="font-mono text-gray-700">{formatElapsedTime(elapsedTime)}</span>
              </div>
            )}
          </div>
          
          {/* 현재 상태 메시지 */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {error ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">오류 발생</p>
                    <p className="text-sm text-red-800 mt-1">{error}</p>
                  </div>
                </>
              ) : progress.currentStep === 'completed' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900">분석 완료!</p>
                    <p className="text-sm text-green-800 mt-1">
                      통합 건강 분석이 성공적으로 완료되었습니다.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {progress.message}
                    </p>
                    {isRunning && (
                      <p className="text-xs text-gray-700 mt-1">
                        잠시만 기다려주세요...
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* 액션 버튼 */}
          <div className="flex justify-end gap-2">
            {error || progress.currentStep === 'completed' ? (
              <Button onClick={onClose}>
                확인
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={onCancel}
                disabled={!isRunning}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                취소
              </Button>
            )}
          </div>
        </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};