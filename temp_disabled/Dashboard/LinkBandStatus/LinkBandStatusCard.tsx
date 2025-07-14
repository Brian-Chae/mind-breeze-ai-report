import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Bluetooth, Monitor, Link, Battery, Wifi, Activity } from 'lucide-react';
import { useConnectionState, useCurrentDevice, useBatteryInfo, useSamplingRates } from '../../../stores/deviceStore';

interface LinkBandStatusCardProps {
  onNavigateToLinkBand: () => void;
}

export default function LinkBandStatusCard({ onNavigateToLinkBand }: LinkBandStatusCardProps) {
  const connectionState = useConnectionState();
  const currentDevice = useCurrentDevice();
  const batteryInfo = useBatteryInfo();
  const samplingRates = useSamplingRates();
  const isConnected = connectionState.status === 'connected';

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bluetooth className="w-5 h-5" />
            LINK BAND 연결 및 착용
          </CardTitle>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "연결됨" : "연결 안됨"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-full">
          {/* 상단: 상태 정보 */}
          <div className="flex-1 space-y-4">
            {/* 배터리 정보 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">배터리</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {isConnected && batteryInfo?.level ? `${batteryInfo.level}%` : 'N/A'}
                </span>
                <Badge variant={
                  !isConnected ? "secondary" :
                  (batteryInfo?.level || 0) > 50 ? "default" :
                  (batteryInfo?.level || 0) > 20 ? "destructive" : "destructive"
                }>
                  {!isConnected ? "연결 안됨" :
                   (batteryInfo?.level || 0) > 50 ? "정상" :
                   (batteryInfo?.level || 0) > 20 ? "낮음" : "매우 낮음"}
                </Badge>
              </div>
            </div>

            {/* 연결 상태 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">연결 상태</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {isConnected ? '연결됨' : '연결 안됨'}
                </span>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "온라인" : "오프라인"}
                </Badge>
              </div>
            </div>

            {/* 샘플링 레이트 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">샘플링 레이트</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {isConnected && samplingRates?.eeg ? `${samplingRates.eeg}Hz` : 'N/A'}
                </span>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "활성" : "비활성"}
                </Badge>
              </div>
            </div>
          </div>

          {/* 하단: 바로가기 버튼 */}
          <div className="mt-6 space-y-3">
            <Button 
              onClick={onNavigateToLinkBand}
              className="w-full h-12 text-base"
              variant="default"
            >
              <Monitor className="w-5 h-5 mr-2" />
              LINK BAND로 이동
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              <p>💡 디바이스 연결, 센서 설정, 상태 모니터링 등의 기능을 제공합니다.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 