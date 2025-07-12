import React from 'react';

interface ScoreDistributionBarProps {
  score: number;
  label: string;
  className?: string;
}

const ScoreDistributionBar: React.FC<ScoreDistributionBarProps> = ({ 
  score, 
  label, 
  className = '' 
}) => {
  const getScoreLevel = (score: number) => {
    if (score < 5) return { level: '위험', color: 'text-red-600' };
    if (score < 25) return { level: '경계', color: 'text-orange-600' };
    if (score < 75) return { level: '보통', color: 'text-yellow-600' };
    if (score < 95) return { level: '양호', color: 'text-green-600' };
    return { level: '우수', color: 'text-blue-600' };
  };

  const { level, color } = getScoreLevel(score);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-gray-700">{label}</span>
        <span className={`text-xl font-bold ${color}`}>
          {score.toFixed(1)}/100
        </span>
      </div>
      <div className="space-y-2">
        <div className="relative">
          {/* 전체 구간 색상 표시 */}
          <div className="w-full h-4 rounded-lg overflow-hidden bg-gradient-to-r from-red-500 via-orange-400 via-yellow-400 via-green-400 to-blue-500">
            {/* 구간 경계선 */}
            <div className="absolute top-0 left-[5%] w-px h-4 bg-white opacity-70"></div>
            <div className="absolute top-0 left-[25%] w-px h-4 bg-white opacity-70"></div>
            <div className="absolute top-0 left-[75%] w-px h-4 bg-white opacity-70"></div>
            <div className="absolute top-0 left-[95%] w-px h-4 bg-white opacity-70"></div>
          </div>
          
          {/* 현재 위치 마커 라인 */}
          <div 
            className="absolute top-0 w-0.5 h-4 bg-gray-900 rounded-sm transition-all duration-500"
            style={{ left: `${score}%`, transform: 'translateX(-50%)' }}
          />
          
          {/* 현재 위치 표시점 */}
          <div 
            className="absolute top-1/2 w-3 h-3 bg-white border-2 border-gray-900 rounded-full transition-all duration-500"
            style={{ left: `${score}%`, transform: 'translate(-50%, -50%)' }}
          />
          
          {/* 점수 및 상태 툴팁 */}
          <div 
            className="absolute -top-12 bg-gray-800 text-white px-2 py-1 rounded text-xs font-semibold transition-all duration-500 whitespace-nowrap text-center"
            style={{ left: `${score}%`, transform: 'translateX(-50%)' }}
          >
            <div>{score.toFixed(1)}점</div>
            <div>{level}</div>
            <div className="absolute top-full left-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800" style={{ transform: 'translateX(-50%)' }}></div>
          </div>
        </div>
        
        {/* 구간 라벨 */}
        <div className="flex justify-between text-sm text-gray-500 font-medium">
          <span>위험</span>
          <span>경계</span>
          <span>보통</span>
          <span>양호</span>
          <span>우수</span>
        </div>
      </div>
      <div className={`text-base font-semibold ${color}`}>
        상태: {level}
      </div>
    </div>
  );
};

export default ScoreDistributionBar; 