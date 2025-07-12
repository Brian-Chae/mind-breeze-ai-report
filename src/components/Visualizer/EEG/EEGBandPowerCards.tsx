import React, { useMemo } from 'react';
import { useEEGAnalysis, useConnectionState } from '../../../stores/processedDataStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { indexGuides } from '../../../constants/indexGuides';
import { AlertTriangle } from 'lucide-react';

const EEGBandPowerCards: React.FC = () => {
  const eegAnalysis = useEEGAnalysis();
  const isConnected = useConnectionState();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();

  // 주파수 밴드 정의
  const frequencyBands = {
    delta: { min: 1, max: 4, name: '델타파', color: 'bg-amber-600' },
    theta: { min: 4, max: 8, name: '세타파', color: 'bg-orange-500' },
    alpha: { min: 8, max: 13, name: '알파파', color: 'bg-green-500' },
    beta: { min: 13, max: 30, name: '베타파', color: 'bg-blue-500' },
    gamma: { min: 30, max: 45, name: '감마파', color: 'bg-purple-500' }
  };

  // Power Spectrum 데이터에서 주파수 밴드별 파워 계산
  const bandPowers = useMemo(() => {
    if (!eegAnalysis?.frequencySpectrum?.frequencies || 
        !eegAnalysis?.frequencySpectrum?.ch1Power || 
        !eegAnalysis?.frequencySpectrum?.ch2Power) {
      return null;
    }

    const { frequencies, ch1Power, ch2Power } = eegAnalysis.frequencySpectrum;
    
    // 안전한 데이터 검증
    if (!Array.isArray(frequencies) || !Array.isArray(ch1Power) || !Array.isArray(ch2Power) || 
        frequencies.length !== ch1Power.length || frequencies.length !== ch2Power.length) {
      return null;
    }

    console.log('🧠 EEG 주파수 밴드 파워 계산 시작:', {
      frequenciesLength: frequencies.length,
      ch1PowerLength: ch1Power.length,
      ch2PowerLength: ch2Power.length,
      frequencyRange: [frequencies[0], frequencies[frequencies.length - 1]]
    });

    const results: Record<string, { ch1: number; ch2: number; combined: number }> = {};

    // 각 주파수 밴드별로 파워 합산
    Object.entries(frequencyBands).forEach(([bandName, band]) => {
      let ch1Sum = 0;
      let ch2Sum = 0;
      let count = 0;

      frequencies.forEach((freq, index) => {
        if (freq >= band.min && freq <= band.max) {
          ch1Sum += ch1Power[index];
          ch2Sum += ch2Power[index];
          count++;
        }
      });

      // 평균 파워 계산 (dB 단위)
      const ch1Avg = count > 0 ? ch1Sum / count : 0;
      const ch2Avg = count > 0 ? ch2Sum / count : 0;
      const combined = (ch1Avg + ch2Avg) / 2;

      results[bandName] = {
        ch1: ch1Avg,
        ch2: ch2Avg,
        combined: combined
      };
    });

    console.log('✅ EEG 주파수 밴드 파워 계산 완료:', results);
    return results;
  }, [eegAnalysis?.frequencySpectrum]);

  // 카드 데이터 생성
  const cardData = useMemo(() => {
    if (!bandPowers) return [];

    // 전체 채널별 최대값 계산 (정규화용)
    const allCh1Powers = Object.values(bandPowers).map(p => p.ch1);
    const allCh2Powers = Object.values(bandPowers).map(p => p.ch2);
    const maxCh1Power = Math.max(...allCh1Powers);
    const maxCh2Power = Math.max(...allCh2Powers);
    const maxOverallPower = Math.max(maxCh1Power, maxCh2Power);

    return Object.entries(frequencyBands).map(([bandKey, band]) => {
      const power = bandPowers[bandKey];
      const normalizedCh1 = maxOverallPower > 0 ? (power.ch1 / maxOverallPower) * 100 : 0;
      const normalizedCh2 = maxOverallPower > 0 ? (power.ch2 / maxOverallPower) * 100 : 0;
      const normalizedCombined = maxOverallPower > 0 ? (power.combined / maxOverallPower) * 100 : 0;

      return {
        label: band.name,
        value: power.combined,
        normalizedValue: normalizedCombined,
        unit: 'dB',
        color: band.color,
        description: `${band.min}-${band.max}Hz 주파수 대역 파워`,
        ch1Power: power.ch1,
        ch2Power: power.ch2,
        normalizedCh1,
        normalizedCh2,
        frequencyRange: `${band.min}-${band.max}Hz`
      };
    });
  }, [bandPowers]);

  // 데이터 품질 상태 계산
  const dataQuality = useMemo(() => {
    const sensorOk = isSensorContacted;
    const bothChannelsOk = !leadOffStatus.fp1 && !leadOffStatus.fp2;
    const hasSpectrumData = !!eegAnalysis?.frequencySpectrum?.frequencies;
    const overall = sensorOk && bothChannelsOk && hasSpectrumData;
    
    return {
      sensorContact: sensorOk,
      channelQuality: bothChannelsOk,
      spectrumData: hasSpectrumData,
      overall: overall
    };
  }, [isSensorContacted, leadOffStatus, eegAnalysis?.frequencySpectrum]);

  // 연결되지 않았거나 데이터가 없는 경우
  if (!isConnected || !bandPowers) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🧠</div>
          <div className="text-base text-gray-300">
            그래프에 표시할 데이터가 없습니다
          </div>
          <div className="text-sm text-gray-400">
            LINK BAND 디바이스를 연결해주세요
          </div>
          <div className="text-xs text-gray-500 mt-1">
            연결 후 EEG 주파수 밴드 파워를 실시간으로 확인할 수 있습니다
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-6 mt-10 mb-10">
      {/* 센서 접촉 상태 경고 */}
      {isConnected && !isSensorContacted && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <div className="text-red-300">
            <div className="font-medium text-sm">전극 접촉 불량 감지</div>
            <div className="text-xs">
              FP1: {leadOffStatus.fp1 ? '접촉 불량' : '정상'}, 
              FP2: {leadOffStatus.fp2 ? '접촉 불량' : '정상'} - 
              주파수 분석 정확도가 저하될 수 있습니다
            </div>
          </div>
        </div>
      )}

      {/* 주파수 밴드 파워 카드들 */}
      <TooltipProvider>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {cardData.map((card, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-800/70 transition-colors cursor-help">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${card.color}`}></div>
                    <span className="text-xs text-gray-400">{card.unit}</span>
                  </div>
                  
                  {/* 전체 파워 막대그래프 */}
                  <div className="mb-2">
                    <div className="text-xs text-gray-400 mb-1">전체</div>
                    <div className="h-8 bg-gray-700 rounded-md relative overflow-hidden">
                      <div 
                        className={`absolute bottom-0 left-0 right-0 ${card.color} opacity-80 rounded-md transition-all duration-300`}
                        style={{ height: `${card.normalizedValue}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-lg">
                          {card.value.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 채널별 막대그래프 */}
                  <div className="space-y-1 mb-2">
                    {/* Ch1 (좌뇌) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-blue-300">Ch1</span>
                        <span className="text-xs text-gray-400">{card.ch1Power.toFixed(1)}</span>
                      </div>
                      <div className="h-6 bg-gray-700 rounded-sm relative overflow-hidden">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-blue-500 opacity-80 rounded-sm transition-all duration-300"
                          style={{ height: `${card.normalizedCh1}%` }}
                        />
                      </div>
                    </div>

                    {/* Ch2 (우뇌) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-red-300">Ch2</span>
                        <span className="text-xs text-gray-400">{card.ch2Power.toFixed(1)}</span>
                      </div>
                      <div className="h-6 bg-gray-700 rounded-sm relative overflow-hidden">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-red-500 opacity-80 rounded-sm transition-all duration-300"
                          style={{ height: `${card.normalizedCh2}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-200">
                      {card.label}
                    </div>
                    <div className="text-xs text-gray-400">
                      {card.frequencyRange}
                    </div>
                    
                    {/* 좌우뇌 차이 표시 */}
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="text-cyan-300">
                        차이: {Math.abs(card.ch1Power - card.ch2Power).toFixed(1)} dB
                      </span>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-neutral-700 border-neutral-600 shadow-xl">
                <div className="max-w-lg p-4 bg-neutral-700 rounded-lg">
                  <div 
                    className="text-sm leading-relaxed space-y-2 [&>strong]:text-blue-300 [&>strong]:font-semibold [&>br]:block [&>br]:mb-1"
                    style={{
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                    }}
                  >
                    <div className="font-semibold text-blue-300 mb-2">{card.label} ({card.frequencyRange})</div>
                    <div className="text-cyan-300">
                      <strong>설명:</strong> {card.description}
                    </div>
                    <div className="text-green-300">
                      <strong>전체 파워:</strong> {card.value.toFixed(2)} dB
                    </div>
                    <div className="text-yellow-300">
                      <strong>채널별 파워:</strong><br/>
                      • Ch1 (FP1/좌뇌): {card.ch1Power.toFixed(2)} dB<br/>
                      • Ch2 (FP2/우뇌): {card.ch2Power.toFixed(2)} dB
                    </div>
                    <div className="text-purple-300">
                      <strong>좌우뇌 차이:</strong> {Math.abs(card.ch1Power - card.ch2Power).toFixed(2)} dB<br/>
                      <span className="text-xs">
                        {card.ch1Power > card.ch2Power ? '좌뇌 우세' : 
                         card.ch2Power > card.ch1Power ? '우뇌 우세' : '균형'}
                      </span>
                    </div>
                    <div className="text-orange-300">
                      <strong>해석:</strong> Power Spectrum 그래프의 {card.frequencyRange} 구간을 평균한 값입니다.
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* 데이터 상태 정보 - 여백 줄임 */}
      <div className="text-xs text-gray-500 text-center mt-2">
        Power Spectrum 기반 실시간 주파수 밴드 분석 • 
        데이터 품질: {dataQuality.overall ? '양호' : '불량'} • 
        스펙트럼 데이터: {dataQuality.spectrumData ? '수신 중' : '대기 중'}
      </div>
    </div>
  );
};

export default EEGBandPowerCards; 