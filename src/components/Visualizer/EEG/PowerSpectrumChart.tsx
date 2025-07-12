import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { useEEGAnalysis, useConnectionState } from '../../../stores/processedDataStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { AlertTriangle } from 'lucide-react';

const PowerSpectrumChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const eegAnalysis = useEEGAnalysis();
  const isConnected = useConnectionState();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    // 차트 초기화
    chartInstance.current = echarts.init(chartRef.current);
    
    const option: echarts.EChartsOption = {
      title: {
        text: '파워 스펙트럼 (필터링된 EEG 데이터)',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const freq = params[0].value[0];
          let result = `주파수: ${freq.toFixed(1)} Hz<br/>`;
          params.forEach((param: any) => {
            result += `${param.seriesName}: ${param.value[1].toFixed(2)} dB<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['FP1 (Ch1)', 'FP2 (Ch2)'],
        top: 30
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%'
      },
      xAxis: {
        type: 'value',
        name: '주파수 (Hz)',
        nameLocation: 'middle',
        nameGap: 25,
        min: 1,
        max: 45,
        axisLabel: {
          formatter: '{value} Hz'
        }
      },
      yAxis: {
        type: 'value',
        name: '파워 (dB)',
        nameLocation: 'middle',
        nameGap: 50,
        min: 0,
        max: 85,
        axisLabel: {
          formatter: (value: number) => {
            return value.toFixed(1) + ' dB';
          }
        }
      },
      series: [
        {
          name: 'FP1 (Ch1)',
          type: 'line',
          data: [],
          lineStyle: {
            color: '#3b82f6',
            width: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
              ]
            }
          },
          symbol: 'none',
          animation: false,
          smooth: true
        },
        {
          name: 'FP2 (Ch2)',
          type: 'line',
          data: [],
          lineStyle: {
            color: '#ef4444',
            width: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.1)' }
              ]
            }
          },
          symbol: 'none',
          animation: false,
          smooth: true
        }
      ],
      // 주파수 대역 표시
      markArea: {
        silent: true,
        data: [
          [
            { name: 'Delta', xAxis: 1, itemStyle: { color: 'rgba(139, 69, 19, 0.1)' } },
            { xAxis: 4 }
          ],
          [
            { name: 'Theta', xAxis: 4, itemStyle: { color: 'rgba(255, 140, 0, 0.1)' } },
            { xAxis: 8 }
          ],
          [
            { name: 'Alpha', xAxis: 8, itemStyle: { color: 'rgba(50, 205, 50, 0.1)' } },
            { xAxis: 13 }
          ],
          [
            { name: 'Beta', xAxis: 13, itemStyle: { color: 'rgba(30, 144, 255, 0.1)' } },
            { xAxis: 30 }
          ],
          [
            { name: 'Gamma', xAxis: 30, itemStyle: { color: 'rgba(148, 0, 211, 0.1)' } },
            { xAxis: 45 }
          ]
        ]
      }
    };

    chartInstance.current.setOption(option);
    setIsInitialized(true);

    // 리사이즈 핸들러
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  // EEG 분석 결과 기반 주파수 스펙트럼 업데이트
  useEffect(() => {
    console.log('🔧 PowerSpectrumChart useEffect 호출:', {
      hasChartInstance: !!chartInstance.current,
      isInitialized,
      hasEEGAnalysis: !!eegAnalysis
    });

    if (!chartInstance.current || !isInitialized) {
      console.log('🔧 PowerSpectrumChart: 차트 인스턴스 또는 초기화 상태 확인 실패');
      return;
    }

    const updateChart = () => {
      // 🔧 데이터 구조 디버깅
      console.log('🔧 PowerSpectrumChart 데이터 상태:', {
        hasEEGAnalysis: !!eegAnalysis,
        hasFrequencySpectrum: !!eegAnalysis?.frequencySpectrum,
        frequencySpectrumKeys: eegAnalysis?.frequencySpectrum ? Object.keys(eegAnalysis.frequencySpectrum) : null,
        hasFrequencies: !!eegAnalysis?.frequencySpectrum?.frequencies,
        hasCh1Power: !!eegAnalysis?.frequencySpectrum?.ch1Power,
        hasCh2Power: !!eegAnalysis?.frequencySpectrum?.ch2Power,
        frequenciesLength: eegAnalysis?.frequencySpectrum?.frequencies?.length || 0,
        ch1PowerLength: eegAnalysis?.frequencySpectrum?.ch1Power?.length || 0,
        ch2PowerLength: eegAnalysis?.frequencySpectrum?.ch2Power?.length || 0,
        frequenciesSample: eegAnalysis?.frequencySpectrum?.frequencies?.slice(0, 5),
        ch1PowerSample: eegAnalysis?.frequencySpectrum?.ch1Power?.slice(0, 5),
        ch2PowerSample: eegAnalysis?.frequencySpectrum?.ch2Power?.slice(0, 5),
        isConnected,
        isSensorContacted,
        leadOffStatus
      });

      if (!eegAnalysis?.frequencySpectrum?.frequencies || 
          !eegAnalysis?.frequencySpectrum?.ch1Power || 
          !eegAnalysis?.frequencySpectrum?.ch2Power) {
        console.log('🔧 PowerSpectrumChart: 주파수 스펙트럼 데이터 없음, 차트 업데이트 스킵');
        return;
      }

      const { frequencies, ch1Power, ch2Power } = eegAnalysis.frequencySpectrum;
      
      // 안전한 데이터 검증
      if (!Array.isArray(frequencies) || !Array.isArray(ch1Power) || !Array.isArray(ch2Power) || 
          frequencies.length !== ch1Power.length || frequencies.length !== ch2Power.length) {
        console.log('🔧 PowerSpectrumChart: 데이터 검증 실패', {
          frequenciesIsArray: Array.isArray(frequencies),
          ch1PowerIsArray: Array.isArray(ch1Power),
          ch2PowerIsArray: Array.isArray(ch2Power),
          lengthMatch: frequencies?.length === ch1Power?.length && frequencies?.length === ch2Power?.length
        });
        return;
      }

      // ch1, ch2 모두에 대한 스펙트럼 데이터 생성
      const ch1SpectrumData = frequencies.map((freq: number, i: number) => [freq, ch1Power[i]]);
      const ch2SpectrumData = frequencies.map((freq: number, i: number) => [freq, ch2Power[i]]);
      
      console.log('🔧 PowerSpectrumChart 차트 업데이트:', {
        ch1SpectrumDataLength: ch1SpectrumData.length,
        ch2SpectrumDataLength: ch2SpectrumData.length,
        ch1SpectrumDataSample: ch1SpectrumData.slice(0, 5),
        ch2SpectrumDataSample: ch2SpectrumData.slice(0, 5)
      });
      
      chartInstance.current?.setOption({
        series: [
          {
            name: 'FP1 (Ch1)',
            data: ch1SpectrumData,
            type: 'line',
            smooth: true,
            lineStyle: {
              color: '#3b82f6',
              width: 2
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                  { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
                ]
              }
            },
            symbol: 'none',
            animation: false
          },
          {
            name: 'FP2 (Ch2)',
            data: ch2SpectrumData,
            type: 'line',
            smooth: true,
            lineStyle: {
              color: '#ef4444',
              width: 2
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                  { offset: 1, color: 'rgba(239, 68, 68, 0.1)' }
                ]
              }
            },
            symbol: 'none',
            animation: false
          }
        ]
      });
    };

    updateChart();

  }, [isInitialized, eegAnalysis?.frequencySpectrum?.frequencies, eegAnalysis?.frequencySpectrum?.ch1Power, eegAnalysis?.frequencySpectrum?.ch2Power]);

  // 조건부 렌더링 - 모든 Hook 호출 이후에 처리
  if (!isConnected || !eegAnalysis?.frequencySpectrum?.frequencies || 
      !eegAnalysis?.frequencySpectrum?.ch1Power || !eegAnalysis?.frequencySpectrum?.ch2Power) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🌈</div>
          <div className="text-lg text-gray-300">
            그래프에 표시할 데이터가 없습니다
          </div>
          <div className="text-sm text-gray-400">
            LINK BAND 디바이스를 연결해주세요
          </div>
          <div className="text-xs text-gray-500 mt-2">
            연결 후 파워 스펙트럼을 실시간으로 확인할 수 있습니다
          </div>
          <div className="text-xs text-gray-600 mt-3 p-2 bg-gray-800 rounded">
            EEG 데이터 기반 주파수 스펙트럼 분석 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 센서 접촉 상태 경고 */}
      {isConnected && !isSensorContacted && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-red-300 text-sm">
            전극 접촉 불량 (FP1: {leadOffStatus.fp1 ? 'OFF' : 'ON'}, FP2: {leadOffStatus.fp2 ? 'OFF' : 'ON'}) - 
            파워 스펙트럼 분석 정확도가 저하될 수 있습니다
          </span>
        </div>
      )}
      
      <div 
        ref={chartRef} 
        className="w-full h-80"
        style={{ minHeight: '320px' }}
      />
      <div className="mt-2 text-xs text-gray-400 text-center">
        EEG 데이터 기반 실시간 파워 스펙트럼 분석 • Morlet Wavelet 변환
      </div>
      <div className="mt-2 flex justify-center space-x-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
          <span className="text-gray-300">FP1 (Ch1)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
          <span className="text-gray-300">FP2 (Ch2)</span>
        </div>
      </div>
    </div>
  );
};

export default PowerSpectrumChart; 