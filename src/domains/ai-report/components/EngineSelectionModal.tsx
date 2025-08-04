/**
 * AI 엔진 선택 모달 컴포넌트
 * 사용자가 분석에 사용할 AI 엔진을 선택할 수 있는 UI
 */

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@ui/dialog';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { 
  Brain, 
  Zap, 
  Clock, 
  CreditCard, 
  Check, 
  Info, 
  Sparkles,
  Activity,
  Heart,
  Move3D,
  AlertTriangle,
  Star
} from 'lucide-react';

import { IAIEngine } from '../core/interfaces/IAIEngine';
import { aiEngineRegistry } from '../ai-engines';

interface EngineSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (engine: IAIEngine, analysisConfig?: AnalysisConfig) => void;
  availableCredits?: number;
  requiredDataTypes?: {
    eeg: boolean;
    ppg: boolean;
    acc: boolean;
  };
}

export interface AnalysisConfig {
  analysisType: 'basic' | 'advanced' | 'comprehensive';
  analysisOptions: {
    includeDetailedAnalysis?: boolean;
    includeMedicalInsights?: boolean;
    includePersonalizedRecommendations?: boolean;
    generateVisualization?: boolean;
  };
}

interface EngineDisplayInfo {
  engine: IAIEngine;
  isRecommended: boolean;
  isAffordable: boolean;
  compatibilityScore: number;
  metadata?: {
    usageCount: number;
    averageRating: number;
    lastUsed: string | null;
  };
}

export function EngineSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  availableCredits = 10,
  requiredDataTypes = { eeg: true, ppg: true, acc: false }
}: EngineSelectionModalProps) {
  const [engines, setEngines] = useState<EngineDisplayInfo[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<IAIEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'engine' | 'analysis'>('engine');
  const [selectedAnalysisConfig, setSelectedAnalysisConfig] = useState<AnalysisConfig>({
    analysisType: 'advanced',
    analysisOptions: {
      includeDetailedAnalysis: true,
      includeMedicalInsights: true,
      includePersonalizedRecommendations: true,
      generateVisualization: true
    }
  });

  // 엔진 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadEngines();
    } else {
      // 모달이 닫힐 때 상태 리셋
      setCurrentStep('engine');
      setSelectedEngine(null);
    }
  }, [isOpen, requiredDataTypes]);

  const loadEngines = async () => {
    console.log('🚀 loadEngines 시작 - 모달 열림')
    setIsLoading(true);
    
    try {
      // 등록된 모든 엔진 조회
      console.log('🔍 aiEngineRegistry 상태 확인:', aiEngineRegistry)
      const allEngines = aiEngineRegistry.getAll();
      
      // 디버깅 로그
      console.log('🔍 Available engines:', allEngines.length);
      console.log('🔍 Engine details:', allEngines.map(e => ({ id: e.id, name: e.name, provider: e.provider, supportedDataTypes: e.supportedDataTypes })));
      console.log('🔍 Required data types:', requiredDataTypes);
      
      if (allEngines.length === 0) {
        console.warn('⚠️ No engines registered! Checking registry state...');
        const stats = aiEngineRegistry.getStats();
        console.log('📊 Registry stats:', stats);
        
        // 강제로 엔진 재등록 시도
        console.log('🔄 엔진 재등록 시도...')
        const { initializeEngines } = await import('../ai-engines')
        initializeEngines()
        
        // 재등록 후 다시 조회
        const allEnginesAfterInit = aiEngineRegistry.getAll();
        console.log('🔍 재등록 후 Available engines:', allEnginesAfterInit.length);
        console.log('🔍 재등록 후 Engine details:', allEnginesAfterInit.map(e => ({ id: e.id, name: e.name, provider: e.provider })));
        
        // 업데이트된 엔진 목록 사용
        allEngines.push(...allEnginesAfterInit)
      }
      
      // 엔진별 호환성 및 추천도 계산
      const engineInfos: EngineDisplayInfo[] = allEngines.map(engine => {
        const metadata = aiEngineRegistry.getMetadata(engine.id);
        
        // 호환성 점수 계산 (데이터 타입 지원도)
        let compatibilityScore = 0;
        if (requiredDataTypes.eeg && engine.supportedDataTypes.eeg) compatibilityScore += 40;
        if (requiredDataTypes.ppg && engine.supportedDataTypes.ppg) compatibilityScore += 40;
        if (requiredDataTypes.acc && engine.supportedDataTypes.acc) compatibilityScore += 20;
        
        console.log(`🔍 엔진 ${engine.name} (${engine.id}) 호환성:`, {
          requiredEEG: requiredDataTypes.eeg,
          supportsEEG: engine.supportedDataTypes.eeg,
          requiredPPG: requiredDataTypes.ppg,
          supportsPPG: engine.supportedDataTypes.ppg,
          requiredACC: requiredDataTypes.acc,
          supportsACC: engine.supportedDataTypes.acc,
          compatibilityScore
        });
        
                 // 추가 점수 (품질, 사용량 등)
         if (metadata && metadata.averageRating > 4) compatibilityScore += 10;
         if (metadata && metadata.usageCount > 10) compatibilityScore += 5;
         if (engine.costPerAnalysis <= availableCredits) compatibilityScore += 5;
        
        const isAffordable = engine.costPerAnalysis <= availableCredits;
        const isRecommended = compatibilityScore >= 70 && isAffordable;
        
        return {
          engine,
          isRecommended,
          isAffordable,
          compatibilityScore,
          metadata
        };
      });

      // 추천도와 호환성 점수로 정렬
      engineInfos.sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return b.compatibilityScore - a.compatibilityScore;
      });

      setEngines(engineInfos);
      
      // 기본 선택 (첫 번째 추천 엔진)
      const recommendedEngine = engineInfos.find(info => info.isRecommended);
      if (recommendedEngine) {
        setSelectedEngine(recommendedEngine.engine);
      }
      
    } catch (error) {
      console.error('엔진 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEngineSelect = (engine: IAIEngine) => {
    setSelectedEngine(engine);
    setCurrentStep('analysis');
  };

  const handleAnalysisSelect = () => {
    if (selectedEngine) {
      onSelect(selectedEngine, selectedAnalysisConfig);
      onClose();
      // 상태 리셋
      setCurrentStep('engine');
      setSelectedEngine(null);
    }
  };

  const handleBack = () => {
    setCurrentStep('engine');
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'eeg': return <Brain className="w-4 h-4" />;
      case 'ppg': return <Heart className="w-4 h-4" />;
      case 'acc': return <Move3D className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'gemini': return 'bg-blue-100 text-blue-800';
      case 'openai': return 'bg-green-100 text-green-800';
      case 'claude': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUsageStats = (metadata: any) => {
    if (!metadata) return '신규 엔진';
    
    const parts = [];
    if (metadata.usageCount > 0) {
      parts.push(`${metadata.usageCount}회 사용`);
    }
    if (metadata.averageRating > 0) {
      parts.push(`⭐ ${metadata.averageRating.toFixed(1)}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : '신규 엔진';
  };

  const getAnalysisTypeInfo = (type: 'basic' | 'advanced' | 'comprehensive') => {
    switch (type) {
      case 'basic':
        return {
          name: '기본 분석',
          description: '핵심 지표와 기본적인 건강 상태 분석',
          features: ['기본 건강 지표', '간단한 요약', '기본 권장사항'],
          cost: 1,
          duration: '1-2분'
        };
      case 'advanced':
        return {
          name: '고급 분석',
          description: '상세한 의료 인사이트와 개인화된 분석',
          features: ['상세 건강 지표', '의료 인사이트', '개인화된 권장사항', '시각화 차트'],
          cost: 3,
          duration: '3-5분'
        };
      case 'comprehensive':
        return {
          name: '종합 분석',
          description: '가장 포괄적인 분석과 장기 계획',
          features: ['종합 건강 평가', '전문의 수준 분석', '장기 건강 플랜', '고급 시각화', '트렌드 분석'],
          cost: 5,
          duration: '5-10분'
        };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-gray-900">
            <Sparkles className="w-5 h-5 text-blue-500" />
            {currentStep === 'engine' ? 'AI 분석 엔진 선택' : '고급 분석 선택'}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            {currentStep === 'engine' 
              ? '측정된 데이터를 분석할 AI 엔진을 선택하세요. 각 엔진마다 다른 분석 방식과 비용이 적용됩니다.'
              : `${selectedEngine?.name}으로 분석할 분석 타입을 선택하세요.`
            }
          </DialogDescription>
        </DialogHeader>

        {/* 현재 크레딧 표시 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">사용 가능한 크레딧</span>
            </div>
            <span className="text-lg font-semibold text-blue-900">
              {availableCredits} 크레딧
            </span>
          </div>
        </div>

        {currentStep === 'engine' ? (
          // 1단계: 엔진 선택
          <>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  AI 엔진 목록을 불러오는 중...
                </div>
              </div>
            ) : engines.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-lg font-medium mb-2">사용 가능한 AI 엔진이 없습니다</p>
                  <p className="text-sm">시스템 관리자에게 문의하세요.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              {engines.map((engineInfo) => {
                const { engine, isRecommended, isAffordable, compatibilityScore, metadata } = engineInfo;
                
                return (
                <Card 
                  key={engine.id} 
                  className={`cursor-pointer transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm ${!isAffordable ? 'opacity-60' : ''}`}
                  onClick={() => isAffordable && handleEngineSelect(engine)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {engine.name}
                          </CardTitle>
                          
                          {/* 추천 배지 */}
                          {isRecommended && (
                            <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                              <Star className="w-3 h-3 mr-1" />
                              추천
                            </Badge>
                          )}
                          
                          {/* 제공업체 배지 */}
                          <Badge className={`text-xs px-2 py-1 ${getProviderBadgeColor(engine.provider)}`}>
                            {engine.provider.toUpperCase()}
                          </Badge>
                          
                          {/* 버전 */}
                          <Badge variant="outline" className="text-xs">
                            v{engine.version}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {engine.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* 지원 데이터 타입 */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">지원 데이터 타입</div>
                      <div className="flex gap-2">
                        {Object.entries(engine.supportedDataTypes).map(([type, supported]) => 
                          supported && (
                            <Badge 
                              key={type} 
                              variant="outline" 
                              className="text-xs flex items-center gap-1"
                            >
                              {getDataTypeIcon(type)}
                              {type.toUpperCase()}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                    
                    {/* 엔진 특성 */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">비용:</span>
                        <span className="font-medium">
                          {engine.costPerAnalysis} 크레딧
                        </span>
                        {!isAffordable && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">최대 처리:</span>
                        <span className="font-medium">
                          {Math.floor(engine.capabilities.maxDataDuration / 60)}분
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">실시간:</span>
                        <span className="font-medium">
                          {engine.capabilities.realTimeProcessing ? '지원' : '미지원'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Info className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">사용 현황:</span>
                        <span className="font-medium text-xs">
                          {formatUsageStats(metadata)}
                        </span>
                      </div>
                    </div>
                    
                    {/* 지원 언어 */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">지원 언어:</span>
                      <div className="flex gap-1">
                        {engine.capabilities.supportedLanguages.map(lang => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang === 'ko' ? '한국어' : lang === 'en' ? 'English' : lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* 호환성 점수 표시 (개발 모드에서만) */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          호환성 점수: {compatibilityScore}% 
                          {isRecommended && ' (추천)'}
                          {!isAffordable && ' (크레딧 부족)'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
              })}
              </div>
            )}
          </>
        ) : (
          // 2단계: 고급 분석 선택
          <div className="space-y-6">
            {/* 선택된 엔진 정보 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">{selectedEngine?.name}</h3>
                  <p className="text-sm text-blue-700">{selectedEngine?.description}</p>
                </div>
              </div>
            </div>

            {/* 분석 타입 선택 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">분석 타입 선택</h3>
              
              {(['basic', 'advanced', 'comprehensive'] as const).map((type) => {
                const typeInfo = getAnalysisTypeInfo(type);
                const isSelected = selectedAnalysisConfig.analysisType === type;
                const totalCost = typeInfo.cost * (selectedEngine?.costPerAnalysis || 1);
                const isAffordable = totalCost <= availableCredits;
                
                return (
                  <Card 
                    key={type}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 border-blue-500 shadow-md bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                    } ${!isAffordable ? 'opacity-60' : ''}`}
                    onClick={() => isAffordable && setSelectedAnalysisConfig(prev => ({ ...prev, analysisType: type }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{typeInfo.name}</h4>
                            {type === 'advanced' && (
                              <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                                <Star className="w-3 h-3 mr-1" />
                                추천
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-3">{typeInfo.description}</p>
                          
                          {/* 특징 목록 */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {typeInfo.features.map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          
                          {/* 비용 및 시간 정보 */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">비용:</span>
                              <span className="font-medium">{totalCost} 크레딧</span>
                              {!isAffordable && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">소요시간:</span>
                              <span className="font-medium">{typeInfo.duration}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 선택 표시 */}
                        {isSelected && (
                          <div className="ml-4">
                            <Check className="w-5 h-5 text-blue-500" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 분석 옵션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">분석 옵션</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAnalysisConfig.analysisOptions.includeDetailedAnalysis}
                    onChange={(e) => setSelectedAnalysisConfig(prev => ({
                      ...prev,
                      analysisOptions: {
                        ...prev.analysisOptions,
                        includeDetailedAnalysis: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">상세 분석 포함</div>
                    <div className="text-sm text-gray-600">각 지표별 세부 분석 결과</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAnalysisConfig.analysisOptions.includeMedicalInsights}
                    onChange={(e) => setSelectedAnalysisConfig(prev => ({
                      ...prev,
                      analysisOptions: {
                        ...prev.analysisOptions,
                        includeMedicalInsights: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">의료 인사이트</div>
                    <div className="text-sm text-gray-600">전문의 수준의 의료 해석</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAnalysisConfig.analysisOptions.includePersonalizedRecommendations}
                    onChange={(e) => setSelectedAnalysisConfig(prev => ({
                      ...prev,
                      analysisOptions: {
                        ...prev.analysisOptions,
                        includePersonalizedRecommendations: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">개인화된 권장사항</div>
                    <div className="text-sm text-gray-600">개인 정보 기반 맞춤 조언</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAnalysisConfig.analysisOptions.generateVisualization}
                    onChange={(e) => setSelectedAnalysisConfig(prev => ({
                      ...prev,
                      analysisOptions: {
                        ...prev.analysisOptions,
                        generateVisualization: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">시각화 차트 생성</div>
                    <div className="text-sm text-gray-600">그래프와 차트로 결과 표시</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={currentStep === 'engine' ? onClose : handleBack}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {currentStep === 'engine' ? '취소' : '이전'}
          </Button>
          
          <div className="flex items-center gap-3">
            {currentStep === 'engine' ? (
              // 엔진 선택 단계의 버튼은 불필요 (카드 클릭으로 바로 다음 단계)
              <div className="text-sm text-gray-500">엔진을 클릭하여 선택하세요</div>
            ) : (
              // 분석 선택 단계
              <>
                {selectedEngine && (() => {
                  const typeInfo = getAnalysisTypeInfo(selectedAnalysisConfig.analysisType);
                  const totalCost = typeInfo.cost * selectedEngine.costPerAnalysis;
                  const isAffordable = totalCost <= availableCredits;
                  
                  return (
                    <>
                      {!isAffordable && (
                        <div className="text-sm text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          크레딧이 부족합니다
                        </div>
                      )}
                      
                      <Button 
                        onClick={handleAnalysisSelect} 
                        disabled={!isAffordable}
                        className={`min-w-[140px] ${
                          isAffordable
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        }`}
                      >
                        분석 시작 ({totalCost} 크레딧)
                      </Button>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EngineSelectionModal; 