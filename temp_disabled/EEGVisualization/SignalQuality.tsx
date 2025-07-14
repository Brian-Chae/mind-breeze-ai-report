interface SignalQualityProps {
  quality: {
    overall: number;        // 0-100
    electrodeContact: number;  // 0-100
    signalToNoise: number;    // 0-100
    artifactLevel: number;    // 0-100 (lower is better)
  };
  className?: string;
}

export default function SignalQuality({ quality, className = '' }: SignalQualityProps) {
  const getQualityLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600 bg-green-100', barColor: 'bg-green-500' };
    if (score >= 60) return { level: 'Good', color: 'text-blue-600 bg-blue-100', barColor: 'bg-blue-500' };
    if (score >= 40) return { level: 'Fair', color: 'text-yellow-600 bg-yellow-100', barColor: 'bg-yellow-500' };
    return { level: 'Poor', color: 'text-red-600 bg-red-100', barColor: 'bg-red-500' };
  };

  const getArtifactLevel = (score: number) => {
    if (score <= 20) return { level: 'Low', color: 'text-green-600 bg-green-100', barColor: 'bg-green-500' };
    if (score <= 40) return { level: 'Moderate', color: 'text-yellow-600 bg-yellow-100', barColor: 'bg-yellow-500' };
    if (score <= 60) return { level: 'High', color: 'text-orange-600 bg-orange-100', barColor: 'bg-orange-500' };
    return { level: 'Very High', color: 'text-red-600 bg-red-100', barColor: 'bg-red-500' };
  };

  const overallQuality = getQualityLevel(quality.overall);
  const electrodeQuality = getQualityLevel(quality.electrodeContact);
  const snrQuality = getQualityLevel(quality.signalToNoise);
  const artifactQuality = getArtifactLevel(quality.artifactLevel);

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Signal Quality</h3>
      
      {/* 전체 품질 점수 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Quality</span>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${overallQuality.color}`}>
              {overallQuality.level}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {quality.overall.toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${overallQuality.barColor}`}
            style={{ width: `${Math.min(quality.overall, 100)}%` }}
          />
        </div>
      </div>

      {/* 세부 메트릭 */}
      <div className="space-y-4">
        {/* 전극 접촉 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Electrode Contact</span>
            <span className="text-sm font-medium text-gray-900">
              {quality.electrodeContact.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${electrodeQuality.barColor}`}
              style={{ width: `${Math.min(quality.electrodeContact, 100)}%` }}
            />
          </div>
        </div>

        {/* 신호 대 잡음비 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Signal-to-Noise Ratio</span>
            <span className="text-sm font-medium text-gray-900">
              {quality.signalToNoise.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${snrQuality.barColor}`}
              style={{ width: `${Math.min(quality.signalToNoise, 100)}%` }}
            />
          </div>
        </div>

        {/* 아티팩트 레벨 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Artifact Level</span>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${artifactQuality.color}`}>
                {artifactQuality.level}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {quality.artifactLevel.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${artifactQuality.barColor}`}
              style={{ width: `${Math.min(quality.artifactLevel, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 권장사항 */}
      {quality.overall < 60 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">
            Signal Quality Recommendations
          </h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            {quality.electrodeContact < 60 && (
              <li>• Check electrode contact and ensure proper skin preparation</li>
            )}
            {quality.signalToNoise < 60 && (
              <li>• Reduce environmental noise and ensure stable connection</li>
            )}
            {quality.artifactLevel > 40 && (
              <li>• Minimize movement and relax to reduce artifacts</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 