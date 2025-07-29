import React from 'react';
import { X, Brain, Sparkles, ChevronRight } from 'lucide-react';
import { getRegisteredEngines } from '@/domains/ai-report/ai-engines';

interface EngineSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEngine: (engineId: string) => void;
  isGenerating: boolean;
}

export const EngineSelectionModal: React.FC<EngineSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectEngine,
  isGenerating
}) => {
  if (!isOpen) return null;

  // 등록된 엔진들 가져오기
  const engines = getRegisteredEngines();
  
  // EEG 및 PPG 데이터를 지원하는 엔진들 필터링
  // 통합 분석 엔진은 EEG와 PPG 둘 다 지원해야 함
  const compatibleEngines = engines.filter(engine => {
    const supportsEEG = engine.supportedDataTypes.includes('EEG');
    const supportsPPG = engine.supportedDataTypes.includes('PPG');
    
    // 통합 분석 엔진 (EEG와 PPG 둘 다 지원)
    if (engine.id.includes('integrated')) {
      return supportsEEG && supportsPPG;
    }
    
    // 개별 분석 엔진 (EEG 또는 PPG 중 하나만 지원해도 됨)
    return supportsEEG || supportsPPG;
  });
  
  console.log('🔍 조직 관리 페이지 - 등록된 엔진들:', engines);
  console.log('🔍 조직 관리 페이지 - 필터링된 엔진들:', compatibleEngines);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">AI 분석 엔진 선택</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isGenerating}
          >
            <X className="w-5 h-5 text-gray-600 hover:text-gray-800" />
          </button>
        </div>
        
        {/* 엔진 리스트 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {compatibleEngines.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-700">EEG 데이터를 지원하는 엔진이 없습니다.</p>
              </div>
            ) : (
              compatibleEngines.map((engine) => (
                <div
                  key={engine.id}
                  className="border rounded-lg p-4 hover:border-purple-500 transition-colors cursor-pointer group"
                  onClick={() => onSelectEngine(engine.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-lg text-gray-800">{engine.name}</h3>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          v{engine.version}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{engine.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-700">제공:</span>
                          <span className="ml-1 font-medium text-gray-900">{engine.provider}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">비용:</span>
                          <span className="ml-1 font-medium text-gray-900">${engine.cost.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">지원 데이터:</span>
                          <span className="ml-1 text-gray-900">
                            {engine.supportedDataTypes.join(', ')}
                          </span>
                        </div>
                      </div>
                      
                      {/* 특징 표시 */}
                      {engine.id === 'eeg-advanced-gemini' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            고급 분석
                          </span>
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                            상세 리포트
                          </span>
                          <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                            의료 인사이트
                          </span>
                        </div>
                      )}
                      {engine.id === 'integrated-advanced-gemini-v1' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                            종합 분석
                          </span>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            EEG + PPG 통합
                          </span>
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                            맞춤형 건강 플랜
                          </span>
                          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
                            심층 인사이트
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* 추가 정보 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong className="text-gray-900">참고:</strong> 각 엔진은 서로 다른 분석 방식과 결과를 제공합니다. 
              더 상세한 분석이 필요한 경우 고급 엔진을 선택하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};