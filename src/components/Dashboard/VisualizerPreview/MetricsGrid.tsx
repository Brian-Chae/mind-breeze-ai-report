import React from 'react';
import { Badge } from '../../ui/badge';

interface MetricsData {
  eeg: {
    arousal: number;
    valence: number;
    focus: number;
  };
  ppg: {
    heartRate: number;
    rmssd: number;
    stress: number;
  };
  acc: {
    state: string;
    activity: number;
    stability: number;
  };
}

interface MetricsGridProps {
  metrics: MetricsData;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'gray';
  type?: 'percentage' | 'number' | 'text';
}

function MetricCard({ title, value, unit, color, type = 'number' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700'
  };

  const formatValue = (val: string | number) => {
    if (type === 'text') return val;
    if (type === 'percentage') return `${Math.round(Number(val))}%`;
    if (typeof val === 'number') return Math.round(val * 100) / 100;
    return val;
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-[10px] font-medium mb-1">{title}</div>
      <div className="text-2xl font-bold">
        {formatValue(value)}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* EEG 지표 */}
      <MetricCard
        title="이완및긴장 (Arousal)"
        value={metrics.eeg.arousal}
        type="percentage"
        color="blue"
      />
      <MetricCard
        title="감정균형도 (Valence)"
        value={metrics.eeg.valence}
        type="percentage"
        color="purple"
      />
      <MetricCard
        title="집중도 (Focus)"
        value={metrics.eeg.focus}
        type="percentage"
        color="green"
      />

      {/* PPG 지표 */}
      <MetricCard
        title="심박수"
        value={metrics.ppg.heartRate}
        unit="BPM"
        color="red"
      />
      <MetricCard
        title="RMSSD"
        value={metrics.ppg.rmssd}
        unit="ms"
        color="orange"
      />
      <MetricCard
        title="스트레스"
        value={metrics.ppg.stress}
        type="percentage"
        color="red"
      />

      {/* ACC 지표 */}
      <MetricCard
        title="현재 상태"
        value={metrics.acc.state}
        type="text"
        color="gray"
      />
      <MetricCard
        title="활동도"
        value={metrics.acc.activity}
        type="percentage"
        color="green"
      />
      <MetricCard
        title="안정성"
        value={metrics.acc.stability}
        type="percentage"
        color="blue"
      />
    </div>
  );
} 