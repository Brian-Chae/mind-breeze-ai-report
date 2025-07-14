import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { useEEGGraphData, useConnectionState } from '../../../stores/processedDataStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { AlertTriangle } from 'lucide-react';

interface FilteredRawDataChartProps {
  channel?: 'ch1' | 'ch2' | 'both';
  title?: string;
}

const FilteredRawDataChart: React.FC<FilteredRawDataChartProps> = ({ 
  channel = 'both',
  title 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const eegGraphData = useEEGGraphData();
  const isConnected = useConnectionState();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  const [isInitialized, setIsInitialized] = useState(false);

  // 채널별 센서 접촉 상태 확인
  const getChannelContactStatus = () => {
    if (!isConnected || !isSensorContacted) {
      if (channel === 'ch1') {
        return leadOffStatus.fp1 ? 'poor' : 'good';
      } else if (channel === 'ch2') {
        return leadOffStatus.fp2 ? 'poor' : 'good';
      } else {
        return (leadOffStatus.fp1 || leadOffStatus.fp2) ? 'poor' : 'good';
      }
    }
    return 'good';
  };

  const channelContactStatus = getChannelContactStatus();

  // 🔧 EEG 그래프 데이터 디버깅 로그
  useEffect(() => {
    console.log('🔧 FilteredRawDataChart EEG 그래프 데이터 상태:', {
      isConnected,
      eegGraphDataExists: !!eegGraphData,
      fp1Length: eegGraphData?.fp1?.length || 0,
      fp2Length: eegGraphData?.fp2?.length || 0,
      fp1Sample: eegGraphData?.fp1?.[0],
      fp2Sample: eegGraphData?.fp2?.[0]
    });
  }, [eegGraphData, isConnected]);

  // 실제 EEG 데이터가 있는지 확인 (FP1, FP2 채널 사용)
  const hasRealData = isConnected && 
    (eegGraphData?.fp1?.length > 0 || eegGraphData?.fp2?.length > 0);

  // 🔥 오직 processedDataStore EEG 그래프 데이터만 표시 (Index 기반)
  const chartData = useMemo(() => {
    console.log('🔧 chartData 계산 시작:', {
      hasEEGGraphData: !!eegGraphData,
      fp1Length: eegGraphData?.fp1?.length || 0,
      fp2Length: eegGraphData?.fp2?.length || 0,
      channel,
      fp1SampleData: eegGraphData?.fp1?.slice(-3),
      fp2SampleData: eegGraphData?.fp2?.slice(-3)
    });
    
    // processedDataStore EEG 그래프 데이터가 있는지 확인
    if (eegGraphData?.fp1?.length > 0 && eegGraphData?.fp2?.length > 0) {
      // 최근 1000개 샘플만 표시 (4초 분량)
      const maxDisplaySamples = 1000;
      const fp1Channel = eegGraphData.fp1;
      const fp2Channel = eegGraphData.fp2;
      
      // 🔧 Index 기반 데이터로 변경 - [index, value] 형태
      const fp1Data: [number, number][] = fp1Channel
        .slice(-maxDisplaySamples)
        .map((point, index) => [index, point.value]);
      
      const fp2Data: [number, number][] = fp2Channel
        .slice(-maxDisplaySamples)
        .map((point, index) => [index, point.value]);
      
      console.log('🔧 chartData 변환 완료 (Index 기반):', {
        fp1DataLength: fp1Data.length,
        fp2DataLength: fp2Data.length,
        fp1Sample: fp1Data[0],
        fp2Sample: fp2Data[0],
        fp1LastSample: fp1Data[fp1Data.length - 1],
        fp2LastSample: fp2Data[fp2Data.length - 1],
        fp1ValueRange: fp1Data.length > 0 ? {
          min: Math.min(...fp1Data.map(d => d[1])),
          max: Math.max(...fp1Data.map(d => d[1]))
        } : null,
        fp2ValueRange: fp2Data.length > 0 ? {
          min: Math.min(...fp2Data.map(d => d[1])),
          max: Math.max(...fp2Data.map(d => d[1]))
        } : null
      });
      
      // 채널에 따른 데이터 반환
      if (channel === 'ch1') {
        return { fp1: fp1Data, fp2: [], hasData: fp1Data.length > 0 };
      } else if (channel === 'ch2') {
        return { fp1: [], fp2: fp2Data, hasData: fp2Data.length > 0 };
      } else {
        return { fp1: fp1Data, fp2: fp2Data, hasData: fp1Data.length > 0 || fp2Data.length > 0 };
      }
    }
    
    console.log('🔧 chartData 계산 결과: 데이터 없음');
    return { fp1: [], fp2: [], hasData: false };
  }, [eegGraphData, isConnected, channel]);

  useEffect(() => {
    if (!chartRef.current || !hasRealData) {
      return;
    }

    // 차트 초기화
    chartInstance.current = echarts.init(chartRef.current);
    
    // 채널별 시리즈 설정
    const series: echarts.LineSeriesOption[] = [];
    const legend: string[] = [];
    
    if (channel === 'both' || channel === 'ch1') {
      series.push({
        name: '채널 1 (FP1)',
        type: 'line',
        data: [],
        lineStyle: {
          color: '#10b981',
          width: 1.5
        },
        symbol: 'none',
        animation: false,
        sampling: 'lttb'
      });
      legend.push('채널 1 (FP1)');
    }
    
    if (channel === 'both' || channel === 'ch2') {
      series.push({
        name: '채널 2 (FP2)',
        type: 'line',
        data: [],
        lineStyle: {
          color: '#f59e0b',
          width: 1.5
        },
        symbol: 'none',
        animation: false,
        sampling: 'lttb'
      });
      legend.push('채널 2 (FP2)');
    }
    
    const option: echarts.EChartsOption = {
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
            result += `${param.seriesName}: ${param.value[1].toFixed(2)} μV<br/>`;
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
        name: '전압 (μV)',
        nameLocation: 'middle',
        nameGap: 40,
        min: -150,
        max: 150,
        axisLabel: {
          formatter: '{value} μV'
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
  }, [channel, title, hasRealData]); // hasRealData 의존성 추가

  // 데이터 업데이트 useEffect
  useEffect(() => {
    if (!chartInstance.current || !isInitialized) return;

    // processedDataStore EEG 그래프 데이터가 업데이트될 때마다 즉시 업데이트
    const updateChart = () => {
      if (!chartData.hasData) return;

      const { fp1, fp2 } = chartData;
      
      // 채널에 따른 시리즈 업데이트
      const seriesUpdate: any[] = [];
      
      if (channel === 'both') {
        // 두 채널 모두 표시
        seriesUpdate.push({ data: fp1 }); // 시리즈 0: FP1
        seriesUpdate.push({ data: fp2 }); // 시리즈 1: FP2
      } else if (channel === 'ch1') {
        // Ch1만 표시
        seriesUpdate.push({ data: fp1 }); // 시리즈 0: FP1
      } else if (channel === 'ch2') {
        // Ch2만 표시
        seriesUpdate.push({ data: fp2 }); // 시리즈 0: FP2
      }
      
      console.log('🔧 차트 업데이트 실행:', {
        channel,
        seriesCount: seriesUpdate.length,
        fp1DataLength: fp1.length,
        fp2DataLength: fp2.length,
        seriesUpdate: seriesUpdate.map((s, i) => ({ index: i, dataLength: s.data.length }))
      });
      
      chartInstance.current?.setOption({
        series: seriesUpdate
      });
    };

    updateChart();

  }, [isInitialized, chartData, eegGraphData, channel]); // channel 의존성 추가

  // 연결되지 않았거나 데이터가 없는 경우 메시지 표시
  if (!hasRealData) {
    const fp1Length = eegGraphData?.fp1?.length || 0;
    const fp2Length = eegGraphData?.fp2?.length || 0;
    
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🧠</div>
          <div className="text-lg text-gray-300">
            그래프에 표시할 데이터가 없습니다
          </div>
          <div className="text-sm text-gray-400">
            LINK BAND 디바이스를 연결해주세요
          </div>
          <div className="text-xs text-gray-500 mt-2">
            연결 후 {channel === 'ch1' ? '채널 1' : channel === 'ch2' ? '채널 2' : '뇌파'} 신호를 실시간으로 확인할 수 있습니다
          </div>
          <div className="text-xs text-gray-600 mt-3 p-2 bg-gray-800 rounded">
            디버그 정보:<br/>
            연결 상태: {isConnected ? '연결됨' : '연결 안됨'}<br/>
            FP1 데이터: {fp1Length}개<br/>
            FP2 데이터: {fp2Length}개<br/>
            EEG 그래프 데이터: {eegGraphData ? '존재' : '없음'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      {/* 센서 접촉 상태 경고 */}
      {isConnected && channelContactStatus === 'poor' && (
        <div className="mb-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-red-300 text-sm">
            {channel === 'ch1' ? 'FP1 전극 접촉 불량' : 
             channel === 'ch2' ? 'FP2 전극 접촉 불량' : 
             '전극 접촉 불량 감지'}
            - 신호 품질이 저하될 수 있습니다
          </span>
        </div>
      )}
      
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};

export default FilteredRawDataChart; 