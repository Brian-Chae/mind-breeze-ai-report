import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { useDeviceStore } from '../../../stores/deviceStore';
import { usePPGGraphData, useConnectionState } from '../../../stores/processedDataStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { AlertTriangle } from 'lucide-react';

const PPGFilteredDataChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { connectionState } = useDeviceStore();
  const ppgGraphData = usePPGGraphData();
  const isConnected = useConnectionState();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  const [isInitialized, setIsInitialized] = useState(false);

  // 🔥 오직 processedDataStore PPG 그래프 데이터만 표시 (Index 기반)
  const chartData = useMemo(() => {
    console.log(`📊 PPG 차트 데이터 업데이트 확인:`, {
      hasPPGGraphData: !!ppgGraphData,
      redChannelLength: ppgGraphData?.red?.length || 0,
      irChannelLength: ppgGraphData?.ir?.length || 0,
      isConnected,
      connectionState
    });
    
    // processedDataStore PPG 그래프 데이터가 있는지 확인
    if (ppgGraphData?.red?.length > 0 && ppgGraphData?.ir?.length > 0) {
      // 최근 400개 샘플만 표시 (8초 분량)
      const maxDisplaySamples = 400;
      const redChannel = ppgGraphData.red;
      const irChannel = ppgGraphData.ir;
      
      // 🔧 Index 기반 데이터로 변경 - [index, value] 형태
      const redData: [number, number][] = redChannel
        .slice(-maxDisplaySamples)
        .map((point, index) => [index, point.value]);
      const irData: [number, number][] = irChannel
        .slice(-maxDisplaySamples)
        .map((point, index) => [index, point.value]);
      
      console.log(`✅ PPG 차트 데이터 준비 완료 - Red: ${redData.length}개, IR: ${irData.length}개 (Index 기반)`);
      
      return { redData, irData, hasData: true };
    }
    
    // processedDataStore 데이터가 없으면 빈 상태 반환
    console.log(`⚠️ PPG 차트 데이터 없음`);
    return { redData: [], irData: [], hasData: false };
  }, [ppgGraphData, isConnected, connectionState]);

  // 차트 옵션을 useMemo로 최적화
  const chartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: {
      text: chartData.hasData 
        ? 'PPG 밴드패스 필터링된 신호 (0.5-5.0Hz, Red & IR)' 
        : 'PPG 신호 - 데이터 없음',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#f3f4f6'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#4b5563',
      textStyle: {
        color: '#f3f4f6'
      },
      formatter: (params: any) => {
        const index = params[0].value[0];
        let result = `샘플 #${index}<br/>`;
        params.forEach((param: any) => {
          // 필터링된 신호는 작은 값이므로 소수점 표시
          const value = Math.abs(param.value[1]) < 1000 ? param.value[1].toFixed(2) : param.value[1].toFixed(0);
          result += `${param.seriesName}: ${value}<br/>`;
        });
        result += '<br/><span style="color: #10b981;">🔧 0.5-5.0Hz 밴드패스 필터링됨</span>';
        return result;
      }
    },
    legend: {
      data: ['Red 채널', 'IR 채널'],
      top: 30,
      textStyle: {
        color: '#d1d5db'
      }
    },
    grid: {
      left: '12%',
      right: '8%',
      bottom: '18%',
      top: '25%'
    },
    xAxis: {
      type: 'value',
      name: '시간 (최근 8초)',
      nameLocation: 'middle',
      nameGap: 25,
      nameTextStyle: {
        color: '#d1d5db'
      },
      axisLine: {
        lineStyle: {
          color: '#4b5563'
        }
      },
      axisTick: {
        lineStyle: {
          color: '#4b5563'
        }
      },
      axisLabel: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#374151',
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '필터링된 신호 강도',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: {
        color: '#d1d5db'
      },
      min: -250,
      max: 250,
      minInterval: 50,
      axisLine: {
        lineStyle: {
          color: '#4b5563'
        }
      },
      axisTick: {
        lineStyle: {
          color: '#4b5563'
        }
      },
      axisLabel: {
        color: '#9ca3af',
        formatter: (value: number) => {
          return value.toFixed(0);
        }
      },
      splitLine: {
        lineStyle: {
          color: '#374151',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'Red 채널',
        type: 'line',
        data: [],
        lineStyle: {
          color: '#ef4444',
          width: 2
        },
        symbol: 'none',
        animation: false,
        smooth: true
      },
      {
        name: 'IR 채널',
        type: 'line',
        data: [],
        lineStyle: {
          color: '#7c3aed',
          width: 2
        },
        symbol: 'none',
        animation: false,
        smooth: true
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none'
      }
    ]
  }), []);

  // 차트 업데이트 함수
  const updateChart = () => {
    if (!chartInstance.current) {
      return;
    }

    const { redData, irData, hasData } = chartData;
    
    if (hasData) {
      chartInstance.current.setOption({
        series: [
          {
            data: redData
          },
          {
            data: irData
          }
        ]
      });
    }
  };

  // 차트 초기화
  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
      chartInstance.current.setOption(chartOption);
      setIsInitialized(true);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
        setIsInitialized(false);
      }
    };
  }, [chartOption]);

  // 데이터 업데이트
  useEffect(() => {
    if (isInitialized && chartData.hasData) {
      updateChart();
    }
  }, [isInitialized, chartData]);

  // 창 크기 변경 시 차트 크기 조정
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 연결되지 않았거나 데이터가 없는 경우 메시지 표시
  if (!chartData.hasData) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">❤️</div>
          <div className="text-lg text-gray-300">
            그래프에 표시할 데이터가 없습니다
          </div>
          <div className="text-sm text-gray-400">
            LINK BAND 디바이스를 연결해주세요
          </div>
          <div className="text-xs text-gray-500 mt-2">
            연결 후 PPG 신호를 실시간으로 확인할 수 있습니다
          </div>
          <div className="text-xs text-gray-600 mt-3 p-2 bg-gray-800 rounded">
            processedDataStore PPG 그래프 데이터 처리 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      {/* 센서 접촉 상태 경고 */}
      {isConnected && !isSensorContacted && (
        <div className="mb-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-red-300 text-sm">
            전극 접촉 불량 (FP1: {leadOffStatus.fp1 ? 'OFF' : 'ON'}, FP2: {leadOffStatus.fp2 ? 'OFF' : 'ON'}) - 
            PPG 신호 품질이 저하될 수 있습니다
          </span>
        </div>
      )}
      
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};

export default PPGFilteredDataChart; 