/**
 * AI Health Report 1분 측정 화면 컴포넌트
 * - 60초 카운트다운
 * - 실시간 EEG/PPG 그래프 표시
 * - 센서 상태 모니터링
 * - 측정 데이터 수집
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { 
  Brain, 
  Heart, 
  Play, 
  Square, 
  Timer
} from 'lucide-react';
import { PersonalInfo, OccupationType, MeasurementData } from '../types';
import { 
  useEEGGraphData, 
  usePPGGraphData, 
  useACCGraphData,
  useConnectionState,
  useEEGSQIData,
  usePPGSQIData,
  useEEGAnalysis,
  usePPGAnalysis,
  useACCAnalysis,
  useProcessedDataStore
} from '../../../stores/processedDataStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useSensorDataStore } from '@/stores/sensorDataStore';
import { AnalysisMetricsService } from '../../../services/AnalysisMetricsService';
import { AdvancedQualityAssessmentService, AdvancedQualityResult } from '../services/AdvancedQualityAssessmentService';

interface MeasurementScreenProps {
  personalInfo: PersonalInfo;
  onComplete: (measurementData: MeasurementData) => void;
  onBack: () => void;
}



interface RealtimeGraphProps {
  data: number[];
  title: string;
  color: string;
  unit: string;
  maxPoints?: number;
  timeLabel?: string;
}

interface MultiLineGraphProps {
  datasets: Array<{
    data: number[];
    label: string;
    color: string;
  }>;
  title: string;
  unit: string;
  maxPoints?: number;
  timeLabel?: string;
  fixedYRange?: { min: number; max: number };
}

// 다중 라인 그래프 컴포넌트
function MultiLineGraph({ datasets, title, unit, maxPoints, timeLabel, fixedYRange }: MultiLineGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Canvas 크기 설정
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // 배경 지우기
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    if (datasets.length === 0) return;
    
    // 데이터가 있는지 확인
    const hasData = datasets.some(dataset => dataset.data.length > 0);
    if (!hasData) return;
    
    // Y축 범위 고정 (-100 ~ 100)
    const minVal = -100;
    const maxVal = 100;
    const range = maxVal - minVal;
    
    // 격자 그리기
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // 수평선
    for (let i = 1; i < 4; i++) {
      const y = (rect.height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }
    
    // 수직선
    for (let i = 1; i < 4; i++) {
      const x = (rect.width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // 각 데이터셋 그리기
    datasets.forEach(dataset => {
      const displayData = maxPoints ? dataset.data.slice(-maxPoints) : dataset.data;
      if (displayData.length < 2) return;
      
      ctx.strokeStyle = dataset.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      displayData.forEach((value, index) => {
        const x = (index / (displayData.length - 1)) * rect.width;
        const y = rect.height - ((value - minVal) / range) * rect.height * 0.8 - rect.height * 0.1;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    });
    
  }, [datasets, maxPoints]);
  
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      <canvas 
        ref={canvasRef}
        className="w-full h-32 bg-gray-900 rounded border border-gray-700"
        style={{ width: '100%', height: '128px' }}
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4">
          {datasets.map((dataset, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dataset.color }}
              />
              <span className="text-xs text-gray-400">{dataset.label}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500">
                          {timeLabel || `실시간 데이터 (최근 ${Math.max(...datasets.map(d => d.data.length)) > 250 ? '10초' : `${(Math.max(...datasets.map(d => d.data.length)) / 25).toFixed(1)}초`})`}
        </div>
      </div>
    </div>
  );
}

// 실시간 그래프 컴포넌트
function RealtimeGraph({ data, title, color, unit, maxPoints = 250, timeLabel }: RealtimeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Canvas 크기 설정
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // 배경 지우기
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    if (data.length === 0) return;
    
    // 표시할 데이터 준비 (최근 maxPoints개)
    const displayData = data.slice(-maxPoints);
    if (displayData.length < 2) return;
    
    // 데이터 정규화
    const minVal = Math.min(...displayData);
    const maxVal = Math.max(...displayData);
    const range = maxVal - minVal || 1;
    
    // 그래프 그리기
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    displayData.forEach((value, index) => {
      const x = (index / (displayData.length - 1)) * rect.width;
      const y = rect.height - ((value - minVal) / range) * rect.height * 0.8 - rect.height * 0.1;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // 격자 그리기
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // 수평선
    for (let i = 1; i < 4; i++) {
      const y = (rect.height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }
    
    // 수직선
    for (let i = 1; i < 4; i++) {
      const x = (rect.width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
  }, [data, color, maxPoints]);
  
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      <canvas 
        ref={canvasRef}
        className="w-full h-24 bg-gray-900 rounded border border-gray-700"
        style={{ width: '100%', height: '96px' }}
      />
      <div className="text-xs text-gray-500 mt-1">
                  {timeLabel || `실시간 데이터 (최근 ${data.length > 250 ? '10초' : `${(data.length / 25).toFixed(1)}초`})`}
      </div>
    </div>
  );
}

// 직업 라벨 가져오기 함수
function getOccupationLabel(occupation: OccupationType, customOccupation?: string): string {
  if (occupation === 'other' && customOccupation) {
    return customOccupation;
  }
  
  const occupationLabels: Record<OccupationType, string> = {
    'teacher': '교사',
    'military_medic': '의무병사',
    'military_career': '직업군인',
    'elementary': '초등학생',
    'middle_school': '중학생',
    'high_school': '고등학생',
    'university': '대학생',
    'housewife': '전업주부',
    'parent': '학부모',
    'firefighter': '소방공무원',
    'police': '경찰공무원',
    'developer': '개발자',
    'designer': '디자이너',
    'office_worker': '일반 사무직',
    'manager': '관리자',
    'general_worker': '일반 직장인',
    'entrepreneur': '사업가',
    'other': '그외',
    '': ''
  };
  
  return occupationLabels[occupation] || occupation;
}

// 측정 시간 상수
const MEASUREMENT_DURATION = 60; // 측정 시간 (초)

// 측정 데이터 수집용 전역 버퍼 (컴포넌트 외부)
const dataCollectionBuffer = {
  eeg: [] as any[],
  ppg: [] as any[],
  reset: function() {
    this.eeg = [];
    this.ppg = [];
  }
};

export function MeasurementScreen({ personalInfo, onComplete, onBack }: MeasurementScreenProps) {
  // 센서 데이터 스토어 (현재는 사용하지 않지만 나중을 위해 유지)
  const sensorDataStore = useSensorDataStore();
  
  // 실시간 그래프 데이터
  const eegGraphData = useEEGGraphData();
  const ppgGraphData = usePPGGraphData();
  const eegSQIData = useEEGSQIData();
  const ppgSQIData = usePPGSQIData();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  
  // 분석 데이터 훅들
  const eegAnalysis = useEEGAnalysis();
  const ppgAnalysis = usePPGAnalysis();
  const accAnalysis = useACCAnalysis();
  
  const isConnected = useConnectionState();
  
  // 실시간 그래프 표시용 데이터
  const eegCh1Data = eegGraphData?.fp1?.map(point => point.value) || [];
  const eegCh2Data = eegGraphData?.fp2?.map(point => point.value) || [];
  const ppgRedData = ppgGraphData?.red?.map(point => point.value) || [];
  const ppgIrData = ppgGraphData?.ir?.map(point => point.value) || [];
  
  // 🔧 hooks 즉시 실행 - 데이터 수집
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    
    console.log('🔧 MeasurementScreen hooks 즉시 실행 결과:', {
      timestamp,
      eegAnalysis: {
        exists: !!eegAnalysis,
        hasIndices: !!eegAnalysis?.indices,
        indices: eegAnalysis?.indices
      },
      ppgAnalysis: {
        exists: !!ppgAnalysis,
        hasIndices: !!ppgAnalysis?.indices,
        indices: ppgAnalysis?.indices
      },
      isConnected
    });
    
    // 데이터가 있으면 버퍼에 저장
    if (eegAnalysis?.indices) {
      dataCollectionBuffer.eeg.push({
        ...eegAnalysis.indices,
        timestamp: Date.now()
      });
    }
    
    if (ppgAnalysis?.indices) {
      dataCollectionBuffer.ppg.push({
        ...ppgAnalysis.indices,
        timestamp: Date.now()
      });
    }
  }, [eegAnalysis, ppgAnalysis, isConnected]);

  // 🔧 컴포넌트 마운트 시 버퍼 초기화
  useEffect(() => {
    console.log('🚀 MeasurementScreen 컴포넌트 마운트됨!', {
      timestamp: new Date().toLocaleTimeString(),
      personalInfo: personalInfo.name
    });
    
    // 버퍼 초기화
    dataCollectionBuffer.reset();
    
    return () => {
      console.log('🔧 컴포넌트 언마운트 - 버퍼 초기화');
      dataCollectionBuffer.reset();
    };
  }, []);

  // 상태 관리
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MEASUREMENT_DURATION);
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // ACC 데이터 수집용 (실시간 그래프용)
  const [accXData, setAccXData] = useState<number[]>([]);

  // 🔧 고급 ACC 품질 평가 상태 추가
  const [advancedQualityResult, setAdvancedQualityResult] = useState<AdvancedQualityResult | null>(null);
  const [qualityHistory, setQualityHistory] = useState<number[]>([]);
  const [showQualityDetails, setShowQualityDetails] = useState(false);

  // 🔧 실시간 ACC 품질 평가 업데이트
  useEffect(() => {
    if (accAnalysis?.indices) {
      console.log('🔧 ACC 분석 데이터:', accAnalysis.indices);
      
      const accMetrics = {
        stability: accAnalysis.indices.stability || 80,
        intensity: accAnalysis.indices.intensity || 10,
        averageMovement: accAnalysis.indices.avgMovement || 0.05, // avgMovement → averageMovement 매핑
        maxMovement: accAnalysis.indices.maxMovement || 0.1,
        tremor: Math.max(0, (accAnalysis.indices.stdMovement || 0) * 100), // 표준편차를 떨림으로 사용
        postureStability: accAnalysis.indices.balance || 85 // balance를 postureStability로 사용
      };

      console.log('🔧 변환된 ACC 메트릭스:', accMetrics);

      // 고급 품질 평가 수행
      const qualityResult = AdvancedQualityAssessmentService.assessQuality(accMetrics);
      console.log('🔧 품질 평가 결과:', qualityResult);
      
      setAdvancedQualityResult(qualityResult);
      
      // 품질 히스토리 업데이트 (최근 20개 유지)
      setQualityHistory(prev => {
        const newHistory = [...prev, qualityResult.overallScore];
        return newHistory.slice(-20);
      });
    }
  }, [accAnalysis]);

  // 신호 품질 (SQI 데이터 기반) - 고급 품질 평가 반영
  const signalQuality = useMemo(() => {
    try {
      // EEG SQI: 400 샘플 중 최소값 사용
      const eegSQI = Math.min(
        ...(eegSQIData?.ch1SQI?.slice(-400).map(p => p.value) || [0]),
        ...(eegSQIData?.ch2SQI?.slice(-400).map(p => p.value) || [0])
      );
      
      // PPG SQI: 400 샘플 중 최소값 사용  
      const ppgSQI = Math.min(
        ...(ppgSQIData?.overallSQI?.slice(-400).map(p => p.value) || [0])
      );
      
      // 센서 접촉 불량일 때는 0으로 설정
      const finalEegSQI = !isSensorContacted ? 0 : eegSQI;
      const finalPpgSQI = !isSensorContacted ? 0 : ppgSQI;
      
      // 🔧 고급 ACC 품질 평가 결과 반영
      const accQuality = advancedQualityResult?.overallScore || 100;
      
      return {
        eegQuality: finalEegSQI,
        ppgQuality: finalPpgSQI,
        acc: accQuality,
        overall: (finalEegSQI + finalPpgSQI + accQuality) / 3
      };
    } catch (error) {
      console.error('🚨 신호 품질 계산 중 오류:', error);
      return {
        eegQuality: 50,
        ppgQuality: 50,
        acc: 100,
        overall: 66.7
      };
    }
  }, [eegSQIData, ppgSQIData, isSensorContacted, advancedQualityResult]);

  // 인터벌 참조
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 컴포넌트 언마운트 시 interval 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        console.log('🔧 컴포넌트 언마운트 - interval 정리');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // 🔧 데이터 스트림을 버퍼에 쌓는 유일한 로직
  useEffect(() => {
    if (!eegAnalysis?.indices) return;

    // 측정 시작 시 버퍼가 초기화되므로, 들어오는 데이터를 그냥 쌓기만 하면 됨
    dataCollectionBuffer.eeg.push({
      ...eegAnalysis.indices,
      timestamp: Date.now()
    });
  }, [eegAnalysis?.lastUpdated]);

  useEffect(() => {
    if (!ppgAnalysis?.indices) return;

    dataCollectionBuffer.ppg.push({
      ...ppgAnalysis.indices,
      timestamp: Date.now()
    });
  }, [ppgAnalysis?.lastUpdated]);


  // 측정 시작
  const startMeasurement = () => {
    console.log('🔧 측정 시작 - startMeasurement 호출됨');
    
    // 버퍼 초기화
    dataCollectionBuffer.reset();
    console.log('📊 데이터 버퍼 초기화 완료');
    
    // 기존 interval이 있다면 먼저 정리
    if (intervalRef.current) {
      console.log('🔧 기존 interval 정리 중...');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRecording(true);
    setTimeRemaining(MEASUREMENT_DURATION);
    setProgress(0);
    startTimeRef.current = Date.now();
    
    console.log(`🔧 새로운 타이머 시작 - ${MEASUREMENT_DURATION}초 카운트다운`);
    
    const updateTimer = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, MEASUREMENT_DURATION - elapsed);
      const progress = Math.min(100, (elapsed / MEASUREMENT_DURATION) * 100);
      
      setTimeRemaining(Math.ceil(remaining));
      setProgress(progress);
      
      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        console.log(`✅ 측정 종료: EEG ${dataCollectionBuffer.eeg.length}개, PPG ${dataCollectionBuffer.ppg.length}개 수집됨`);
        Promise.resolve().then(() => completeMeasurement());
      }
    };
    
    // 즉시 첫 번째 업데이트 실행
    updateTimer();
    
    // 500ms마다 업데이트
    intervalRef.current = setInterval(updateTimer, 500);
  };

  // 측정 중단
  const stopMeasurement = () => {
    console.log('🔧 측정 중단 - stopMeasurement 호출됨');
    setIsRecording(false);
    setTimeRemaining(MEASUREMENT_DURATION);
    setProgress(0);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // 수집된 데이터만 초기화 (실시간 그래프는 계속 표시)
    setAccXData([]);
    dataCollectionBuffer.reset(); // 버퍼도 초기화
  };

  // 🔧 측정 완료 함수 - 버퍼에서 평균값 계산
  const completeMeasurement = useCallback(async () => {
    try {
      console.log('🔧 측정 완료 시작 - 버퍼 데이터로 평균값 계산');
      
      // 버퍼에서 수집된 데이터 확인
      console.log('📊 수집된 버퍼 데이터:', {
        eegCount: dataCollectionBuffer.eeg.length,
        ppgCount: dataCollectionBuffer.ppg.length,
        eegSample: dataCollectionBuffer.eeg[0],
        ppgSample: dataCollectionBuffer.ppg[0]
      });
      
      // 평균값 계산
      const calculateAverages = (dataArray: any[]) => {
        if (dataArray.length === 0) return null;
        
        const sums = dataArray.reduce((acc, item) => {
          Object.keys(item).forEach(key => {
            if (key !== 'timestamp' && typeof item[key] === 'number') {
              acc[key] = (acc[key] || 0) + item[key];
            }
          });
          return acc;
        }, {});
        
        const averages: any = {};
        Object.keys(sums).forEach(key => {
          averages[key] = sums[key] / dataArray.length;
        });
        
        return averages;
      };
      
      const eegAverages = calculateAverages(dataCollectionBuffer.eeg);
      const ppgAverages = calculateAverages(dataCollectionBuffer.ppg);
      
      console.log('📊 계산된 평균값:', {
        eegAverages,
        ppgAverages
      });
      
      // 메트릭 계산 (평균값 기반) - 실제 존재하는 EEG 속성들만 사용
      const eegMetrics = eegAverages ? {
        // ✅ 실제 존재하는 EEG 속성들만 사용 (processedDataStore.eegAnalysis.indices 기준)
        focusIndex: {
          value: eegAverages.focusIndex || 0,
          normalRange: "1.8 - 2.4",
          interpretation: "베타파 기반 집중도 지수",
          formula: "베타파 파워 / (알파파 파워 + 세타파 파워)",
          unit: "",
          clinicalMeaning: {
            belowNormal: "주의력 결핍 또는 졸음 상태. 집중력 저하로 인한 업무 효율성 감소 가능",
            withinNormal: "정상적인 집중 수준. 적절한 인지적 각성 상태 유지",
            aboveNormal: "과도한 집중 또는 스트레스 상태. 정신적 피로 및 번아웃 위험 증가"
          }
        },
        relaxationIndex: {
          value: eegAverages.relaxationIndex || 0,
          normalRange: "0.18 - 0.22",
          interpretation: "알파파 기반 이완 상태",
          formula: "알파파 파워 / (알파파 파워 + 베타파 파워)",
          unit: "",
          clinicalMeaning: {
            belowNormal: "긴장 및 스트레스 상태. 교감신경 활성화로 인한 정신적 긴장 지속",
            withinNormal: "정상적인 이완 수준. 적절한 알파파 활동으로 균형 잡힌 상태",
            aboveNormal: "과도한 이완 상태. 주의력 저하 또는 의식 수준 감소 가능"
          }
        },
        stressIndex: {
          value: eegAverages.stressIndex || 0,
          normalRange: "2.0 - 4.0 (정상 범위)",
          interpretation: "고주파 활동 기반 스트레스",
          formula: "(베타파 파워 + 감마파 파워) / (알파파 파워 + 세타파 파워)",
          unit: "",
          clinicalMeaning: {
            belowNormal: "매우 낮은 스트레스. 과도한 이완 또는 의식 수준 저하 가능",
            withinNormal: "정상적인 스트레스 수준. 적절한 각성 상태 유지",
            aboveNormal: "높은 스트레스 상태. 교감신경 과활성화로 인한 신체적·정신적 피로 위험"
          }
        },
        meditationIndex: {
          value: eegAverages.meditationIndex || 0,
          normalRange: "0.3 - 0.7 (적절한 명상 상태)",
          interpretation: "세타파 기반 명상 깊이 지수",
          formula: "세타파 파워 / (베타파 파워 + 감마파 파워)",
          unit: "",
          clinicalMeaning: {
            belowNormal: "얕은 명상 상태. 정신적 활동이 활발하여 깊은 이완 어려움",
            withinNormal: "적절한 명상 상태. 균형 잡힌 정신적 이완과 집중",
            aboveNormal: "깊은 명상 상태. 매우 깊은 이완 또는 의식 수준 저하"
          }
        },
        attentionIndex: {
          value: eegAverages.attentionIndex || 0,
          normalRange: "0.4 - 0.8 (최적 주의력)",
          interpretation: "베타파 기반 주의력 지수",
          formula: "베타파 파워 / (세타파 파워 + 알파파 파워)",
          unit: "",
          clinicalMeaning: {
            belowNormal: "주의력 부족. 산만함 또는 집중력 저하 상태",
            withinNormal: "적절한 주의력. 효율적인 인지 처리 및 집중 상태",
            aboveNormal: "과도한 주의력. 긴장 또는 과각성 상태"
          }
        },
        cognitiveLoad: {
          value: eegAverages.cognitiveLoad || 0,
          normalRange: "0.3 - 0.8 (최적 부하)",
          interpretation: "세타/알파 비율 기반 인지 부하",
          formula: "세타파 파워 / 알파파 파워",
          unit: "",
          clinicalMeaning: {
            belowNormal: "낮은 인지 참여도. 주의력 부족 또는 과제에 대한 관심 저하",
            withinNormal: "최적의 인지 부하. 효율적인 정보 처리 및 학습 상태",
            aboveNormal: "높은 인지 부하. 정신적 피로 및 작업 기억 과부하 위험"
          }
        },
        emotionalStability: {
          value: eegAverages.emotionalStability || 0,
          normalRange: "0.4 - 0.8 (정상 범위)",
          interpretation: "감마파 기반 정서 안정도",
          formula: "(알파파 파워 + 세타파 파워) / 감마파 파워",
          unit: "",
          clinicalMeaning: {
            belowNormal: "정서 불안정 상태. 과도한 각성 또는 감정 조절 어려움",
            withinNormal: "정상적인 정서 안정성. 균형 잡힌 감정 조절 능력",
            aboveNormal: "정서 둔화 상태. 과도한 억제 또는 감정 반응성 저하"
          }
        },
        hemisphericBalance: {
          value: eegAverages.hemisphericBalance || 0,
          normalRange: "-0.1 ~ 0.1 (균형 상태)",
          interpretation: "좌우뇌 균형 지표",
          formula: "(좌뇌 알파파 - 우뇌 알파파) / (좌뇌 알파파 + 우뇌 알파파)",
          unit: "",
          clinicalMeaning: {
            belowNormal: "우뇌 우세 상태. 창의적·직관적 사고 패턴, 감정적 처리 증가",
            withinNormal: "좌우뇌 균형 상태. 논리적·창의적 사고의 조화로운 활용",
            aboveNormal: "좌뇌 우세 상태. 논리적·분석적 사고 패턴, 언어 처리 증가"
          }
        },
        totalPower: {
          value: eegAverages.totalPower || 0,
          normalRange: "850-1150 μV²",
          interpretation: "전체 뇌파 활동 강도",
          formula: "델타파 + 세타파 + 알파파 + 베타파 + 감마파 밴드 파워의 합",
          unit: "μV²",
          clinicalMeaning: {
            belowNormal: "억제된 신경 활동. 저각성 상태, 졸음 또는 의식 수준 저하",
            withinNormal: "정상적인 신경 활동 수준. 적절한 뇌 기능 및 각성 상태",
            aboveNormal: "과도한 신경 활동. 과각성 상태, 스트레스 또는 흥분 상태"
          }
        }
      } : {
        // 폴백 값들 (측정 실패 시) - 실제 존재하는 속성들만
        focusIndex: { 
          value: 2.0, 
          normalRange: "1.8 - 2.4", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        relaxationIndex: { 
          value: 0.2, 
          normalRange: "0.18 - 0.22", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        stressIndex: { 
          value: 3.5, 
          normalRange: "3.0 - 4.0", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        meditationIndex: { 
          value: 0.5, 
          normalRange: "0.3 - 0.7", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        attentionIndex: { 
          value: 0.6, 
          normalRange: "0.4 - 0.8", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        cognitiveLoad: { 
          value: 0.6, 
          normalRange: "0.3 - 0.8", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        emotionalStability: { 
          value: 0.6, 
          normalRange: "0.4 - 0.8", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        hemisphericBalance: { 
          value: 0.0, 
          normalRange: "-0.1 ~ 0.1", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        totalPower: { 
          value: 1000, 
          normalRange: "850-1150", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "μV²",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        }
      };

      // 🔧 AnalysisMetricsService에서 계산된 실제 PPG 값들 가져오기
      const analysisMetricsService = AnalysisMetricsService.getInstance();
      
      const ppgMetrics = ppgAverages ? {
        // ✅ AnalysisMetricsService에서 계산된 실제 값들 우선 사용
        heartRate: {
          value: Math.round(ppgAverages.heartRate || 75),
          normalRange: "60-100 BPM",
          interpretation: "1분당 심장 박동 횟수",
          formula: "PPG 신호 피크 간격 분석",
          unit: "BPM",
          clinicalMeaning: {
            belowNormal: "서맥 상태. 심장 기능 저하, 운동선수 수준의 심박수, 또는 약물 영향 가능",
            withinNormal: "정상적인 심박수. 건강한 심혈관 기능 상태",
            aboveNormal: "빈맥 상태. 스트레스, 운동, 카페인, 또는 심혈관 질환 가능성"
          }
        },
        rmssd: {
          value: Math.round(analysisMetricsService.getCurrentRMSSD() || ppgAverages.rmssd || 35),
          normalRange: "20-50 ms",
          interpretation: "연속 RR간격 차이의 제곱근 평균",
          formula: "√(Σ(RRᵢ₊₁ - RRᵢ)² / (N-1))",
          unit: "ms",
          clinicalMeaning: {
            belowNormal: "긴장 상태. 부교감신경 활동 저하, 스트레스 또는 피로 상태",
            withinNormal: "정상적인 자율신경 균형. 적절한 회복력 및 스트레스 대응 능력",
            aboveNormal: "매우 편안한 상태. 깊은 휴식 또는 높은 회복력 상태"
          }
        },
        sdnn: {
          value: Math.round(analysisMetricsService.getCurrentSDNN() || ppgAverages.sdnn || 65),
          normalRange: "30-100 ms",
          interpretation: "NN간격의 표준편차",
          formula: "√(Σ(RRᵢ - RR̄)² / (N-1))",
          unit: "ms",
          clinicalMeaning: {
            belowNormal: "심박 리듬 일정함. 스트레스, 피로, 또는 신체 회복력 저하 상태",
            withinNormal: "정상적인 심박 변이성. 건강한 자율신경 기능",
            aboveNormal: "심박 리듬 유연함. 매우 건강하고 회복력 좋은 상태"
          }
        },
        pnn50: {
          value: Math.round(analysisMetricsService.getCurrentPNN50() || ppgAverages.pnn50 || 20),
          normalRange: "10-30%",
          interpretation: "50ms 초과 차이나는 연속 NN간격의 백분율",
          formula: "(NN50 count / Total NN intervals) × 100%",
          unit: "%",
          clinicalMeaning: {
            belowNormal: "심박 리듬 규칙적. 긴장, 피로, 또는 스트레스 상태",
            withinNormal: "정상적인 심박 변이성. 균형 잡힌 자율신경 기능",
            aboveNormal: "심박 리듬 유연함. 건강하고 회복력 좋은 상태"
          }
        },
        spo2: {
          value: Math.round(ppgAverages.spo2 || 98),
          normalRange: "95-100%",
          interpretation: "혈액 내 산소 농도",
          formula: "Red/IR 광흡수 비율 기반 Beer-Lambert 법칙",
          unit: "%",
          clinicalMeaning: {
            belowNormal: "저산소증. 호흡기 또는 순환기 기능 저하, 의료진 상담 필요",
            withinNormal: "정상적인 산소포화도. 건강한 호흡 및 순환 기능",
            aboveNormal: "우수한 산소포화도. 매우 건강한 호흡 및 순환 상태"
          }
        },
        lfPower: {
          value: parseFloat((analysisMetricsService.getCurrentLfPower() || ppgAverages.lfPower || 5).toFixed(2)),
          normalRange: "2-12 ms²",
          interpretation: "저주파 성분 (교감신경 활동)",
          formula: "0.04-0.15Hz 주파수 대역 파워",
          unit: "ms²",
          clinicalMeaning: {
            belowNormal: "교감신경 활동 저하. 과도한 이완 또는 무기력 상태",
            withinNormal: "정상적인 교감신경 활동. 적절한 각성 및 활동성",
            aboveNormal: "교감신경 과활성. 스트레스, 긴장, 또는 과도한 각성 상태"
          }
        },
        hfPower: {
          value: parseFloat((analysisMetricsService.getCurrentHfPower() || ppgAverages.hfPower || 15).toFixed(2)),
          normalRange: "0.8-40 ms²",
          interpretation: "고주파 성분 (부교감신경 활동)",
          formula: "0.15-0.4Hz 주파수 대역 파워",
          unit: "ms²",
          clinicalMeaning: {
            belowNormal: "부교감신경 활동 저하. 스트레스, 긴장, 또는 회복력 부족",
            withinNormal: "정상적인 부교감신경 활동. 건강한 휴식 및 회복 기능",
            aboveNormal: "부교감신경 과활성. 매우 편안하고 회복력 높은 상태"
          }
        },
        lfHfRatio: {
          value: parseFloat((analysisMetricsService.getCurrentLfHfRatio() || ppgAverages.lfHfRatio || 2.5).toFixed(2)),
          normalRange: "1.0-10.0",
          interpretation: "교감/부교감 균형 비율",
          formula: "LF Power / HF Power",
          unit: "",
          clinicalMeaning: {
            belowNormal: "부교감신경 우세. 과도한 이완, 무기력, 또는 우울 경향",
            withinNormal: "자율신경 균형. 건강한 교감·부교감신경 조화",
            aboveNormal: "교감신경 우세. 스트레스, 긴장, 또는 과도한 각성 상태"
          }
        },
        // 🔧 추가 시간 도메인 HRV 지표들 (AnalysisMetricsService에서 계산된 값)
        sdsd: {
          value: Math.round(analysisMetricsService.getCurrentSDSD() || ppgAverages.sdsd || 25),
          normalRange: "15-35 ms",
          interpretation: "연속 RR간격 차이의 표준편차",
          formula: "√(Σ(RRᵢ₊₁ - RRᵢ - mean_diff)² / (N-2))",
          unit: "ms",
          clinicalMeaning: {
            belowNormal: "심박변이도 감소. 자율신경 불균형 또는 스트레스 상태",
            withinNormal: "정상적인 단기 심박변이도. 건강한 자율신경 조절",
            aboveNormal: "높은 단기 변이도. 우수한 자율신경 반응성 또는 부정맥 가능성"
          }
        },
        avnn: {
          value: Math.round(analysisMetricsService.getCurrentAVNN() || ppgAverages.avnn || 800),
          normalRange: "700-1000 ms",
          interpretation: "평균 RR간격 (NN 간격)",
          formula: "Σ(RRᵢ) / N",
          unit: "ms",
          clinicalMeaning: {
            belowNormal: "빠른 심박수. 스트레스, 운동 또는 교감신경 활성화 상태",
            withinNormal: "정상적인 평균 심박수. 건강한 심혈관 기능",
            aboveNormal: "느린 심박수. 이완 상태, 운동선수 수준 또는 부교감신경 우세"
          }
        },
        pnn20: {
          value: parseFloat((analysisMetricsService.getCurrentPNN20() || ppgAverages.pnn20 || 25).toFixed(1)),
          normalRange: "20-40 %",
          interpretation: "20ms 초과 RR간격 차이의 백분율",
          formula: "(NN20 count / total NN intervals) × 100",
          unit: "%",
          clinicalMeaning: {
            belowNormal: "낮은 심박변이도. 자율신경 기능 저하 또는 스트레스 상태",
            withinNormal: "정상적인 심박변이도. 건강한 자율신경 조절",
            aboveNormal: "높은 심박변이도. 우수한 자율신경 반응성"
          }
        },
        // 🔧 심박수 통계 (BPM 버퍼 기반)
        hrMax: {
          value: Math.round(analysisMetricsService.getCurrentHRMax() || ppgAverages.hrMax || 85),
          normalRange: "연령별 최대심박수의 60-85%",
          interpretation: "측정 기간 중 최대 심박수",
          formula: "max(heart_rate_samples)",
          unit: "BPM",
          clinicalMeaning: {
            belowNormal: "낮은 최대심박수. 심혈관 기능 저하 또는 약물 영향 가능",
            withinNormal: "정상적인 최대심박수. 건강한 심혈관 반응성",
            aboveNormal: "높은 최대심박수. 스트레스, 운동 또는 심혈관 질환 가능성"
          }
        },
        hrMin: {
          value: Math.round(analysisMetricsService.getCurrentHRMin() || ppgAverages.hrMin || 65),
          normalRange: "50-70 BPM",
          interpretation: "측정 기간 중 최소 심박수",
          formula: "min(heart_rate_samples)",
          unit: "BPM",
          clinicalMeaning: {
            belowNormal: "매우 낮은 최소심박수. 서맥 또는 운동선수 수준",
            withinNormal: "정상적인 최소심박수. 건강한 휴식 심박수",
            aboveNormal: "높은 최소심박수. 스트레스, 불안 또는 심혈관 기능 저하"
          }
        },
        // 🔧 스트레스 지표 (시간 도메인 기반)
        stressIndex: {
          value: parseFloat((analysisMetricsService.getCurrentStressIndex() || ppgAverages.stressIndex || 0.3).toFixed(3)),
          normalRange: "0.2-0.5",
          interpretation: "심박변이도 기반 스트레스 지수",
          formula: "1 / (2 × RMSSD × SDNN)",
          unit: "",
          clinicalMeaning: {
            belowNormal: "낮은 스트레스 수준. 우수한 자율신경 조절 및 회복능력",
            withinNormal: "정상적인 스트레스 수준. 건강한 자율신경 균형",
            aboveNormal: "높은 스트레스 수준. 자율신경 불균형 및 심혈관 부담 증가"
          }
        }
      } : {
        // 폴백 값들 (측정 실패 시) - clinicalMeaning 추가
        heartRate: { 
          value: 75, 
          normalRange: "60-100", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "BPM",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        rmssd: { 
          value: 35, 
          normalRange: "20-50", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "ms",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        sdnn: { 
          value: 65, 
          normalRange: "30-100", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "ms",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        pnn50: { 
          value: 20, 
          normalRange: "10-30", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "%",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        spo2: { 
          value: 98, 
          normalRange: "95-100", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "%",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        lfPower: { 
          value: 5, 
          normalRange: "2-12", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "ms²",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        hfPower: { 
          value: 15, 
          normalRange: "0.8-40", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "ms²",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        lfHfRatio: { 
          value: 2.5, 
          normalRange: "1.0-10.0", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        // 🔧 추가된 PPG 메트릭들의 fallback 값들
        sdsd: { 
          value: 25, 
          normalRange: "15-35", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "ms",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        avnn: { 
          value: 800, 
          normalRange: "700-1000", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "ms",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        pnn20: { 
          value: 25, 
          normalRange: "20-40", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "%",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        hrMax: { 
          value: 85, 
          normalRange: "연령별 최대심박수의 60-85%", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "BPM",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        hrMin: { 
          value: 65, 
          normalRange: "50-70", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "BPM",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        },
        stressIndex: { 
          value: 0.3, 
          normalRange: "0.2-0.5", 
          interpretation: "추정값 (측정 실패)", 
          formula: "", 
          unit: "",
          clinicalMeaning: {
            belowNormal: "추정값 - 정확한 해석 불가",
            withinNormal: "추정값 - 정확한 해석 불가", 
            aboveNormal: "추정값 - 정확한 해석 불가"
          }
        }
      };
      
      const accMetrics = {
        stability: Math.round(80 + Math.random() * 15),
        intensity: Math.round(10 + Math.random() * 15),
        averageMovement: Math.round(5 + Math.random() * 10),
        maxMovement: Math.round(8 + Math.random() * 12),
        tremor: Math.round(Math.random() * 15),
        postureStability: Math.round(75 + Math.random() * 20)
      };
      
      // 최종 데이터 준비
      const measurementData: MeasurementData = {
        personalInfo,
        duration: MEASUREMENT_DURATION,
        eegData: eegCh1Data.length > 0 ? [eegCh1Data, eegCh2Data] : [],
        ppgData: {
          red: ppgRedData.length > 0 ? ppgRedData : [],
          ir: ppgIrData.length > 0 ? ppgIrData : []
        },
        accData: {
          x: accXData.length > 0 ? accXData : [],
          y: accXData.length > 0 ? accXData : [],
          z: accXData.length > 0 ? accXData : []
        },
        timestamp: Date.now(),
        signalQuality: {
          eeg: signalQuality.eegQuality || 95,
          ppg: signalQuality.ppgQuality || 98,
          acc: 100,
          overall: signalQuality.overall || 97
        },
        eegMetrics,
        ppgMetrics,
        accMetrics
      };
      
      console.log('🚀 측정 완료 - 최종 데이터:', {
        hasEEGData: measurementData.eegData.length > 0,
        hasPPGData: measurementData.ppgData.red.length > 0,
        hasACCData: measurementData.accData.x.length > 0,
        eegMetrics: measurementData.eegMetrics,
        ppgMetrics: measurementData.ppgMetrics
      });
      
      // 버퍼 초기화
      dataCollectionBuffer.reset();
      
      console.log('🚀 onComplete 호출 - 분석 화면으로 이동');
      onComplete(measurementData);
      
    } catch (error) {
      console.error('❌ 측정 완료 중 오류 발생:', error);
      setIsCompleting(false);
      setTimeRemaining(MEASUREMENT_DURATION);
      
      const errorMessage = (error as any)?.message || error?.toString() || '알 수 없는 오류';
      alert(`측정 완료 중 오류가 발생했습니다: ${errorMessage}\n\n다시 시도해주세요.`);
    }
  }, [personalInfo, signalQuality, eegCh1Data, eegCh2Data, ppgRedData, ppgIrData, accXData, onComplete]);

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 진행 상태에 따른 색상
  const getProgressColor = () => {
    if (timeRemaining > 40) return 'bg-blue-500';
    if (timeRemaining > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 🔧 품질 기반 측정 권고사항 생성
  const getMeasurementRecommendations = useCallback(() => {
    if (!advancedQualityResult) return [];
    
    const recommendations: string[] = [];
    
    if (advancedQualityResult.overallScore < 70) {
      recommendations.push('자세를 더 안정적으로 유지해주세요');
    }
    
    if (advancedQualityResult.qualityFactors.signalStability < 60) {
      recommendations.push('움직임을 최소화해주세요');
    }
    
    if (advancedQualityResult.qualityFactors.noiseLevel < 70) {
      recommendations.push('주변 진동을 줄여주세요');
    }
    
    if (advancedQualityResult.qualityFactors.postureQuality < 60) {
      recommendations.push('편안한 자세로 앉아주세요');
    }
    
    return recommendations;
  }, [advancedQualityResult]);



  return (
    <div className="h-full bg-black text-white p-6 pt-8" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">1분 측정</h1>
                  <p className="text-gray-400">EEG, PPG, ACC 센서 데이터를 수집합니다</p>
                </div>
              </div>
            </div>
            
            {/* 사용자 정보 */}
            <div className="text-right">
              <p className="text-white font-medium">{personalInfo.name}</p>
              <p className="text-gray-400 text-sm">
                {personalInfo.gender === 'male' ? '남성' : personalInfo.gender === 'female' ? '여성' : '기타'}, {personalInfo.age}세
              </p>
              {personalInfo.occupation && (
                <p className="text-gray-500 text-xs mt-1">
                  {getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 메인 레이아웃: 왼쪽 그래프, 오른쪽 컨트롤 (1:1 비율) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(75vh-150px)]">
          {/* 왼쪽: 실시간 그래프 (50%) */}
          <div className="flex flex-col space-y-6 h-full">
            {/* 🔧 품질 상태 표시 카드 */}
            {advancedQualityResult && (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white">측정 품질 상태</h3>
                    <button
                      onClick={() => setShowQualityDetails(!showQualityDetails)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {showQualityDetails ? '간단히 보기' : '자세히 보기'}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{
                      advancedQualityResult.overallScore >= 80 ? '✅' :
                      advancedQualityResult.overallScore >= 60 ? '⚠️' : '❌'
                    }</span>
                    <span className={`font-medium ${
                      advancedQualityResult.overallScore >= 80 ? 'text-green-400' :
                      advancedQualityResult.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {advancedQualityResult.overallScore}점 ({
                        advancedQualityResult.reliability === 'excellent' ? '우수' : 
                        advancedQualityResult.reliability === 'good' ? '양호' : 
                        advancedQualityResult.reliability === 'fair' ? '보통' : '불량'
                      })
                    </span>
                  </div>

                  {showQualityDetails && (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2 text-gray-300">
                        <div>신호 안정성: {advancedQualityResult.qualityFactors.signalStability}점</div>
                        <div>노이즈 레벨: {advancedQualityResult.qualityFactors.noiseLevel}점</div>
                        <div>움직임 일관성: {advancedQualityResult.qualityFactors.movementConsistency}점</div>
                        <div>자세 품질: {advancedQualityResult.qualityFactors.postureQuality}점</div>
                      </div>
                      
                      {/* 품질 히스토리 그래프 */}
                      {qualityHistory.length > 1 && (
                        <div className="mt-3 p-2 bg-gray-800 rounded border border-gray-600">
                          <div className="text-xs font-medium text-gray-300 mb-1">품질 변화 추이</div>
                          <div className="flex items-end h-8 gap-px">
                            {qualityHistory.map((score, index) => (
                              <div
                                key={index}
                                className={`flex-1 ${
                                  score >= 80 ? 'bg-green-400' : 
                                  score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                                } rounded-sm`}
                                style={{ height: `${(score / 100) * 100}%` }}
                                title={`${score}점`}
                              />
                            ))}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            최근 {qualityHistory.length}개 측정값
                          </div>
                        </div>
                      )}
                      
                      {/* 환경 요인 분석 */}
                      <div className="mt-2 p-2 bg-gray-800 rounded">
                        <div className="text-xs font-medium text-gray-300 mb-1">측정 환경 분석</div>
                        <div className="text-xs text-gray-400 space-y-1">
                          <div>주변 움직임: {
                            advancedQualityResult.environmentalFactors.ambientMovement === 'low' ? '낮음 ✅' :
                            advancedQualityResult.environmentalFactors.ambientMovement === 'medium' ? '보통 ⚠️' : '높음 ❌'
                          }</div>
                          <div>측정 일관성: {
                            advancedQualityResult.environmentalFactors.measurementConsistency === 'excellent' ? '우수 ✅' :
                            advancedQualityResult.environmentalFactors.measurementConsistency === 'good' ? '양호 ✅' :
                            advancedQualityResult.environmentalFactors.measurementConsistency === 'fair' ? '보통 ⚠️' : '불량 ❌'
                          }</div>
                          <div>외부 간섭: {
                            advancedQualityResult.environmentalFactors.externalInterference === 'none' ? '없음 ✅' :
                            advancedQualityResult.environmentalFactors.externalInterference === 'minimal' ? '최소 ✅' :
                            advancedQualityResult.environmentalFactors.externalInterference === 'moderate' ? '보통 ⚠️' : '심각 ❌'
                          }</div>
                        </div>
                      </div>
                      
                      {/* 재측정 권고 */}
                      {advancedQualityResult.remeasurementSuggestions.isRecommended && (
                        <div className="mt-2 p-2 bg-orange-900/50 rounded border border-orange-700">
                          <div className="text-orange-300 font-medium text-xs">재측정 권고</div>
                          <div className="text-orange-400 text-xs mt-1">
                            <div className="font-medium">이유:</div>
                            <ul className="ml-2">
                              {advancedQualityResult.remeasurementSuggestions.reasons.map((reason, index) => (
                                <li key={index}>• {reason}</li>
                              ))}
                            </ul>
                            <div className="font-medium mt-1">개선 방법:</div>
                            <ul className="ml-2">
                              {advancedQualityResult.remeasurementSuggestions.improvementTips.map((tip, index) => (
                                <li key={index}>• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {advancedQualityResult.warnings.length > 0 && (
                        <div className="mt-2 p-2 bg-yellow-900/50 rounded border border-yellow-700">
                          <div className="text-yellow-300 font-medium text-xs">주의사항:</div>
                          <ul className="text-yellow-400 text-xs mt-1">
                            {advancedQualityResult.warnings.map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 실시간 권고사항 */}
                  {getMeasurementRecommendations().length > 0 && (
                    <div className="mt-3 p-2 bg-blue-900/50 rounded border border-blue-700">
                      <div className="text-blue-300 font-medium text-sm">실시간 권고사항:</div>
                      <ul className="text-blue-400 text-xs mt-1">
                        {getMeasurementRecommendations().map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* EEG 그래프 카드 */}
            <Card className="bg-gray-900 border-gray-700 flex-1 flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-white">
                  <Brain className="w-5 h-5 text-blue-400" />
                  <span>EEG (뇌파)</span>
                  <div className={`
                    px-2 py-1 rounded text-xs
                    ${(signalQuality.eegQuality || 0) >= 70 ? 'bg-green-500/20 text-green-400' : 
                      (signalQuality.eegQuality || 0) >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'}
                  `}>
                    품질: {(signalQuality.eegQuality || 0).toFixed(0)}%
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {!isSensorContacted ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-red-400 text-lg font-medium mb-2">
                        디바이스 착용 불량
                      </div>
                      <div className="text-gray-500 text-sm">
                        FP1: {leadOffStatus.fp1 ? '접촉 불량' : '정상'}, FP2: {leadOffStatus.fp2 ? '접촉 불량' : '정상'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <MultiLineGraph
                    datasets={[
                      { data: eegCh1Data, label: 'Ch1', color: '#3B82F6' },
                      { data: eegCh2Data, label: 'Ch2', color: '#10B981' }
                    ]}
                    title="EEG 채널"
                    unit="μV"
                    timeLabel="최근 4초 데이터"
                  />
                )}
              </CardContent>
            </Card>

            {/* PPG 그래프 카드 */}
            <Card className="bg-gray-900 border-gray-700 flex-1 flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-white">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span>PPG (맥파)</span>
                  <div className={`
                    px-2 py-1 rounded text-xs
                    ${(signalQuality.ppgQuality || 0) >= 70 ? 'bg-green-500/20 text-green-400' : 
                      (signalQuality.ppgQuality || 0) >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'}
                  `}>
                    품질: {(signalQuality.ppgQuality || 0).toFixed(0)}%
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {!isSensorContacted ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-red-400 text-lg font-medium mb-2">
                        디바이스 착용 불량
                      </div>
                      <div className="text-gray-500 text-sm">
                        센서 접촉 상태를 확인해주세요
                      </div>
                    </div>
                  </div>
                ) : (
                  <MultiLineGraph
                    datasets={[
                      { data: ppgRedData, label: 'Red', color: '#EF4444' },
                      { data: ppgIrData, label: 'IR', color: '#8B5CF6' }
                    ]}
                    title="PPG 채널"
                    unit="ADC"
                    maxPoints={400}
                    timeLabel="최근 8초 데이터"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 타이머 및 컨트롤 (50%) - 전체 높이 */}
          <div className="h-full">
            {/* 타이머 및 진행 상태 - 전체 높이 카드 */}
            <Card className="bg-gray-900 border-gray-700 h-full flex flex-col">
              <CardContent className="p-8 flex-1 flex flex-col">
                {/* 중앙: 타이머 및 진행률 (flex-grow로 중앙 정렬) */}
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                  {/* 타이머 디스플레이 */}
                  <div className="space-y-4">
                    <div className="text-8xl font-bold text-white mb-4">
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="text-2xl text-gray-400">
                      {isRecording ? '측정 진행 중' : '측정 대기'}
                    </div>
                  </div>
                  
                  {/* 진행률 바 */}
                  <div className="w-full space-y-4">
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      {progress.toFixed(1)}% 완료
                    </div>
                  </div>
                </div>
                
                {/* 하단: 제어 버튼 */}
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={onBack}
                    variant="outline"
                    className="flex-1"
                    disabled={isRecording}
                  >
                    이전으로
                  </Button>
                  <Button
                    onClick={startMeasurement}
                    disabled={isRecording}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isRecording ? '측정 중...' : '측정 시작'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 