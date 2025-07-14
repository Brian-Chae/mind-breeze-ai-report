import React from 'react';
import FilteredRawDataChart from './FilteredRawDataChart';
import SignalQualityChart from './SignalQualityChart';
import PowerSpectrumChart from './PowerSpectrumChart';
import EEGBandPowerCards from './EEGBandPowerCards';
import EEGIndexesChart from './EEGIndexesChart';

const EEGVisualizer: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-200 mb-2">
          🧠 EEG 뇌파 분석
        </h2>
        <p className="text-gray-300">
          실시간 뇌파 신호 처리 및 분석 결과를 시각화합니다.
        </p>
      </div>

      {/* 상단: Ch1 필터된 로우 데이터 | Ch2 필터된 로우 데이터 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            🔧 Ch1 필터링된 EEG 신호 (FP1)
          </h3>
          <div className="text-sm text-gray-300 mb-4">
            채널 1 (FP1) 신호처리 결과 - 60Hz 노치 + 1-45Hz 밴드패스 필터 적용
          </div>
          <FilteredRawDataChart channel="ch1" />
        </div>
        
        <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            🔧 Ch2 필터링된 EEG 신호 (FP2)
          </h3>
          <div className="text-sm text-gray-300 mb-4">
            채널 2 (FP2) 신호처리 결과 - 60Hz 노치 + 1-45Hz 밴드패스 필터 적용
          </div>
          <FilteredRawDataChart channel="ch2" />
        </div>
      </div>

      {/* 중간: Ch1 SQI | Ch2 SQI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            📈 Ch1 신호 품질 지수 (SQI)
          </h3>
          <div className="text-sm text-gray-300 mb-4">
            채널 1 (FP1) 전극 접촉 상태와 신호 품질 모니터링
          </div>
          <SignalQualityChart channel="ch1" />
        </div>
        
        <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            📈 Ch2 신호 품질 지수 (SQI)
          </h3>
          <div className="text-sm text-gray-300 mb-4">
            채널 2 (FP2) 전극 접촉 상태와 신호 품질 모니터링
          </div>
          <SignalQualityChart channel="ch2" />
        </div>
      </div>

      {/* 하단: Power Spectrum | Band Power Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            🌈 파워 스펙트럼 (1-45Hz)
          </h3>
          <div className="text-sm text-gray-300 mb-4">
            Ch1, Ch2 주파수 도메인 뇌파 신호 분석 결과
          </div>
          <PowerSpectrumChart />
        </div>
        
        <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            🎯 주파수 밴드 파워
          </h3>
          <div className="text-sm text-gray-300 mb-4">
            Power Spectrum 기반 실시간 주파수 밴드별 파워 분석 - 델타, 세타, 알파, 베타, 감마파
          </div>
          <EEGBandPowerCards />
        </div>
      </div>

      {/* 최하단: EEG 분석 지수 (전체 폭) */}
      <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          🧠 EEG 분석 지수
        </h3>
        <div className="text-sm text-gray-300 mb-4">
          실시간 뇌파 분석 결과 - 집중력, 이완도, 스트레스 등 9개 지수
        </div>
        <EEGIndexesChart />
      </div>
    </div>
  );
};

export default EEGVisualizer; 