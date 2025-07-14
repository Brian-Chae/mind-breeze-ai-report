/**
 * AI Health Report 홈 화면 컴포넌트
 * - 새로운 측정 시작
 * - 측정 히스토리 보기
 * - 디바이스 조건 검사 및 피드백
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  Brain, 
  Heart, 
  TrendingUp, 
  Play, 
  History, 
  Wifi, 
  Battery, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  User,
  BarChart3,
  Target,
  Calendar
} from 'lucide-react';
import { bluetoothService } from '../../../utils/bluetoothService';

// ✅ 직접 Store hooks import 추가
import { useDeviceStore } from '../../../stores/deviceStore';
import { useProcessedDataStore } from '../../../stores/processedDataStore';

interface HomeScreenProps {
  onStartNewMeasurement: () => void;
  onViewHistory: () => void;
  onViewTrends?: () => void;
}

interface DeviceCondition {
  id: string;
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  icon: React.ReactNode;
  required: boolean;
}

export function HomeScreen({ onStartNewMeasurement, onViewHistory, onViewTrends }: HomeScreenProps) {
  // ✅ 직접 Store hooks 사용 (ApplicationContext 스냅샷 대신)
  const deviceStore = useDeviceStore();
  const processedDataStore = useProcessedDataStore();
  // const { deviceStore, processedDataStore, systemStore } = useApplicationStores(); // ❌ 제거
  
  // 베터리 정보 상태
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryLoading, setBatteryLoading] = useState(false);
  
  // 베터리 정보 가져오기
  useEffect(() => {
    const fetchBatteryLevel = async () => {
      const isConnected = deviceStore?.connectionState?.status === 'connected';
      
      if (isConnected) {
        setBatteryLoading(true);
        try {
          const level = await bluetoothService.getBatteryLevel();
          setBatteryLevel(level);
          console.log('🔋 bluetoothService에서 베터리 정보 가져옴:', level);
        } catch (error) {
          console.error('🔋 베터리 정보 가져오기 실패:', error);
          setBatteryLevel(null);
        } finally {
          setBatteryLoading(false);
        }
      } else {
        setBatteryLevel(null);
        setBatteryLoading(false);
      }
    };
    
    fetchBatteryLevel();
    
    // 5초마다 베터리 정보 업데이트
    const interval = setInterval(fetchBatteryLevel, 5000);
    
    return () => clearInterval(interval);
  }, [deviceStore?.connectionState?.status]);
  
  // 디바이스 조건 검사
  const deviceConditions = useMemo((): DeviceCondition[] => {
    const conditions: DeviceCondition[] = [];
    
    // 1. 디바이스 연결 상태 확인
    const isConnected = deviceStore?.connectionState?.status === 'connected';
    conditions.push({
      id: 'connection',
      name: '디바이스 연결',
      status: isConnected ? 'ok' : 'error',
      message: isConnected ? '디바이스가 연결되었습니다' : '디바이스를 연결해주세요',
      icon: <Wifi className="w-4 h-4" />,
      required: true
    });
    
    // 2. 샘플링 레이트 확인 (연결된 경우에만)
    if (isConnected && deviceStore?.connectedDevice?.samplingRates) {
      const rates = deviceStore.connectedDevice.samplingRates;
      
      // EEG 240Hz 이상
      conditions.push({
        id: 'eeg_rate',
        name: 'EEG 샘플링 레이트',
        status: rates.eeg >= 240 ? 'ok' : 'error',
        message: rates.eeg >= 240 
          ? `EEG: ${rates.eeg}Hz (정상)` 
          : `EEG: ${rates.eeg}Hz (240Hz 이상 필요)`,
        icon: <Brain className="w-4 h-4" />,
        required: true
      });
      
      // PPG 40Hz 이상
      conditions.push({
        id: 'ppg_rate',
        name: 'PPG 샘플링 레이트',
        status: rates.ppg >= 40 ? 'ok' : 'error',
        message: rates.ppg >= 40 
          ? `PPG: ${rates.ppg}Hz (정상)` 
          : `PPG: ${rates.ppg}Hz (40Hz 이상 필요)`,
        icon: <TrendingUp className="w-4 h-4" />,
        required: true
      });
      
      // ACC 20Hz 이상
      conditions.push({
        id: 'acc_rate',
        name: 'ACC 샘플링 레이트',
        status: rates.acc >= 20 ? 'ok' : 'error',
        message: rates.acc >= 20 
          ? `ACC: ${rates.acc}Hz (정상)` 
          : `ACC: ${rates.acc}Hz (20Hz 이상 필요)`,
        icon: <Zap className="w-4 h-4" />,
        required: true
      });
    } else if (isConnected) {
      // 연결되었지만 샘플링 레이트 정보가 없는 경우
      conditions.push({
        id: 'sampling_rates',
        name: '샘플링 레이트 정보',
        status: 'warning',
        message: '샘플링 레이트 정보를 확인하는 중...',
        icon: <Clock className="w-4 h-4" />,
        required: true
      });
    }
    
    // 3. 배터리 레벨 확인 (연결된 경우에만)
    if (isConnected) {
      if (batteryLoading) {
        // 베터리 정보 로딩 중
        conditions.push({
          id: 'battery_loading',
          name: '배터리 정보',
          status: 'warning',
          message: '배터리 정보를 확인하는 중...',
          icon: <Battery className="w-4 h-4" />,
          required: false
        });
      } else if (batteryLevel !== null && batteryLevel > 0) {
        // 베터리 정보 있음
        conditions.push({
          id: 'battery',
          name: '배터리 레벨',
          status: batteryLevel >= 10 ? 'ok' : 'warning',
          message: batteryLevel >= 10 
            ? `배터리: ${batteryLevel}% (정상)` 
            : `배터리: ${batteryLevel}% (낮음, 측정 가능)`,
          icon: <Battery className="w-4 h-4" />,
          required: false // 필수 조건에서 제외하여 측정 허용
        });
      } else {
        // 베터리 정보 없음
        conditions.push({
          id: 'battery_unavailable',
          name: '배터리 정보',
          status: 'warning',
          message: '배터리 정보를 가져올 수 없습니다',
          icon: <Battery className="w-4 h-4" />,
          required: false
        });
      }
    }
    
    // 4. 스트리밍 상태 확인 (연결된 경우에만)
    if (isConnected) {
      const isStreaming = processedDataStore?.isConnected || false;
      conditions.push({
        id: 'streaming',
        name: '데이터 스트리밍',
        status: isStreaming ? 'ok' : 'warning',
        message: isStreaming ? '데이터 스트리밍 중' : '데이터 스트리밍이 시작되지 않았습니다',
        icon: <Play className="w-4 h-4" />,
        required: false // 필수는 아니지만 권장
      });
    }
    
    return conditions;
  }, [deviceStore, processedDataStore, batteryLevel, batteryLoading]);
  
  // 모든 필수 조건이 만족되는지 확인
  const canStartMeasurement = useMemo(() => {
    return deviceConditions
      .filter(condition => condition.required)
      .every(condition => condition.status === 'ok');
  }, [deviceConditions]);
  
  // 베터리 부족 경고 확인
  const batteryWarning = useMemo(() => {
    const batteryCondition = deviceConditions.find(c => c.id === 'battery');
    return batteryCondition?.status === 'warning';
  }, [deviceConditions]);
  
  // 경고/오류가 있는 조건들
  const issueConditions = useMemo(() => {
    return deviceConditions.filter(condition => 
      condition.status === 'error' || condition.status === 'warning'
    );
  }, [deviceConditions]);

  return (
    <div className="min-h-full bg-black p-6 pt-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Health Report</h1>
              <p className="text-gray-400">AI 기반 건강 분석 리포트</p>
            </div>
          </div>
        </div>

        {/* 디바이스 상태 확인 카드 */}
        {issueConditions.length > 0 && (
          <Card className="mb-6 bg-red-900/20 border-red-500/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span>측정 조건 확인 필요</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {issueConditions.map(condition => (
                  <div 
                    key={condition.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50"
                  >
                    <div className={`
                      p-1 rounded
                      ${condition.status === 'error' ? 'text-red-400' : 'text-yellow-400'}
                    `}>
                      {condition.status === 'error' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      {condition.icon}
                      <span className="font-medium">{condition.name}:</span>
                    </div>
                    <span className={`
                      ${condition.status === 'error' ? 'text-red-400' : 'text-yellow-400'}
                    `}>
                      {condition.message}
                    </span>
                  </div>
                ))}
              </div>
              
              {!canStartMeasurement && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">
                    위 조건들을 모두 만족해야 정확한 AI 건강 분석이 가능합니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 디바이스 상태 정상 표시 */}
        {canStartMeasurement && (
          <Card className="mb-6 bg-green-900/20 border-green-500/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">모든 측정 조건이 준비되었습니다</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 새로운 측정 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${canStartMeasurement 
                    ? 'bg-blue-500 group-hover:bg-blue-600' 
                    : 'bg-gray-600'
                  }
                `}>
                  <Play className="w-5 h-5 text-white" />
                </div>
                <span>새로운 측정</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">
                1분간 EEG, PPG, ACC 데이터를 측정하여 AI 건강 분석을 받아보세요.
              </p>
              
              {/* 측정 정보 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>측정 시간: 1분</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Brain className="w-4 h-4" />
                  <span>EEG, PPG, ACC 센서 데이터</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>AI 기반 건강 분석</span>
                </div>
              </div>

              <Button 
                onClick={onStartNewMeasurement}
                disabled={!canStartMeasurement}
                className={`
                  w-full text-white
                  ${canStartMeasurement 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                  }
                `}
                size="lg"
              >
                {canStartMeasurement ? '새 측정 시작' : '조건 확인 필요'}
              </Button>
              
              {!canStartMeasurement && (
                <p className="text-xs text-red-400 text-center">
                  디바이스 연결 및 조건을 확인해주세요
                </p>
              )}
              
              {batteryWarning && canStartMeasurement && (
                <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-400 text-center">
                    ⚠️ 베터리가 충분하지 않으면 정확한 측정이 이루어지지 못할 수 있습니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 측정 히스토리 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors">
                  <History className="w-5 h-5 text-white" />
                </div>
                <span>측정 히스토리</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">
                이전 측정 결과와 AI 분석 리포트를 확인하고 재생하세요.
              </p>
              
              {/* 히스토리 정보 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <History className="w-4 h-4" />
                  <span>최대 50개 리포트 저장</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  <span>개인별 분석 결과</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>시간별 변화 추이</span>
                </div>
              </div>

              <Button 
                onClick={onViewHistory}
                variant="outline"
                className="w-full border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                size="lg"
              >
                히스토리 보기
              </Button>
            </CardContent>
          </Card>

          {/* 트렌드 분석 */}
          {onViewTrends && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span>트렌드 분석</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400">
                  시간에 따른 건강 데이터 변화를 차트로 분석하고 인사이트를 얻으세요.
                </p>
                
                {/* 트렌드 정보 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <BarChart3 className="w-4 h-4" />
                    <span>시각적 차트 분석</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Target className="w-4 h-4" />
                    <span>AI 기반 인사이트</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>기간별 필터링</span>
                  </div>
                </div>

                <Button 
                  onClick={onViewTrends}
                  variant="outline"
                  className="w-full border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                  size="lg"
                >
                  트렌드 분석
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 추가 정보 */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-white">AI Health Report 소개</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">🧠 EEG 분석</h4>
                <p className="text-gray-400">
                  집중도, 스트레스, 좌우뇌 균형 등 뇌파 상태를 분석합니다.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">❤️ PPG 분석</h4>
                <p className="text-gray-400">
                  심박수, HRV, 혈중 산소포화도 등 심혈관 상태를 분석합니다.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">🤖 AI 해석</h4>
                <p className="text-gray-400">
                  Gemini 2.5 Flash가 빠르고 정확한 건강 분석 리포트를 제공합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 