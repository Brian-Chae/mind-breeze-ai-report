import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, AlertTriangle, Wifi } from 'lucide-react';
import { 
  useEEGGraphData, 
  usePPGGraphData, 
  useConnectionState,
  useProcessedDataStore
} from '../../../stores/processedDataStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { useIsConnected } from '../../../stores/deviceStore';

interface VisualizerPreviewCardProps {
  onOpenVisualizer: () => void;
  stabilizedEEGValues?: {
    arousal: number | null;
    valence: number | null;
    focus: number | null;
  };
  stabilizedPPGValues?: {
    heartRate: number | null;
    rmssd: number | null;
    sdnn: number | null;
    pnn50: number | null;
    stressIndex: number | null;
    spo2: number | null;
  };
}

export default function VisualizerPreviewCard({ onOpenVisualizer }: VisualizerPreviewCardProps) {
  const eegGraphData = useEEGGraphData();
  const ppgGraphData = usePPGGraphData();
  const connectionState = useConnectionState();
  const { isSensorContacted } = useSensorContactStatus();
  const isConnected = useIsConnected();
  
  // 업데이트 간격 설정 (100ms)
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  // EEG 데이터 준비
  const prepareEEGData = () => {
    if (!eegGraphData || !eegGraphData.fp1.length || !eegGraphData.fp2.length) {
      // 더미 데이터 생성
      return Array.from({ length: 1000 }, (_, i) => ({
        index: i,
        fp1: Math.sin(i * 0.1) * 50 + Math.random() * 20 - 10,
        fp2: Math.cos(i * 0.1) * 40 + Math.random() * 15 - 7.5
      }));
    }

    // 최근 1000개 샘플 표시
    const maxDisplaySamples = 1000;
    const fp1Channel = eegGraphData.fp1;
    const fp2Channel = eegGraphData.fp2;
    
    // 최소 길이 기준으로 데이터 슬라이스
    const minLength = Math.min(fp1Channel.length, fp2Channel.length);
    const startIndex = Math.max(0, minLength - maxDisplaySamples);
    
    const fp1Data = fp1Channel.slice(startIndex);
    const fp2Data = fp2Channel.slice(startIndex);
    
    // 배열 인덱스 기반으로 데이터 결합
    return fp1Data.map((fp1Point: any, index: number) => ({
      index: index,
      fp1: fp1Point.value,
      fp2: fp2Data[index]?.value || 0
    }));
  };

  // PPG 데이터 준비
  const preparePPGData = () => {
    if (!ppgGraphData || !ppgGraphData.red.length || !ppgGraphData.ir.length) {
      // 더미 데이터 생성
      return Array.from({ length: 400 }, (_, i) => ({
        index: i,
        red: Math.sin(i * 0.2) * 100 + Math.random() * 30 - 15,
        ir: Math.cos(i * 0.15) * 80 + Math.random() * 25 - 12.5
      }));
    }

    const redChannel = ppgGraphData.red;
    const irChannel = ppgGraphData.ir;
    
    // 왼쪽 50개 샘플을 제외하고 400개만 사용
    const skipSamples = 50;
    const displaySamples = 400;
    const minLength = Math.min(redChannel.length, irChannel.length);
    
    if (minLength <= skipSamples) {
      return [];
    }
    
    // 왼쪽 50개를 제외한 후 400개만 사용
    const startIndex = skipSamples;
    const endIndex = Math.min(startIndex + displaySamples, minLength);
    
    const redData = redChannel.slice(startIndex, endIndex);
    const irData = irChannel.slice(startIndex, endIndex);
    
    // 배열 인덱스 기반으로 데이터 결합
    return redData.map((redPoint: any, index: number) => ({
      index: index,
      red: redPoint.value,
      ir: irData[index]?.value || 0
    }));
  };

  const finalEEGData = prepareEEGData();
  const finalPPGData = preparePPGData();

  return (
    <Card className="p-4">
      {/* 1x2 그리드 레이아웃 - 왼쪽: EEG, 오른쪽: PPG */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* 왼쪽: EEG 그래프 */}
        <div>
          <h5 className="text-sm font-medium text-neutral-200 mb-2">실시간 필터링된 EEG 신호</h5>
          <div className="bg-neutral-900 border border-gray-300 rounded-lg p-3">
            {/* 경고 메시지 표시 */}
            {!isConnected ? (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <Wifi className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-400 text-sm font-medium">디바이스를 연결해주세요</p>
                </div>
              </div>
            ) : !isSensorContacted ? (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-yellow-400 text-sm font-medium">올바르게 디바이스를 착용해주세요</p>
                </div>
              </div>
            ) : (
              <div className="h-48 rounded" style={{ backgroundColor: 'transparent' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={finalEEGData} 
                    margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="index" 
                      axisLine={true}
                      tickLine={true}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      stroke="#6B7280"
                      type="number"
                      domain={[0, 'dataMax']}
                      hide
                    />
                    <YAxis 
                      domain={[-150, 150]}
                      type="number"
                      allowDataOverflow={false}
                      scale="linear"
                      allowDecimals={false}
                      tickCount={7}
                      ticks={[-150, -100, -50, 0, 50, 100, 150]}
                      axisLine={true}
                      tickLine={true}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      stroke="#6B7280"
                      orientation="left"
                      width={35}
                      includeHidden={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fp1" 
                      stroke="#10b981" 
                      strokeWidth={1.5}
                      dot={false}
                      name="FP1"
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fp2" 
                      stroke="#eab308" 
                      strokeWidth={1.5}
                      dot={false}
                      name="FP2"
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-neutral-400">FP1</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-neutral-400">FP2</span>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: PPG 그래프 */}
        <div>
          <h5 className="text-sm font-medium text-neutral-200 mb-2">실시간 필터링된 PPG 신호</h5>
          <div className="bg-neutral-900 border border-gray-300 rounded-lg p-3">
            {/* 경고 메시지 표시 */}
            {!isConnected ? (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <Wifi className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-400 text-sm font-medium">디바이스를 연결해주세요</p>
                </div>
              </div>
            ) : !isSensorContacted ? (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-yellow-400 text-sm font-medium">올바르게 디바이스를 착용해주세요</p>
                </div>
              </div>
            ) : (
              <div className="h-48 rounded" style={{ backgroundColor: 'transparent' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={finalPPGData} 
                    margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="index" 
                      axisLine={true}
                      tickLine={true}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      stroke="#6B7280"
                      type="number"
                      domain={[0, 'dataMax']}
                      hide
                    />
                    <YAxis 
                      domain={[-250, 250]}
                      type="number"
                      allowDataOverflow={false}
                      scale="linear"
                      allowDecimals={false}
                      tickCount={11}
                      ticks={[-250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250]}
                      axisLine={true}
                      tickLine={true}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      stroke="#6B7280"
                      orientation="left"
                      width={35}
                      includeHidden={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="red" 
                      stroke="#ef4444" 
                      strokeWidth={1.5}
                      dot={false}
                      name="Red 채널"
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ir" 
                      stroke="#7c3aed" 
                      strokeWidth={1.5}
                      dot={false}
                      name="IR 채널"
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-neutral-400">Red 채널</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-neutral-400">IR 채널</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizer로 이동 버튼 */}
      <div className="flex justify-center">
        <Button 
          onClick={onOpenVisualizer}
          className="w-full h-16 text-lg font-semibold justify-center gap-4 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Eye className="w-6 h-6" />
          Visualizer로 이동
        </Button>
      </div>
    </Card>
  );
} 