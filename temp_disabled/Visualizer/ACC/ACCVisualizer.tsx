import React from 'react';
import ACCMagnitudeChart from './ACCMagnitudeChart';
import ACCIndexesChart from './ACCIndexesChart';

const ACCVisualizer: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-200 mb-2">
          📱 ACC 가속도 분석
        </h2>
        <p className="text-gray-300">
          실시간 3축 가속도계 신호 처리 및 움직임 패턴 분석 결과를 시각화합니다.
        </p>
      </div>

      {/* 가속도 크기 차트 */}
      <div className="bg-black border border-gray-800 rounded-lg shadow p-6 h-[380px]">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          📊 가속도 크기 (Magnitude)
        </h3>
        <div className="text-sm text-gray-300 mb-4">
          X, Y, Z축 가속도의 크기를 실시간으로 모니터링합니다.
        </div>
        <ACCMagnitudeChart />
      </div>

      {/* 종합 분석 지수 */}
      <div className="bg-black border border-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          🎯 종합 분석 지수
        </h3>
        <div className="text-sm text-gray-300 mb-4">
          활동량, 자세 변화, 움직임 패턴 등 종합적인 움직임 분석을 시각화합니다.
        </div>
        <ACCIndexesChart />
      </div>
    </div>
  );
};

export default ACCVisualizer; 