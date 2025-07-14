import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Database, FolderOpen, HardDrive, Activity, FileText } from 'lucide-react';
import { useStorageStore } from '../../../stores/storageStore';

interface DataStorageCardProps {
  onOpenDataCenter: () => void;
  onChangeStorage: () => void;
}

export default function DataStorageCard({ onOpenDataCenter }: DataStorageCardProps) {
  const { 
    isInitialized: storageInitialized, 
    storageStats,
    storageStatus,
    currentSession,
    sessions
  } = useStorageStore();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            데이터 저장소
          </CardTitle>
          <Badge variant={storageInitialized ? "default" : "secondary"}>
            {storageInitialized ? "연결됨" : "설정 필요"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-full">
          {/* 상단: 저장소 상태 정보 */}
          <div className="flex-1 space-y-4">
            {/* 저장소 연결 상태 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">저장소 상태</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {storageInitialized ? '연결됨' : '설정 필요'}
                </span>
                <Badge variant={storageInitialized ? "default" : "secondary"}>
                  {storageInitialized ? "준비됨" : "미설정"}
                </Badge>
              </div>
            </div>

            {/* 저장소 용량 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">저장소 용량</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {storageStats.used} / {storageStats.available}
                </span>
                <Badge variant="default">
                  {storageStats.sessions}개 세션
                </Badge>
              </div>
            </div>

            {/* 현재 세션 상태 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">현재 세션</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {currentSession ? '기록 중' : '대기 중'}
                </span>
                <Badge variant={currentSession ? "default" : "secondary"}>
                  {storageStatus.isWriting ? "저장 중" : "대기"}
                </Badge>
              </div>
            </div>
          </div>

          {/* 하단: 바로가기 버튼 */}
          <div className="mt-6 space-y-3">
            <Button 
              onClick={onOpenDataCenter}
              className="w-full h-12 text-base"
              variant="default"
            >
              <FolderOpen className="w-5 h-5 mr-2" />
              Data Center로 이동
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              <p>💡 레코딩, 세션 관리, 파일 형식 선택, 저장소 설정 등의 기능을 제공합니다.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 