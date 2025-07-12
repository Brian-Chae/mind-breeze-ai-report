import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import { useDeviceStore } from '../../../stores/deviceStore';
import { useACCAnalysis, useConnectionState, useACCBufferData } from '../../../stores/processedDataStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { AlertTriangle } from 'lucide-react';

const ACCMagnitudeChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { connectionState } = useDeviceStore();
  const accAnalysis = useACCAnalysis();
  const isConnected = useConnectionState();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  const accBufferData = useACCBufferData();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 🔧 업데이트 주기 측정을 위한 상태
  const [updateInterval, setUpdateInterval] = useState<number>(0);
  const lastUpdateTime = useRef<number>(0);
  const updateIntervals = useRef<number[]>([]);

  // 🔧 활동 상태별 색상 정의 - 메모이제이션
  const getActivityColor = useCallback((magnitude: number): string => {
    if (magnitude < 0.1) return '#3b82f6'; // stationary - 파란색
    if (magnitude < 0.3) return '#10b981'; // sitting - 초록색  
    if (magnitude < 0.8) return '#f59e0b'; // walking - 노란색
    return '#ef4444'; // running - 빨간색
  }, []);

  // 🔧 활동 상태 분류 - 메모이제이션
  const getActivityState = useCallback((magnitude: number): string => {
    if (magnitude < 0.1) return 'stationary';
    if (magnitude < 0.3) return 'sitting';
    if (magnitude < 0.8) return 'walking';
    return 'running';
  }, []);

  // 🔧 ACC 버퍼 데이터를 인덱스 기반으로 변환 - 최적화된 메모이제이션
  const chartData = useMemo(() => {
    if (!accBufferData || accBufferData.length === 0) {
      return { magnitudeData: [], hasData: false };
    }

    console.log(`📊 ACC 차트 데이터 처리 시작 - ${accBufferData.length}개 샘플`);
    const startTime = performance.now();

    // 🔧 배치 처리로 성능 최적화 - 개별 막대 색상 적용
    const magnitudeData = accBufferData.map((sample, index) => {
      const magnitude = sample.magnitude || Math.sqrt(sample.x ** 2 + sample.y ** 2 + sample.z ** 2);
      const adjustedMagnitude = Math.abs(magnitude - 1);
      const activityColor = getActivityColor(adjustedMagnitude);
      
      return {
        value: adjustedMagnitude,
        itemStyle: {
          color: activityColor,
          borderRadius: [2, 2, 0, 0]
        },
        activityState: getActivityState(adjustedMagnitude)
      };
    });

    const endTime = performance.now();
    console.log(`✅ ACC 차트 데이터 처리 완료 - ${endTime - startTime}ms`);
    
    return { 
      magnitudeData, 
      hasData: true
    };
  }, [accBufferData, getActivityColor, getActivityState]);

  // 🔧 차트 옵션을 useMemo로 최적화 - 불필요한 재생성 방지
  const chartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: {
      text: chartData.hasData 
        ? 'ACC 가속도 크기 (중력 제거)' 
        : 'ACC 가속도 - 데이터 없음',
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
        const index = params[0].dataIndex;
        const magnitude = params[0].value.toFixed(2);
        const activityState = params[0].data.activityState;
        return `샘플 #${index}<br/>움직임 크기: ${magnitude}g<br/>활동 상태: ${activityState}<br/>(중력 제거)`;
      }
    },
    legend: {
      data: ['움직임 크기'],
      top: 30,
      textStyle: {
        color: '#d1d5db'
      }
    },
    grid: {
      left: '12%',
      right: '8%',
      bottom: '18%',
      top: '20%'
    },
    xAxis: {
      type: 'category',
      name: '시간 (과거 5초)',
      nameLocation: 'middle',
      nameGap: 30,
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
        show: false  // X축 인덱스 숫자 제거
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
      name: '움직임 크기 (g)',
      nameLocation: 'middle',
      nameGap: 35,
      nameTextStyle: {
        color: '#d1d5db'
      },
      min: 0,
      max: 2,
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
          return value.toFixed(1) + 'g';
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
        name: '움직임 크기',
        type: 'bar',
        data: chartData.magnitudeData,
        barWidth: '80%',
        animation: false, // 🔧 애니메이션 비활성화로 성능 향상
        large: false, // 🔧 개별 색상 적용을 위해 large 모드 비활성화
        largeThreshold: 1000 // 🔧 개별 색상 적용을 위해 임계값 증가
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none'
      }
    ]
  }), [chartData.hasData]);

  // 🔧 차트 업데이트 함수 - useCallback으로 최적화
  const updateChart = useCallback(() => {
    if (!chartInstance.current || !chartData.hasData) {
      return;
    }

    const startTime = performance.now();
    
    // 🔧 업데이트 주기 측정 - 이동 평균 사용
    const currentTime = Date.now();
    if (lastUpdateTime.current > 0) {
      const interval = (currentTime - lastUpdateTime.current) / 1000; // 초 단위
      
      // 최근 5개 측정값으로 이동 평균 계산
      updateIntervals.current.push(interval);
      if (updateIntervals.current.length > 5) {
        updateIntervals.current.shift();
      }
      
      // 0.01초 이상인 경우만 유효한 측정값으로 간주
      if (interval > 0.01) {
        const avgInterval = updateIntervals.current.reduce((sum, val) => sum + val, 0) / updateIntervals.current.length;
        setUpdateInterval(avgInterval);
      }
    }
    lastUpdateTime.current = currentTime;
    
    // 🔧 개별 막대 색상 적용을 위한 완전한 시리즈 업데이트
    chartInstance.current.setOption({
      series: [{
        name: '움직임 크기',
        type: 'bar',
        data: chartData.magnitudeData,
        barWidth: '80%',
        animation: false,
        large: false, // 🔧 개별 색상 적용을 위해 large 모드 비활성화
        largeThreshold: 1000
      }]
    }, false); // 🔧 notMerge: false로 성능 향상

    const endTime = performance.now();
    console.log(`🔄 차트 업데이트 완료 - ${endTime - startTime}ms, 색상 적용된 막대: ${chartData.magnitudeData.length}개, 업데이트 간격: ${updateInterval.toFixed(2)}초`);
  }, [chartData, updateInterval]);

  // 🔧 차트 초기화 - 의존성 최적화
  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      console.log('🎯 차트 초기화 시작');
      chartInstance.current = echarts.init(chartRef.current);
      chartInstance.current.setOption(chartOption);
      setIsInitialized(true);
      console.log('✅ 차트 초기화 완료');
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
        setIsInitialized(false);
      }
    };
  }, []); // 🔧 빈 의존성 배열로 한 번만 실행

  // 🔧 차트 옵션 업데이트 - 분리된 useEffect
  useEffect(() => {
    if (chartInstance.current && isInitialized) {
      chartInstance.current.setOption(chartOption, true);
    }
  }, [chartOption, isInitialized]);

  // 🔧 데이터 업데이트 - 최적화된 useEffect
  useEffect(() => {
    if (isInitialized && chartData.hasData) {
      updateChart();
    }
  }, [isInitialized, chartData.hasData, updateChart]);

  // 🔧 창 크기 변경 시 차트 크기 조정 - 쓰로틀링 적용
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (chartInstance.current) {
          chartInstance.current.resize();
        }
      }, 100); // 🔧 100ms 디바운스
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // 연결되지 않았거나 데이터가 없는 경우 메시지 표시
  if (!chartData.hasData) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl mb-2">📱</div>
          <div className="text-base text-gray-300">
            그래프에 표시할 데이터가 없습니다
          </div>
          <div className="text-sm text-gray-400">
            LINK BAND 디바이스를 연결해주세요
          </div>
          <div className="text-xs text-gray-500 mt-1">
            연결 후 ACC 가속도 신호를 실시간으로 확인할 수 있습니다
          </div>
          <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-800 rounded">
            processedDataStore ACC 버퍼 데이터 처리 중...
          </div>
        </div>
      </div>
    );
  }

  // 🔧 현재 활동 상태 계산
  const currentActivity = useMemo(() => {
    if (!chartData.hasData || chartData.magnitudeData.length === 0) {
      return { state: 'unknown', color: '#6b7280' };
    }
    
    const latestSample = chartData.magnitudeData[chartData.magnitudeData.length - 1];
    const magnitude = latestSample.value as number;
    
    if (magnitude < 0.1) return { state: '정지', color: '#3b82f6' };
    if (magnitude < 0.3) return { state: '앉기', color: '#10b981' };
    if (magnitude < 0.8) return { state: '걷기', color: '#f59e0b' };
    return { state: '뛰기', color: '#ef4444' };
  }, [chartData]);

  return (
    <div className="w-full h-64 relative">
      {/* 센서 접촉 상태 경고 */}
      {isConnected && !isSensorContacted && (
        <div className="absolute top-0 left-0 right-0 z-20 mb-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-red-300 text-sm">
            전극 접촉 불량 (FP1: {leadOffStatus.fp1 ? 'OFF' : 'ON'}, FP2: {leadOffStatus.fp2 ? 'OFF' : 'ON'}) - 
            ACC 신호 품질이 저하될 수 있습니다
          </span>
        </div>
      )}

      {/* 업데이트 주기 표시 - 우측 상단 */}
      <div className="absolute top-2 right-2 z-10">
        <div className="flex items-center space-x-2 px-2 py-1 bg-gray-800 bg-opacity-80 rounded-md border border-gray-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-gray-300">
            그래프 업데이트 주기: {updateInterval > 0 ? `${updateInterval.toFixed(2)}초` : '측정 중...'}
          </span>
        </div>
      </div>
      
      {/* 현재 활동 상태 인디케이터 - 그래프 중앙 위쪽 */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10">
        {/* <div className="flex items-center space-x-2 px-3 py-1 rounded-full" 
             style={{ backgroundColor: `${currentActivity.color}20`, border: `1px solid ${currentActivity.color}` }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentActivity.color }}></div>
          <span className="text-sm font-medium" style={{ color: currentActivity.color }}>
            현재 활동: {currentActivity.state}
          </span>
        </div> */}
      </div>
      
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};

export default ACCMagnitudeChart; 