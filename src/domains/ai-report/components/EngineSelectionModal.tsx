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
  onSelect: (engine: IAIEngine) => void;
  availableCredits?: number;
  requiredDataTypes?: {
    eeg: boolean;
    ppg: boolean;
    acc: boolean;
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

  // 엔진 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadEngines();
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
      console.log('🔍 Engine details:', allEngines.map(e => ({ id: e.id, name: e.name, provider: e.provider })));
      
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

  const handleSelect = () => {
    if (selectedEngine) {
      onSelect(selectedEngine);
      onClose();
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-gray-900">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI 분석 엔진 선택
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            측정된 데이터를 분석할 AI 엔진을 선택하세요. 각 엔진마다 다른 분석 방식과 비용이 적용됩니다.
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
              const isSelected = selectedEngine?.id === engine.id;
              
              return (
                <Card 
                  key={engine.id} 
                  className={`cursor-pointer transition-all duration-200 bg-white ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${!isAffordable ? 'opacity-60' : ''}`}
                  onClick={() => isAffordable && setSelectedEngine(engine)}
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
                      
                      {/* 선택 표시 */}
                      {isSelected && (
                        <div className="ml-4">
                          <Check className="w-5 h-5 text-blue-500" />
                        </div>
                      )}
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

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            취소
          </Button>
          
          <div className="flex items-center gap-3">
            {selectedEngine && !engines.find(e => e.engine.id === selectedEngine.id)?.isAffordable && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                크레딧이 부족합니다
              </div>
            )}
            
            <Button 
              onClick={handleSelect} 
              disabled={!selectedEngine || !engines.find(e => e.engine.id === selectedEngine.id)?.isAffordable}
              className={`min-w-[120px] ${
                selectedEngine && engines.find(e => e.engine.id === selectedEngine.id)?.isAffordable
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {selectedEngine ? (
                <>
                  선택 ({selectedEngine.costPerAnalysis} 크레딧)
                </>
              ) : (
                'AI 엔진 선택'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EngineSelectionModal; 