import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProcessedDataStore } from '@/stores/processedDataStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useIsConnected } from '../../../stores/deviceStore';
import { usePPGSQIData, useConnectionState } from '../../../stores/processedDataStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { AlertTriangle } from 'lucide-react';

const PPGSignalQualityChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const ppgSQIData = usePPGSQIData();
  const connectionState = useConnectionState();
  const isConnected = useIsConnected();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  const lastUpdated = useProcessedDataStore(state => state.sqiData.lastUpdated);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 실제 PPG SQI 데이터가 있는지 확인
  const hasRealData = isConnected && ppgSQIData.overallSQI.length > 0;

  // 실제 PPG SQI 데이터 사용 (Index 기반)
  const chartData = useMemo(() => {
    // 🔧 디버깅: ProcessedDataStore 상태 확인
    console.log('🔧 PPG SQI 차트 - ProcessedDataStore 전체 상태 확인:', {
      ppgSQIFromStore: ppgSQIData,
      storeType: 'processedDataStore',
      hasOverallSQI: !!ppgSQIData?.overallSQI,
      overallSQILength: ppgSQIData?.overallSQI?.length || 0,
      overallSQIType: typeof ppgSQIData?.overallSQI,
      firstOverallSQI: ppgSQIData?.overallSQI?.[0],
      lastOverallSQI: ppgSQIData?.overallSQI?.[ppgSQIData?.overallSQI?.length - 1],
      storeLastUpdated: new Date(lastUpdated).toLocaleTimeString()
    });
    
    console.log(`📊 PPG SQI 차트 데이터 업데이트 확인:`, {
      hasPPGSQIData: !!ppgSQIData,
      overallSQILength: ppgSQIData?.overallSQI?.length || 0,
      isConnected,
      connectionState,
      // 🔧 상세 데이터 확인
      ppgSQIDataDetail: {
        redSQILength: ppgSQIData?.redSQI?.length || 0,
        irSQILength: ppgSQIData?.irSQI?.length || 0,
        overallSQILength: ppgSQIData?.overallSQI?.length || 0,
        firstOverallSQI: ppgSQIData?.overallSQI?.[0],
        lastOverallSQI: ppgSQIData?.overallSQI?.[ppgSQIData.overallSQI.length - 1],
        sampleValues: ppgSQIData?.overallSQI?.slice(0, 3)?.map(p => p.value)
      }
    });
    
    if (!hasRealData) {
      console.log(`⚠️ PPG SQI 차트 데이터 없음`);
      return { overallSQI: [], hasData: false };
    }
    
    // 🔧 Index 기반 데이터로 변경 - [index, value] 형태
    const overallSQI: [number, number][] = ppgSQIData.overallSQI.map((point, index) => [index, point.value]);
    
    console.log(`✅ PPG SQI 차트 데이터 준비 완료 - Overall: ${overallSQI.length}개 (Index 기반)`, {
      firstFewData: overallSQI.slice(0, 3),
      lastFewData: overallSQI.slice(-3)
    });
    
    return { overallSQI, hasData: true };
  }, [ppgSQIData, hasRealData, isConnected, connectionState, lastUpdated]);

  // 차트 옵션을 useMemo로 최적화
  const chartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: {
      text: 'PPG 신호 품질 지수 (SQI)',
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
        const sqiValue = params[0].value[1].toFixed(1);
        return `샘플 #${index}<br/>PPG SQI: ${sqiValue}%`;
      }
    },
    legend: {
      data: ['PPG SQI'],
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
      name: 'SQI (%)',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: {
        color: '#d1d5db'
      },
      min: 0,
      max: 100,
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
        formatter: '{value}%'
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
        name: 'PPG SQI',
        type: 'line',
        data: [],
        lineStyle: {
          color: '#10b981',
          width: 3
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

  // 차트 업데이트 함수를 useCallback로 최적화
  const updateChart = useCallback(() => {
    if (!chartInstance.current) return;

    const { overallSQI } = chartData;
    
    chartInstance.current.setOption({
      series: [
        {
          data: overallSQI
        }
      ]
    });
  }, [chartData]);

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
  }, [isInitialized, chartData, updateChart]);

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
  if (!hasRealData) {
    const overallSQILength = ppgSQIData?.overallSQI?.length || 0;
    
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-lg text-gray-300">
            그래프에 표시할 데이터가 없습니다
          </div>
          <div className="text-sm text-gray-400">
            LINK BAND 디바이스를 연결해주세요
          </div>
          <div className="text-xs text-gray-500 mt-2">
            연결 후 PPG 신호 품질을 실시간으로 확인할 수 있습니다
          </div>
          <div className="text-xs text-gray-600 mt-3 p-2 bg-gray-800 rounded">
            디버그 정보:<br/>
            연결 상태: {isConnected ? '연결됨' : '연결 안됨'}<br/>
            PPG SQI 데이터: {overallSQILength}개<br/>
            PPG 신호 품질 분석 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      {/* 센서 접촉 상태 경고 */}
      {isConnected && !isSensorContacted && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-red-300 text-sm">
            전극 접촉 불량 (FP1: {leadOffStatus.fp1 ? 'OFF' : 'ON'}, FP2: {leadOffStatus.fp2 ? 'OFF' : 'ON'}) - 
            PPG 신호 품질 분석 정확도가 저하될 수 있습니다
          </span>
        </div>
      )}
      
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};

export default PPGSignalQualityChart; 