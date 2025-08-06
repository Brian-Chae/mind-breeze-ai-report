import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../../shared/components/ui/tooltip';
import { Database, Zap } from 'lucide-react';

interface DataSourceIndicatorProps {
  value: number;
  metricName: string;
  metricType: 'eeg' | 'ppg' | 'acc';
}

// 알려진 기본값(fallback values) 정의 - ProcessedDataCollector.ts와 동일하게 설정
const DEFAULT_VALUES: Record<string, Record<string, number>> = {
  eeg: {
    'Delta Power': 0.30,
    'Theta Power': 0.31,
    'Alpha Power': 0.43,
    'Beta Power': 0.49,
    'Gamma Power': 0.16,
    'Total Power': 1.89,  // 수정: 1.69 -> 1.89
    'Focus': 0.75,
    'Focus Index': 0.75,  // Focus와 Focus Index 둘 다 추가
    'Arousal': 0.70,
    'Relaxation Index': 0.70,  // Arousal은 Relaxation Index와 동일
    'Stress Index': 0.30,
    'Attention Level': 0.72,
    'Meditation Level': 0.68,
    'Hemispheric Balance': 0.0,
    'Cognitive Load': 0.55,
    'Emotional Stability': 0.90,
    'Signal Quality': 0.99,
  },
  ppg: {
    'BPM': 75,
    'HRV (ms)': 45,
    'RMSSD': 35,
    'PNN50': 25,
    'SDNN': 65,
    'VLF Power': 120,
    'LF Power': 600,
    'HF Power': 500,
    'LF Norm': 61,
    'HF Norm': 39,
    'LF/HF': 2.5,
    'Total Power': 1570,
    'Stress Level': 0.35,
    'Recovery Index': 78,
    'Autonomic Balance': 0.77,
    'Cardiac Coherence': 75,
    'Respiratory Rate': 14,
    'SpO2': 97,
    'AVNN': 860,
    'PNN20': 45,
    'SDSD': 38,
    'HR Max': 85,
    'HR Min': 65,
    'PPG Signal Quality': 1.0,
    'Motion Artifact': 0
  },
  acc: {
    'Activity Level': 1.2,
    'Movement Intensity': 0.1,
    'Postural Stability': 0.84,
    'Activity State': 0,  // SITTING
    'Stability': 78,  // 수정: 84 -> 78 (movementQuality 값)
    'Intensity': 0.17,  // 수정: 10 -> 0.17 (스케일 조정된 값)
    'Balance': 78,
    'Average Movement': 0.05,
    'Standard Deviation Movement': 0.02,
    'Max Movement': 0.15
  }
};

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({ 
  value, 
  metricName, 
  metricType 
}) => {
  // 값이 기본값인지 확인 (소수점 반올림 차이 고려)
  const isDefaultValue = (): boolean => {
    const defaults = DEFAULT_VALUES[metricType] || {};
    const defaultValue = defaults[metricName];
    
    if (defaultValue === undefined) {
      // 기본값이 정의되지 않은 경우 실제 측정값으로 간주
      return false;
    }
    
    // 정확히 일치하는 경우
    if (defaultValue === value) {
      return true;
    }
    
    // 소수점 반올림 차이를 고려한 비교 (0.001 이내의 차이는 동일한 것으로 간주)
    if (typeof value === 'number' && typeof defaultValue === 'number') {
      return Math.abs(value - defaultValue) < 0.001;
    }
    
    return false;
  };

  const isDefault = isDefaultValue();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center ml-1">
            {isDefault ? (
              <Database className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-green-600" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isDefault ? '기본값 (측정 데이터 없음)' : '실제 측정값'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};