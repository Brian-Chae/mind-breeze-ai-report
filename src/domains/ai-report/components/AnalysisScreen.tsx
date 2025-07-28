import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Brain, Activity, Settings, Sparkles, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import measurementUserIntegrationService from '@domains/individual/services/MeasurementUserIntegrationService';
import measurementUserManagementService from '@domains/individual/services/MeasurementUserManagementService';

// 타입들을 AIHealthReportApp에서 임포트
type PersonalInfo = {
  name: string;
  email?: string;
  birthDate?: Date;
  gender?: '남성' | '여성' | '기타';
  occupation?: string;
  department?: string;
  healthConditions?: string[];
};

type AggregatedMeasurementData = {
  eegSummary?: any;
  ppgSummary?: any;
  accSummary?: any;
  qualitySummary?: any;
  measurementInfo?: any;
  sessionId?: string;
  savedAt?: Date;
};

type AIAnalysisResponse = {
  reportId: string;
  personalInfo: PersonalInfo;
  measurementUserId?: string | null; // 🔥 MeasurementUser ID 추가
  analysisResults: {
    mentalHealthScore: number;
    physicalHealthScore: number;
    stressLevel: number;
    recommendations: string[];
    detailedAnalysis: string;
  };
  generatedAt: Date;
  reliability: string;
  engineInfo?: {
    engineId: string;
    engineName: string;
    engineVersion: string;
    processingTime: number;
    costUsed: number;
  };
};
import { IAIEngine } from '../core/interfaces/IAIEngine';
import { aiEngineRegistry } from '../ai-engines';
import EngineSelectionModal from './EngineSelectionModal';

interface AnalysisScreenProps {
  onComplete: (result: AIAnalysisResponse) => void;
  onBack: () => void;
  onError: (error: string) => void;
  personalInfo: PersonalInfo;
  measurementData: AggregatedMeasurementData;
}

type AnalysisState = 'engine-selection' | 'analyzing' | 'completed' | 'error';

export function AnalysisScreen({ onComplete, onBack, onError, personalInfo, measurementData }: AnalysisScreenProps) {
  const [state, setState] = useState<AnalysisState>('engine-selection');
  const [selectedEngine, setSelectedEngine] = useState<IAIEngine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [availableCredits] = useState(100); // TODO: 실제 사용자 크레딧으로 교체

  // 자동으로 추천 엔진 선택
  useEffect(() => {
    const engines = aiEngineRegistry.getAll();
    if (engines.length > 0) {
      // 데이터 타입 기반으로 가장 호환성 높은 엔진 선택
      const compatibleEngines = engines.filter(engine => {
        const hasEEG = measurementData.eegSummary && engine.supportedDataTypes.eeg;
        const hasPPG = measurementData.ppgSummary && engine.supportedDataTypes.ppg;
        const hasACC = measurementData.accSummary && engine.supportedDataTypes.acc;
        
        return hasEEG || hasPPG || hasACC;
      });
      
      // 비용이 저렴한 순으로 정렬 후 첫 번째 선택
      compatibleEngines.sort((a, b) => a.costPerAnalysis - b.costPerAnalysis);
      
      if (compatibleEngines.length > 0) {
        setSelectedEngine(compatibleEngines[0]);
      }
    }
  }, [measurementData]);

  const handleEngineSelect = (engine: IAIEngine) => {
    setSelectedEngine(engine);
    setIsModalOpen(false);
    // 엔진 선택 후 바로 분석 시작하지 않고 사용자가 시작 버튼을 누르도록 함
  };

  const startAnalysis = async () => {
    if (!selectedEngine) {
      onError('분석 엔진이 선택되지 않았습니다.');
      return;
    }

    setState('analyzing');
    setAnalysisProgress(0);
    setAnalysisStatus('사용자 정보 처리 중...');

    try {
      console.log('🔍 AI 분석 시작 - 원본 measurementData:', measurementData);
      console.log('🔍 AI 분석 시작 - personalInfo:', personalInfo);

      // 🔥 0. MeasurementUser 찾기/생성 및 연결
      let measurementUserId: string | null = null;
      if (personalInfo && personalInfo.email) {
        try {
          measurementUserId = await measurementUserIntegrationService.findOrCreateMeasurementUser(
            personalInfo,
            'default' // organizationId는 서비스 내부에서 처리
          );
          console.log('✅ MeasurementUser 연결 완료:', measurementUserId);
        } catch (error) {
          console.error('⚠️ MeasurementUser 연결 실패:', error);
          // MeasurementUser 연결 실패해도 분석은 계속 진행
        }
      }

      setAnalysisProgress(5);
      setAnalysisStatus('데이터 검증 중...');

      // 1. 측정 데이터를 AI 엔진이 기대하는 형식으로 변환
      setAnalysisProgress(10);
      const convertedMeasurementData = {
        eegMetrics: {
          delta: measurementData.eegSummary?.deltaPower || 0.25,
          theta: measurementData.eegSummary?.thetaPower || 0.30,
          alpha: measurementData.eegSummary?.alphaPower || 0.35,
          beta: measurementData.eegSummary?.betaPower || 0.40,
          gamma: measurementData.eegSummary?.gammaPower || 0.15,
          
          attentionIndex: measurementData.eegSummary?.attentionLevel || measurementData.eegSummary?.focusIndex || 75,
          meditationIndex: measurementData.eegSummary?.meditationLevel || measurementData.eegSummary?.relaxationIndex || 80,
          stressIndex: measurementData.eegSummary?.stressIndex || 25,
          fatigueIndex: 100 - (measurementData.eegSummary?.focusIndex || 75),
          
          signalQuality: (measurementData.eegSummary?.averageSQI || 85) / 100,
          artifactRatio: 0.1,
          
          // 추가 메트릭들
          hemisphericBalance: measurementData.eegSummary?.hemisphericBalance || 0.95,
          cognitiveLoad: measurementData.eegSummary?.cognitiveLoad || 60,
          emotionalStability: measurementData.eegSummary?.emotionalStability || 85
        },
        ppgMetrics: {
          heartRate: { value: measurementData.ppgSummary?.heartRate || 72 },
          rmssd: { value: measurementData.ppgSummary?.rmssd || 35 },
          sdnn: { value: measurementData.ppgSummary?.sdnn || 50 },
          lfHfRatio: { value: measurementData.ppgSummary?.lfHfRatio || 2.5 },
          spo2: { value: measurementData.ppgSummary?.oxygenSaturation || 98 },
          
          heartRateVariability: measurementData.ppgSummary?.hrv || 45,
          rrIntervals: [],
          stressScore: (measurementData.ppgSummary?.stressLevel || 0.3) * 100,
          autonomicBalance: measurementData.ppgSummary?.autonomicBalance || 0.8,
          signalQuality: (measurementData.ppgSummary?.averageSQI || 90) / 100,
          motionArtifact: 0.1
        },
        accMetrics: {
          activityLevel: measurementData.accSummary?.activityLevel || 20,
          movementVariability: measurementData.accSummary?.movementQuality || 85,
          postureStability: measurementData.accSummary?.posturalStability || 85,
          movementIntensity: measurementData.accSummary?.energyExpenditure || 120,
          posture: 'UNKNOWN' as const,
          movementEvents: []
        },
        dataQuality: {
          overallScore: measurementData.qualitySummary?.qualityPercentage || 85,
          eegQuality: measurementData.eegSummary?.averageSQI || 85,
          ppgQuality: measurementData.ppgSummary?.averageSQI || 90,
          motionInterference: 20,
          usableForAnalysis: (measurementData.qualitySummary?.qualityPercentage || 85) >= 70,
          qualityIssues: [],
          overallQuality: measurementData.qualitySummary?.qualityPercentage || 85,
          sensorContact: true,
          signalStability: measurementData.qualitySummary?.measurementReliability === 'high' ? 1.0 : 0.8,
          artifactLevel: 0.1
        }
      };

      // 2. 개인정보를 AI 엔진이 기대하는 형식으로 변환
      const convertedPersonalInfo = {
        name: personalInfo.name,
        age: personalInfo.birthDate ? new Date().getFullYear() - personalInfo.birthDate.getFullYear() : 30,
        gender: personalInfo.gender === '남성' ? 'male' : personalInfo.gender === '여성' ? 'female' : 'male',
        occupation: personalInfo.occupation || 'office_worker',
        // 생년월일 추가 (렌더러에서 사용)
        birthDate: personalInfo.birthDate ? personalInfo.birthDate.toISOString().split('T')[0] : null
      };

      // 3. AI 엔진이 기대하는 전체 데이터 구조 구성
      const dataForValidation = {
        personalInfo: convertedPersonalInfo,
        measurementData: convertedMeasurementData
      };

      console.log('🔍 변환된 AI 분석 데이터:', dataForValidation);
      
      const validationResult = await selectedEngine.validate(dataForValidation);
      
      if (!validationResult.isValid) {
        throw new Error(`데이터 검증 실패: ${validationResult.errors.join(', ')}`);
      }

      if (validationResult.warnings.length > 0) {
        console.warn('데이터 검증 경고:', validationResult.warnings);
      }

      // 4. AI 분석 수행
      setAnalysisProgress(30);
      setAnalysisStatus('AI 분석 수행 중...');
      
      const analysisOptions = {
        outputLanguage: 'ko' as const,
        analysisDepth: 'detailed' as const,
        includeDetailedMetrics: true
      };

      const analysisResult = await selectedEngine.analyze(dataForValidation, analysisOptions);
      
      setAnalysisProgress(80);
      setAnalysisStatus('결과 처리 중...');

      // 5. 분석 결과에 개인정보 추가 (렌더러에서 사용)
      (analysisResult as any).personalInfo = convertedPersonalInfo;
      analysisResult.rawData = {
        ...analysisResult.rawData,
        personalInfo: convertedPersonalInfo
      };

      console.log('🔍 AI 분석 완료 - 결과:', analysisResult);

      // 6. 엔진 사용 기록
      aiEngineRegistry.recordUsage(selectedEngine.id, 5); // 기본 5점 평점

      // 7. 결과 포맷팅
      setAnalysisProgress(100);
      setAnalysisStatus('분석 완료');

      const formattedResult: AIAnalysisResponse = {
        reportId: analysisResult.analysisId,
        personalInfo,
        measurementUserId, // 🔥 MeasurementUser ID 추가
        analysisResults: {
          mentalHealthScore: analysisResult.overallScore,
          physicalHealthScore: Math.round((analysisResult.overallScore + (100 - analysisResult.stressLevel)) / 2),
          stressLevel: analysisResult.stressLevel,
          recommendations: analysisResult.insights.recommendations,
          detailedAnalysis: analysisResult.insights.detailedAnalysis
        },
        generatedAt: new Date(analysisResult.timestamp),
        reliability: validationResult.qualityScore >= 80 ? 'high' : 
                    validationResult.qualityScore >= 60 ? 'medium' : 'low',
        engineInfo: {
          engineId: selectedEngine.id,
          engineName: selectedEngine.name,
          engineVersion: selectedEngine.version,
          processingTime: analysisResult.processingTime,
          costUsed: analysisResult.costUsed
        }
      };

      setState('completed');
      
      // 1초 후 결과 전달
      setTimeout(() => {
        onComplete(formattedResult);
      }, 1000);

    } catch (error) {
      console.error('분석 실패:', error);
      setState('error');
      setAnalysisStatus('분석 실패');
      onError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const renderEngineSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          AI 분석 준비
        </h2>
        <p className="text-gray-700">
          측정된 데이터를 분석할 AI 엔진을 선택하고 분석을 시작하세요.
        </p>
      </div>

      {/* 선택된 엔진 정보 */}
      {selectedEngine && (
        <Card className="border border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              선택된 AI 엔진
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedEngine.name}</h3>
                  <p className="text-sm text-gray-600">{selectedEngine.description}</p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  <Settings className="w-4 h-4" />
                  변경
                </Button>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>비용: {selectedEngine.costPerAnalysis} 크레딧</span>
                <span>•</span>
                <span>제공업체: {selectedEngine.provider.toUpperCase()}</span>
                <span>•</span>
                <span>버전: v{selectedEngine.version}</span>
              </div>

              {/* 지원 데이터 타입 */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">지원 데이터:</span>
                {Object.entries(selectedEngine.supportedDataTypes).map(([type, supported]) => 
                  supported && (
                    <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {type.toUpperCase()}
                    </span>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 분석 시작 버튼 */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="border-gray-300 text-gray-700 hover:bg-gray-50">
          뒤로
        </Button>
        
        <div className="flex items-center gap-3">
          {!selectedEngine && (
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              AI 엔진 선택
            </Button>
          )}
          
          {selectedEngine && (
            <Button 
              onClick={startAnalysis} 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Activity className="w-4 h-4" />
              AI 분석 시작
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Activity className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          AI 분석 중
        </h2>
        <p className="text-gray-700">
          {selectedEngine?.name}이(가) 데이터를 분석하고 있습니다.
        </p>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">분석 진행 상황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-4">
              <Loader className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 mb-2">{analysisStatus}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{analysisProgress}% 완료</p>
            </div>
            
            {selectedEngine && (
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>사용 엔진:</strong> {selectedEngine.name}</p>
                  <p><strong>소모 크레딧:</strong> {selectedEngine.costPerAnalysis}</p>
                  <p><strong>예상 처리 시간:</strong> 1-2분</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompleted = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Activity className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          분석 완료
        </h2>
        <p className="text-gray-700">
          AI 분석이 성공적으로 완료되었습니다.
        </p>
      </div>

      <Card className="border border-green-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-green-600 mb-4">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              분석이 완료되었습니다
            </div>
            <p className="text-sm text-gray-600">잠시 후 결과 화면으로 이동합니다...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderError = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Activity className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          분석 실패
        </h2>
        <p className="text-gray-700">
          분석 중 오류가 발생했습니다.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="px-6 py-2 bg-white border-2 border-gray-400 text-gray-700 hover:bg-gray-50 hover:border-gray-500"
        >
          뒤로
        </Button>
        
        <Button 
          onClick={() => setState('engine-selection')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
        >
          다시 시도
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {state === 'engine-selection' && renderEngineSelection()}
      {state === 'analyzing' && renderAnalyzing()}
      {state === 'completed' && renderCompleted()}
      {state === 'error' && renderError()}

      {/* 엔진 선택 모달 */}
      <EngineSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleEngineSelect}
        availableCredits={availableCredits}
        requiredDataTypes={{
          eeg: !!measurementData.eegSummary,
          ppg: !!measurementData.ppgSummary,
          acc: !!measurementData.accSummary
        }}
      />
    </div>
  );
}

export default AnalysisScreen; 