import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import { useEEGSQIData, useConnectionState } from '../../../stores/processedDataStore';

interface SignalQualityChartProps {
  channel?: 'ch1' | 'ch2' | 'both';
  title?: string;
}

const SignalQualityChart: React.FC<SignalQualityChartProps> = ({ 
  channel = 'both',
  title 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const eegSQIData = useEEGSQIData();
  const isConnected = useConnectionState();
  const [isInitialized, setIsInitialized] = useState(false);

  // EEG 분석 결과 기반 SQI 데이터가 있는지 확인 (조건 완화)
  const hasRealData = eegSQIData?.ch1SQI?.length > 0 || eegSQIData?.ch2SQI?.length > 0;

  // 🔧 디버깅: 데이터 상태 확인
  console.log('🔧 SignalQualityChart 데이터 상태:', {
    isConnected,
    hasEEGSQIData: !!eegSQIData,
    ch1SQILength: eegSQIData?.ch1SQI?.length || 0,
    ch2SQILength: eegSQIData?.ch2SQI?.length || 0,
    hasRealData,
    ch1SQISample: eegSQIData?.ch1SQI?.slice(0, 3),
    ch2SQISample: eegSQIData?.ch2SQI?.slice(0, 3)
  });

  // 🔧 차트 옵션을 useMemo로 최적화
  const chartOption = useMemo(() => {
    // 채널별 시리즈 설정
    const series: echarts.LineSeriesOption[] = [];
    const legend: string[] = [];
    
    if (channel === 'both' || channel === 'ch1') {
      series.push({
        name: '채널 1 SQI (FP1)',
        type: 'line',
        data: [],
        lineStyle: {
          color: '#10b981',
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
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
            ]
          }
        },
        symbol: 'none',
        animation: false
      });
      legend.push('채널 1 SQI (FP1)');
    }
    
    if (channel === 'both' || channel === 'ch2') {
      series.push({
        name: '채널 2 SQI (FP2)',
        type: 'line',
        data: [],
        lineStyle: {
          color: '#f59e0b',
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
              { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.1)' }
            ]
          }
        },
        symbol: 'none',
        animation: false
      });
      legend.push('채널 2 SQI (FP2)');
    }
    
    return {
      title: title ? {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#e5e7eb'
        }
      } : undefined,
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const index = params[0].value[0];
          let result = `샘플 #${index}<br/>`;
          params.forEach((param: any) => {
            result += `${param.seriesName}: ${param.value[1].toFixed(1)}%<br/>`;
          });
          return result;
        }
      },
      legend: legend.length > 1 ? {
        data: legend,
        top: title ? 30 : 10
      } : undefined,
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: title ? (legend.length > 1 ? '20%' : '15%') : (legend.length > 1 ? '15%' : '10%')
      },
      xAxis: {
        type: 'value',
        name: '시간 (최신 4초)',
        nameLocation: 'middle',
        nameGap: 25,
        axisLabel: {
          show: false // X축 값 숨기기
        }
      },
      yAxis: {
        type: 'value',
        name: '신호 품질 (%)',
        nameLocation: 'middle',
        nameGap: 40,
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: series,
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'none'
        }
      ]
    };
  }, [channel, title]);

  // EEG 분석 결과 기반 SQI 데이터 처리 (Index 기반)
  const chartData = useMemo(() => {
    console.log('🔧 SignalQualityChart chartData 계산:', {
      hasEEGSQIData: !!eegSQIData,
      hasRealData,
      ch1SQILength: eegSQIData?.ch1SQI?.length || 0,
      ch2SQILength: eegSQIData?.ch2SQI?.length || 0
    });

    if (!eegSQIData) {
      console.log('🔧 SignalQualityChart: eegSQIData 없음');
      return { ch1: [], ch2: [], hasData: false };
    }

    // 🔧 데이터가 있으면 연결 상태와 관계없이 표시
    if (!hasRealData) {
      console.log('🔧 SignalQualityChart: SQI 데이터 없음');
      return { ch1: [], ch2: [], hasData: false };
    }

    // 최근 1000개 샘플만 표시 (약 4초 분량)
    const maxDisplaySamples = 1000;
    
    // 🔧 Index 기반 데이터로 변경 - [index, value] 형태
    const ch1Data = eegSQIData.ch1SQI
      .slice(-maxDisplaySamples)
      .map((point: any, index: number) => [index, point.value]);
    
    const ch2Data = eegSQIData.ch2SQI
      .slice(-maxDisplaySamples)
      .map((point: any, index: number) => [index, point.value]);

    console.log('🔧 SignalQualityChart chartData 생성 완료:', {
      ch1DataLength: ch1Data.length,
      ch2DataLength: ch2Data.length,
      ch1Sample: ch1Data.slice(0, 3),
      ch2Sample: ch2Data.slice(0, 3),
      hasData: ch1Data.length > 0 || ch2Data.length > 0
    });

    return {
      ch1: ch1Data,
      ch2: ch2Data,
      hasData: ch1Data.length > 0 || ch2Data.length > 0
    };
  }, [eegSQIData, hasRealData]);

  // 차트 초기화
  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption(chartOption);
    setIsInitialized(true);

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [chartOption]);

  // EEG 분석 결과 기반 SQI 데이터 업데이트
  useEffect(() => {
    if (!chartInstance.current || !isInitialized) return;

    const updateChart = () => {
      console.log('🔧 SignalQualityChart updateChart 호출:', {
        hasChartData: chartData.hasData,
        ch1Length: chartData.ch1.length,
        ch2Length: chartData.ch2.length,
        channel
      });

      if (!chartData.hasData) {
        console.log('🔧 SignalQualityChart: 차트 데이터 없음, 업데이트 스킵');
        return;
      }

      const { ch1, ch2 } = chartData;
      
      const seriesData = [];
      if (channel === 'both' || channel === 'ch1') {
        seriesData.push({ data: ch1 });
        console.log('🔧 SignalQualityChart: Ch1 데이터 추가', ch1.slice(0, 3));
      }
      if (channel === 'both' || channel === 'ch2') {
        seriesData.push({ data: ch2 });
        console.log('🔧 SignalQualityChart: Ch2 데이터 추가', ch2.slice(0, 3));
      }
      
      console.log('🔧 SignalQualityChart: 차트 업데이트 실행', {
        seriesCount: seriesData.length,
        totalDataPoints: seriesData.reduce((sum, s) => sum + s.data.length, 0)
      });
      
      chartInstance.current?.setOption({
        series: seriesData
      });
    };

    updateChart();

  }, [isInitialized, chartData.hasData, chartData.ch1, chartData.ch2, channel]);

  // 연결되지 않았거나 데이터가 없는 경우 메시지 표시
  if (!hasRealData) {
    const ch1Length = eegSQIData?.ch1SQI?.length || 0;
    const ch2Length = eegSQIData?.ch2SQI?.length || 0;
    
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">📈</div>
          <div className="text-lg text-gray-300">
            그래프에 표시할 데이터가 없습니다
          </div>
          <div className="text-sm text-gray-400">
            LINK BAND 디바이스를 연결해주세요
          </div>
          <div className="text-xs text-gray-500 mt-2">
            연결 후 {channel === 'ch1' ? '채널 1' : channel === 'ch2' ? '채널 2' : '신호 품질'}을 실시간으로 확인할 수 있습니다
          </div>
          <div className="text-xs text-gray-600 mt-3 p-2 bg-gray-800 rounded">
            디버그 정보:<br/>
            연결 상태: {isConnected ? '연결됨' : '연결 안됨'}<br/>
            Ch1 SQI 데이터: {ch1Length}개<br/>
            Ch2 SQI 데이터: {ch2Length}개<br/>
            EEG 데이터 기반 SQI 계산 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};

export default SignalQualityChart; 