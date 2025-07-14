import React from 'react';

interface MetricChartProps {
  value: number;
  normalRange: { min: number; max: number };
  label: string;
  unit?: string;
  status: 'low' | 'normal' | 'high';
  customLabels?: { low: string; normal: string; high: string };
}

const MetricChart: React.FC<MetricChartProps> = ({ 
  value, 
  normalRange, 
  label, 
  unit = '', 
  status, 
  customLabels 
}) => {
  // 전체 범위 계산 (정상범위 앞뒤로 여유분 추가)
  const rangeSpan = normalRange.max - normalRange.min;
  const minValue = normalRange.min - rangeSpan * 0.5; // 정상 최소값보다 50% 낮게
  const maxValue = normalRange.max + rangeSpan * 0.5; // 정상 최대값보다 50% 높게
  
  // 200도 각도 계산
  const totalAngle = 200; // 200도
  const startAngle = 260; // 시작 각도 (정상 범위 가운데가 위에 오도록 조정)
  
  // 각 구간의 각도 계산
  const lowRangeAngle = ((normalRange.min - minValue) / (maxValue - minValue)) * totalAngle;
  const normalRangeAngle = ((normalRange.max - normalRange.min) / (maxValue - minValue)) * totalAngle;
  const highRangeAngle = ((maxValue - normalRange.max) / (maxValue - minValue)) * totalAngle;
  
  // 현재 값의 각도 계산
  const currentValueAngle = Math.min(totalAngle, Math.max(0, ((value - minValue) / (maxValue - minValue)) * totalAngle));
  
  // 극좌표를 직교좌표로 변환하는 함수
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };
  
  // 호 경로 생성 함수
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const centerX = 50;
  const centerY = 50;
  const radius = 40;
  
  // 각 구간의 경로 생성
  const lowPath = describeArc(centerX, centerY, radius, startAngle, startAngle + lowRangeAngle);
  const normalPath = describeArc(centerX, centerY, radius, startAngle + lowRangeAngle, startAngle + lowRangeAngle + normalRangeAngle);
  const highPath = describeArc(centerX, centerY, radius, startAngle + lowRangeAngle + normalRangeAngle, startAngle + totalAngle);
  
  // 현재 값 마커 위치
  const markerAngle = startAngle + currentValueAngle;
  const markerPos = polarToCartesian(centerX, centerY, radius, markerAngle);
  const markerPosInner = polarToCartesian(centerX, centerY, radius - 12, markerAngle);

  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg className="w-56 h-56" viewBox="0 0 100 100">
        {/* 배경 호 */}
        <path
          d={describeArc(centerX, centerY, radius, startAngle, startAngle + totalAngle)}
          stroke="#f3f4f6"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* 미만 구간 (노란색) - 시작 부분만 round */}
        <path
          d={lowPath}
          stroke="#eab308"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* 초과 구간 (빨간색) - 끝 부분만 round */}
        <path
          d={highPath}
          stroke="#ef4444"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* 정상 구간 (녹색) - 가장 앞으로, 중간 부분은 butt */}
        <path
          d={normalPath}
          stroke="#10b981"
          strokeWidth="12"
          fill="none"
          strokeLinecap="butt"
        />
        
        {/* 현재 값 마커 */}
        <g>
          {/* 마커 라인 */}
          <line
            x1={markerPosInner.x}
            y1={markerPosInner.y}
            x2={markerPos.x}
            y2={markerPos.y}
            stroke="#1f2937"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* 마커 점 */}
          <circle
            cx={markerPos.x}
            cy={markerPos.y}
            r="4"
            fill="#1f2937"
          />
        </g>
      </svg>
      
      {/* 중앙 값 표시 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center mt-1 ">
          <div className="text-2xl font-bold text-gray-900">
            {value.toFixed(value < 10 ? 2 : 1)}
          </div>
          {unit && <div className="text-sm text-gray-500">{unit}</div>}
        </div>
      </div>
      
      {/* 범위 라벨 */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-between text-sm text-gray-500 px-4">
        <span>{customLabels?.low || '미만'}</span>
        <span>{customLabels?.normal || '정상'}</span>
        <span>{customLabels?.high || '초과'}</span>
      </div>
    </div>
  );
};

export default MetricChart; 