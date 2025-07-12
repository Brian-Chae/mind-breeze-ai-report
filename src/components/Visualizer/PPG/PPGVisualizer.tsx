import React from 'react';
import PPGFilteredDataChart from './PPGFilteredDataChart';
import PPGSignalQualityChart from './PPGSignalQualityChart';
import PPGIndexesChart from './PPGIndexesChart';

const PPGVisualizer: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-200 mb-2">
          💓 PPG 심박 분석
        </h2>
        <p className="text-gray-300">
          실시간 광혈류측정(PPG) 신호 처리 및 심박변이도 분석 결과를 시각화합니다.
        </p>
      </div>

      {/* 상단: 필터링된 PPG 신호 | PPG 신호 품질 지수 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            🔧 필터링된 PPG 신호
          </h3>
          <div className="text-sm text-gray-300 mb-4">
            Red/IR LED 신호에 0.5-5.0Hz 밴드패스 필터를 적용하여 심박 패턴을 분석합니다. (DC 성분 제거됨)
          </div>
          <PPGFilteredDataChart />
        </div>
        
        <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            📈 PPG 신호 품질 지수 (SQI)
          </h3>
          <div className="text-sm text-gray-300 mb-4">
            신호 품질과 전극 접촉 상태를 모니터링합니다.
          </div>
          <PPGSignalQualityChart />
        </div>
      </div>

      {/* 하단: PPG 분석 지수 (전체 폭) */}
      <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          💓 심박변이도 분석 지수
        </h3>
        <div className="text-sm text-gray-300 mb-4">
          실시간 PPG 분석 결과 - 심박수, HRV, 스트레스 등 6개 지수
        </div>
        <PPGIndexesChart />
      </div>
    </div>
  );
};

export default PPGVisualizer; 