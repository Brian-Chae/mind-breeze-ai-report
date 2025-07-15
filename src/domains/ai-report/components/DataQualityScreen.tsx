import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Progress } from '@ui/progress';
import { CheckCircle2, AlertCircle, Activity } from 'lucide-react';

import type { DataQualityMetrics } from '../types';

interface DataQualityScreenProps {
  onQualityConfirmed: () => void;
  onError: (error: string) => void;
  dataQuality: DataQualityMetrics;
}

export function DataQualityScreen({ onQualityConfirmed, onError, dataQuality }: DataQualityScreenProps) {
  const [isMonitoring, setIsMonitoring] = useState(true);

  const qualityThreshold = 80; // 80% 이상이어야 좋은 품질
  const isGoodQuality = dataQuality.overallQuality >= qualityThreshold;

  const handleConfirm = useCallback(() => {
    if (!isGoodQuality) {
      onError('신호 품질이 좋지 않습니다. 디바이스 착용을 확인해주세요.');
      return;
    }
    onQualityConfirmed();
  }, [isGoodQuality, onQualityConfirmed, onError]);

  useEffect(() => {
    // TODO: Visualizer 데이터 구독 및 품질 모니터링 구현
    const interval = setInterval(() => {
      // 임시 랜덤 데이터
      // setDataQuality({
      //   eegQuality: Math.random() * 100,
      //   ppgQuality: Math.random() * 100,
      //   accQuality: Math.random() * 100,
      //   overallQuality: Math.random() * 100
      // });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getQualityStatus = (quality: number) => {
    if (quality >= 80) return { status: 'good', color: 'text-green-600', icon: CheckCircle2 };
    if (quality >= 60) return { status: 'medium', color: 'text-yellow-600', icon: AlertCircle };
    return { status: 'poor', color: 'text-red-600', icon: AlertCircle };
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Activity className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          디바이스 착용 확인
        </h2>
        <p className="text-gray-700">
          디바이스가 올바르게 착용되었는지 신호 품질을 확인하세요.
        </p>
      </div>

      {/* 전체 품질 */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
            전체 신호 품질
            <span className={`text-lg font-bold ${isGoodQuality ? 'text-green-600' : 'text-red-600'}`}>
              {Math.round(dataQuality.overallQuality)}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={dataQuality.overallQuality} 
            className="w-full"
          />
          <p className="text-sm text-gray-600 mt-2">
            {isGoodQuality ? '측정 준비 완료' : '디바이스 착용 상태를 확인해주세요'}
          </p>
        </CardContent>
      </Card>

      {/* 센서별 품질 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* EEG 품질 */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">EEG 신호</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-medium">품질</span>
                <span className={`text-sm font-medium ${getQualityStatus(dataQuality.eegQuality).color}`}>
                  {Math.round(dataQuality.eegQuality)}%
                </span>
              </div>
              <Progress value={dataQuality.eegQuality} className="h-2" />
              <div className="flex items-center">
                {React.createElement(getQualityStatus(dataQuality.eegQuality).icon, { 
                  className: `w-4 h-4 mr-2 ${getQualityStatus(dataQuality.eegQuality).color}` 
                })}
                <span className="text-xs text-gray-600">뇌파 센서</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PPG 품질 */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">PPG 신호</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-medium">품질</span>
                <span className={`text-sm font-medium ${getQualityStatus(dataQuality.ppgQuality).color}`}>
                  {Math.round(dataQuality.ppgQuality)}%
                </span>
              </div>
              <Progress value={dataQuality.ppgQuality} className="h-2" />
              <div className="flex items-center">
                {React.createElement(getQualityStatus(dataQuality.ppgQuality).icon, { 
                  className: `w-4 h-4 mr-2 ${getQualityStatus(dataQuality.ppgQuality).color}` 
                })}
                <span className="text-xs text-gray-600">심박 센서</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACC 품질 */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">ACC 신호</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-medium">품질</span>
                <span className={`text-sm font-medium ${getQualityStatus(dataQuality.accQuality).color}`}>
                  {Math.round(dataQuality.accQuality)}%
                </span>
              </div>
              <Progress value={dataQuality.accQuality} className="h-2" />
              <div className="flex items-center">
                {React.createElement(getQualityStatus(dataQuality.accQuality).icon, { 
                  className: `w-4 h-4 mr-2 ${getQualityStatus(dataQuality.accQuality).color}` 
                })}
                <span className="text-xs text-gray-600">가속도 센서</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 안내 메시지 */}
      <Card className={`border-2 shadow-sm ${isGoodQuality ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardContent className="pt-6">
          <div className="flex items-start">
            {isGoodQuality ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${isGoodQuality ? 'text-green-800' : 'text-yellow-800'}`}>
                {isGoodQuality ? '측정 준비 완료!' : '착용 상태를 확인하세요'}
              </p>
              <p className={`text-sm mt-1 ${isGoodQuality ? 'text-green-700' : 'text-yellow-700'}`}>
                {isGoodQuality 
                  ? '모든 센서의 신호 품질이 양호합니다. 측정을 시작할 수 있습니다.'
                  : '디바이스를 올바르게 착용하고 움직임을 최소화해주세요.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={handleConfirm}
          disabled={!isGoodQuality}
          className={`px-8 py-3 font-semibold ${
            isGoodQuality 
              ? 'text-white bg-blue-500 hover:bg-blue-600' 
              : 'text-gray-500 bg-gray-200 cursor-not-allowed'
          }`}
        >
          {isGoodQuality ? '측정 시작' : '신호 품질 개선 필요'}
        </Button>
      </div>
    </div>
  );
} 