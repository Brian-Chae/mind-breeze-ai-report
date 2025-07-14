import { useMemo } from 'react';

interface FrequencyBandsProps {
  bandPowers: {
    delta: number;    // 0.5-4Hz
    theta: number;    // 4-8Hz  
    alpha: number;    // 8-13Hz
    beta: number;     // 13-30Hz
    gamma: number;    // 30-50Hz
  };
  className?: string;
}

export default function FrequencyBands({ bandPowers, className = '' }: FrequencyBandsProps) {
  const bands = useMemo(() => [
    { name: 'Delta', value: bandPowers.delta, color: 'bg-purple-500', description: '0.5-4Hz (Deep Sleep)' },
    { name: 'Theta', value: bandPowers.theta, color: 'bg-blue-500', description: '4-8Hz (Meditation)' },
    { name: 'Alpha', value: bandPowers.alpha, color: 'bg-green-500', description: '8-13Hz (Relaxation)' },
    { name: 'Beta', value: bandPowers.beta, color: 'bg-yellow-500', description: '13-30Hz (Focus)' },
    { name: 'Gamma', value: bandPowers.gamma, color: 'bg-red-500', description: '30-50Hz (High Cognition)' }
  ], [bandPowers]);

  // 최대값을 찾아서 정규화
  const maxValue = Math.max(...bands.map(band => band.value));

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequency Bands</h3>
      
      <div className="space-y-4">
        {bands.map((band) => {
          const percentage = maxValue > 0 ? (band.value / maxValue) * 100 : 0;
          
          return (
            <div key={band.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{band.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{band.description}</span>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {band.value.toFixed(2)}μV²
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${band.color}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              
              <div className="text-xs text-gray-500 text-right">
                {percentage.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 전체 파워 표시 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">Total Power</span>
          <span className="text-lg font-semibold text-brain-600">
            {Object.values(bandPowers).reduce((sum, value) => sum + value, 0).toFixed(2)}μV²
          </span>
        </div>
      </div>
    </div>
  );
} 